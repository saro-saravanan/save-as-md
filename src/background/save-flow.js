import { folderNameFor } from '../lib/filenames.js';
import { normalizeForDedupe } from '../lib/urls.js';
import { assembleDocument, remoteResults } from '../lib/assemble.js';
import { joinPath, vscodeFileUrl } from '../lib/paths.js';

const PROTECTED = /cannot access|cannot be scripted|chrome:\/\/|chrome-extension:\/\/|extensions gallery|webstore/i;
const PROTECTED_TEXT = "This page can't be saved: the browser doesn't allow extensions on it.";
const EMPTY_TEXT = "Couldn't find anything to save here. Right-click the SaveMD button → Pick an area to save…";
const fmt = (n) => n.toLocaleString('en-US');
const hostOf = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

export function createSaveFlow(deps) {
  return { save };

  // The page may be gone by the time a notice is answered (tab closed, link followed): treat as dismissed.
  async function quietToast(tabId, toast) {
    try {
      return await deps.page.toast(tabId, toast);
    } catch {
      return null;
    }
  }

  async function save(tab, opts = {}) {
    try {
      await deps.clearBadge(tab.id);
      return await run(tab, opts);
    } catch (err) {
      await report(tab, err);
      return { status: 'error' };
    }
  }

  async function run(tab, { scope = 'page', dest = 'default' }) {
    const settings = await deps.settings.get();
    const target = await resolveTarget(dest, settings);
    if (!target) {
      await deps.page.toast(tab.id, { tone: 'error', text: 'Not saved — no folder chosen.' });
      return { status: 'cancelled' };
    }

    const mode = settings.siteModes[hostOf(tab.url)] || 'auto';
    const res = await deps.page.capture(tab.id, { scope, mode, redditMode: settings.redditMode });
    if (res.cancelled) return { status: 'cancelled' };
    if (res.protectedPage) {
      await deps.badge(tab.id, PROTECTED_TEXT);
      return { status: 'error' };
    }
    if (res.error) {
      await deps.page.toast(tab.id, { tone: 'error', text: `Couldn't save: ${res.error}` });
      return { status: 'error' };
    }
    const capture = res.capture;
    if (capture.wordCount < 5 && capture.images.length === 0) {
      await deps.page.toast(tab.id, { tone: 'error', text: EMPTY_TEXT });
      return { status: 'empty' };
    }

    if (target.kind === 'clipboard') {
      await deps.offscreen.copy(assembleDocument(capture, remoteResults(capture.images)));
      await deps.page.toast(tab.id, { tone: 'ok', text: `Copied as Markdown · ${fmt(capture.wordCount)} words` });
      return { status: 'copied' };
    }
    return saveToDisk(tab, { scope, target, capture, settings, fellBack: mode === 'auto' && capture.modeUsed === 'full' });
  }

  async function resolveTarget(dest, settings) {
    if (dest === 'clipboard') return { kind: 'clipboard' };
    if (dest === 'downloads' || (dest === 'default' && settings.destination === 'downloads')) return { kind: 'downloads' };
    if (dest === 'oneoff') return (await deps.folders.pick('oneoff')) ? { kind: 'folder', key: 'oneoff' } : null;
    const state = await deps.offscreen.checkPermission('default');
    if (state === 'granted') return { kind: 'folder', key: 'default' };
    const ok = await deps.folders.pick(state === 'missing' ? 'default' : 'regrant');
    return ok ? { kind: 'folder', key: 'default' } : null;
  }

  async function saveToDisk(tab, { scope, target, capture, settings, fellBack }) {
    const key = normalizeForDedupe(tab.url);
    const targetId = target.kind === 'folder' ? `folder:${target.key}` : target.kind;
    const remember = scope === 'page' && target.key !== 'oneoff';
    const previous = remember ? settings.saved[key] : null;

    let replace = false;
    if (previous && previous.target === targetId) {
      const choice = await quietToast(tab.id, {
        tone: 'ask',
        text: `You saved this page on ${previous.savedAt.slice(0, 10)}.`,
        actions: [{ id: 'update', label: 'Update existing' }, { id: 'new', label: 'Save new copy' }],
        timeoutMs: 20000,
      });
      if (!choice) return { status: 'cancelled' };
      replace = choice === 'update';
    }

    const now = deps.now();
    let folderName = replace ? previous.folderName : folderNameFor(now, capture.title);
    // Downloads overwrites on a name clash, so pick a folder name that isn't taken yet.
    if (!replace && target.kind === 'downloads') folderName = await deps.downloads.freeFolderName(folderName);

    const jobId = deps.newId();
    const { failedUrls, usable = 0 } = await deps.offscreen.fetchImages(jobId, capture.images);
    const pageData = {};
    if (failedUrls.length) {
      for (const r of await deps.page.fetchInPage(tab.id, failedUrls)) if (r.dataUrl) pageData[r.url] = r.dataUrl;
    }
    if (capture.wordCount < 5 && usable + Object.keys(pageData).length === 0) {
      await quietToast(tab.id, { tone: 'error', text: EMPTY_TEXT });
      return { status: 'empty' };
    }
    const writeTarget = target.kind === 'folder' ? { kind: 'folder', key: target.key } : { kind: 'downloads' };
    const result = await deps.offscreen.write({ jobId, capture, target: writeTarget, folderName, replace, pageData });

    let downloadIds = null;
    if (target.kind === 'downloads') {
      if (replace && previous.downloadIds) await deps.downloads.remove(previous.downloadIds);
      downloadIds = await deps.downloads.write(result.folderName, result.blobFiles);
    }

    if (remember) {
      const { saved } = await deps.settings.get();
      await deps.settings.patch({
        saved: { ...saved, [key]: { target: targetId, folderName: result.folderName, markdownFile: result.markdownFile, savedAt: now.toISOString(), downloadIds } },
      });
    }

    const openUrl = await openUrlFor(target, result, downloadIds, settings);
    const choice = await quietToast(tab.id, savedToast(capture, result.stats, { openUrl, downloads: target.kind === 'downloads', fellBack }));
    if (choice === 'open') await deps.openExternal(tab.id, openUrl);
    if (choice === 'folder') deps.downloads.show(downloadIds.at(-1));
    if (choice === 'undo') await undo(tab, { target, result, downloadIds, key, remember });
    return { status: 'saved', folderName: result.folderName, stats: result.stats };
  }

  async function openUrlFor(target, result, downloadIds, settings) {
    if (target.kind === 'downloads') {
      const path = await deps.downloads.absolutePath(downloadIds.at(-1));
      return path ? vscodeFileUrl(path) : null;
    }
    if (target.key === 'default' && settings.folderPath) {
      return vscodeFileUrl(joinPath(settings.folderPath, result.folderName, result.markdownFile));
    }
    return null;
  }

  async function undo(tab, { target, result, downloadIds, key, remember }) {
    if (target.kind === 'downloads') await deps.downloads.remove(downloadIds);
    else await deps.offscreen.remove(target.key, result.folderName);
    if (remember) {
      const saved = { ...(await deps.settings.get()).saved };
      delete saved[key];
      await deps.settings.patch({ saved });
    }
    await quietToast(tab.id, { tone: 'ok', text: 'Removed.', timeoutMs: 3000 });
  }

  async function report(tab, err) {
    const message = err?.message || String(err);
    if (PROTECTED.test(message)) {
      await deps.badge(tab.id, PROTECTED_TEXT);
      return;
    }
    try {
      await deps.page.toast(tab.id, { tone: 'error', text: `Couldn't save: ${message}` });
    } catch {
      await deps.badge(tab.id, `Couldn't save: ${message}`);
    }
  }
}

function savedToast(capture, stats, { openUrl, downloads, fellBack }) {
  const parts = [];
  let tone = 'ok';
  if (stats.failed > 0) {
    tone = 'warn';
    parts.push('Saved with warnings', stats.failed === 1 ? '1 image not saved (linked to original)' : `${stats.failed} images not saved (linked to originals)`);
  } else {
    parts.push('Saved', `${fmt(capture.wordCount)} words`);
    if (stats.total) parts.push(`${stats.saved}/${stats.total} images`);
  }
  if (fellBack) parts.push('full page');
  const actions = [];
  if (openUrl) actions.push({ id: 'open', label: 'Open in VS Code' });
  if (downloads) actions.push({ id: 'folder', label: 'Show folder' });
  actions.push({ id: 'undo', label: 'Undo' });
  return { tone, text: parts.join(' · '), actions };
}
