import { folderNameFor, datePrefix } from '../lib/filenames.js';
import { normalizeForDedupe } from '../lib/urls.js';
import { assembleDocument, remoteResults } from '../lib/assemble.js';

// Saves always go through Chrome's downloads into Downloads\WebClips. Chrome's folder-picker
// permission doesn't survive for extensions (it lasts only while an extension tab is open), so
// people who want another folder link WebClips to it instead (the command on the Options page).

const PROTECTED = /cannot access|cannot be scripted|chrome:\/\/|chrome-extension:\/\/|extensions gallery|webstore/i;
const PROTECTED_TEXT = "This page can't be saved: the browser doesn't allow extensions on it.";
const FILE_URL_TEXT = 'To save local files, turn on "Allow access to file URLs" for SaveMD in chrome://extensions.';
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

  async function run(tab, { scope = 'page', dest = 'downloads' }) {
    // Fail fast (with a badge) on pages the browser protects.
    await deps.page.probe(tab.id);
    const settings = await deps.settings.get();
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

    if (dest === 'clipboard') {
      await deps.offscreen.copy(assembleDocument(capture, remoteResults(capture.images)));
      await deps.page.toast(tab.id, { tone: 'ok', text: `Copied as Markdown · ${fmt(capture.wordCount)} words` });
      return { status: 'copied' };
    }
    return saveToDownloads(tab, { scope, capture, settings, fellBack: mode === 'auto' && capture.modeUsed === 'full' });
  }

  async function saveToDownloads(tab, { scope, capture, settings, fellBack }) {
    const key = normalizeForDedupe(tab.url);
    const remember = scope === 'page';
    const previous = remember ? settings.saved[key] : null;

    let replace = false;
    if (previous) {
      const choice = await quietToast(tab.id, {
        tone: 'ask',
        text: `You saved this page on ${datePrefix(new Date(previous.savedAt))}.`, // local date, like folder names
        actions: [{ id: 'update', label: 'Update existing' }, { id: 'new', label: 'Save new copy' }],
        timeoutMs: 20000,
      });
      if (!choice) return { status: 'cancelled' };
      replace = choice === 'update';
    }

    const now = deps.now();
    // Downloads overwrites on a name clash, so a new save gets a folder name that isn't taken yet.
    const folderName = replace ? previous.folderName : await deps.downloads.freeFolderName(folderNameFor(now, capture.title));

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
    const result = await deps.offscreen.write({ jobId, capture, pageData });

    if (replace && previous.downloadIds) await deps.downloads.remove(previous.downloadIds);
    const downloadIds = await deps.downloads.write(folderName, result.blobFiles);

    if (remember) {
      const { saved } = await deps.settings.get();
      await deps.settings.patch({
        saved: { ...saved, [key]: { folderName, markdownFile: result.markdownFile, savedAt: now.toISOString(), downloadIds } },
      });
    }

    // The Markdown file is downloaded last, so the last id is the .md. 'open' needs no work here:
    // the Open button is an extension page that opens the file itself (see open.html).
    const mdDownloadId = downloadIds.at(-1);
    const choice = await quietToast(tab.id, savedToast(capture, result.stats, { mdDownloadId, fellBack, replace }));
    if (choice === 'folder') deps.downloads.show(mdDownloadId);
    if (choice === 'undo') await undo(tab, { downloadIds, key, remember, replace });
    return { status: 'saved', folderName, stats: result.stats };
  }

  async function undo(tab, { downloadIds, key, remember, replace }) {
    await deps.downloads.remove(downloadIds);
    if (remember) {
      const saved = { ...(await deps.settings.get()).saved };
      delete saved[key];
      await deps.settings.patch({ saved });
    }
    // After "Update existing" the previous version is already gone, so say Deleted, not Removed.
    // Chrome's downloads API deletes files but not the folders they were in.
    const text = `${replace ? 'Deleted.' : 'Removed.'} Chrome leaves the empty folder in Downloads\\WebClips.`;
    await quietToast(tab.id, { tone: 'ok', text, timeoutMs: 4000 });
  }

  async function report(tab, err) {
    const message = err?.message || String(err);
    if (/file:\/\//i.test(message)) {
      await deps.badge(tab.id, FILE_URL_TEXT);
      return;
    }
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

function savedToast(capture, stats, { mdDownloadId, fellBack, replace }) {
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
  // Chrome opens a download only from a click inside the extension's own UI, so this button is
  // rendered as an embedded extension page rather than a plain button in the web page.
  actions.push({ id: 'open', label: 'Open', frame: { path: 'open.html', downloadId: mdDownloadId } });
  actions.push({ id: 'folder', label: 'Show folder' });
  actions.push({ id: 'undo', label: replace ? 'Delete' : 'Undo' });
  return { tone, text: parts.join(' · '), actions };
}
