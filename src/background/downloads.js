import { withSuffix } from '../lib/filenames.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function createDownloadsWriter(api, offscreen, { timeoutMs = 120000 } = {}) {
  function waitForDownload(id) {
    return new Promise((resolve, reject) => {
      const done = (fn) => {
        clearTimeout(timer);
        api.downloads.onChanged.removeListener(listener);
        fn();
      };
      const listener = (delta) => {
        if (delta.id !== id || !delta.state) return;
        if (delta.state.current === 'complete') done(resolve);
        if (delta.state.current === 'interrupted') done(() => reject(new Error('A file could not be written to Downloads.')));
      };
      // A paused or stuck download would otherwise leave the save hanging forever.
      const timer = setTimeout(() => done(() => reject(new Error('A download did not finish in time.'))), timeoutMs);
      api.downloads.onChanged.addListener(listener);
      api.downloads.search({ id }).then(([item]) => { if (item?.state === 'complete') done(resolve); }, () => {});
    });
  }

  return {
    async write(folderName, blobFiles) {
      const ordered = [...blobFiles].sort((a, b) => Number(a.path.endsWith('.md')) - Number(b.path.endsWith('.md')));
      await api.downloads.setUiOptions({ enabled: false }).catch(() => {});
      try {
        const ids = [];
        for (const f of ordered) {
          // Chrome's downloads API rejects leading-dot names; .source.html becomes _source.html here.
          const name = f.path.split('/').map((p) => p.replace(/^\./, '_')).join('/');
          ids.push(await api.downloads.download({ url: f.url, filename: `WebClips/${folderName}/${name}`, conflictAction: 'overwrite', saveAs: false }));
        }
        // Wait for all of them: the blob URLs must stay valid until every download has read its file.
        const results = await Promise.allSettled(ids.map(waitForDownload));
        const failed = results.find((r) => r.status === 'rejected');
        if (failed) throw failed.reason;
        return ids;
      } finally {
        await api.downloads.setUiOptions({ enabled: true }).catch(() => {});
        await offscreen.revoke(blobFiles.map((f) => f.url)).catch(() => {});
      }
    },
    async remove(ids) {
      for (const id of ids ?? []) {
        await api.downloads.removeFile(id).catch(() => {});
        await api.downloads.erase({ id });
      }
    },
    // Downloads overwrites on name clashes, so find a WebClips folder name with no existing files.
    async freeFolderName(name) {
      for (let n = 1; ; n++) {
        const candidate = withSuffix(name, n);
        const taken = await api.downloads.search({ filenameRegex: `WebClips[\\\\/]${escapeRegex(candidate)}[\\\\/]`, exists: true });
        if (!taken.length) return candidate;
      }
    },
    async absolutePath(id) {
      const [item] = await api.downloads.search({ id });
      return item?.filename ?? null;
    },
    show(id) {
      api.downloads.show(id);
    },
  };
}
