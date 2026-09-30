import { offscreenApi } from './offscreen-client.js';
import { withSuffix } from '../lib/filenames.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const downloadsWriter = {
  async write(folderName, blobFiles) {
    const ordered = [...blobFiles].sort((a, b) => Number(a.path.endsWith('.md')) - Number(b.path.endsWith('.md')));
    await chrome.downloads.setUiOptions({ enabled: false }).catch(() => {});
    try {
      const ids = [];
      for (const f of ordered) {
        // Chrome's downloads API rejects leading-dot names; .source.html becomes _source.html here.
        const name = f.path.split('/').map((p) => p.replace(/^\./, '_')).join('/');
        ids.push(await chrome.downloads.download({ url: f.url, filename: `WebClips/${folderName}/${name}`, conflictAction: 'overwrite', saveAs: false }));
      }
      await Promise.all(ids.map(waitForDownload));
      return ids;
    } finally {
      await chrome.downloads.setUiOptions({ enabled: true }).catch(() => {});
      await offscreenApi.revoke(blobFiles.map((f) => f.url)).catch(() => {});
    }
  },
  async remove(ids) {
    for (const id of ids ?? []) {
      await chrome.downloads.removeFile(id).catch(() => {});
      await chrome.downloads.erase({ id });
    }
  },
  // Downloads overwrites on name clashes, so find a WebClips folder name with no existing files.
  async freeFolderName(name) {
    for (let n = 1; ; n++) {
      const candidate = withSuffix(name, n);
      const taken = await chrome.downloads.search({ filenameRegex: `WebClips[\\\\/]${escapeRegex(candidate)}[\\\\/]`, exists: true });
      if (!taken.length) return candidate;
    }
  },
  async absolutePath(id) {
    const [item] = await chrome.downloads.search({ id });
    return item?.filename ?? null;
  },
  show(id) {
    chrome.downloads.show(id);
  },
};

function waitForDownload(id) {
  return new Promise((resolve, reject) => {
    const done = (fn) => { chrome.downloads.onChanged.removeListener(listener); fn(); };
    const listener = (delta) => {
      if (delta.id !== id || !delta.state) return;
      if (delta.state.current === 'complete') done(resolve);
      if (delta.state.current === 'interrupted') done(() => reject(new Error('A file could not be written to Downloads.')));
    };
    chrome.downloads.onChanged.addListener(listener);
    chrome.downloads.search({ id }).then(([item]) => { if (item?.state === 'complete') done(resolve); });
  });
}
