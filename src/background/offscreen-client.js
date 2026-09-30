let creating = null;

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  creating ??= chrome.offscreen
    .createDocument({ url: 'offscreen.html', reasons: ['BLOBS', 'CLIPBOARD'], justification: 'Write saved pages to the chosen folder and copy Markdown to the clipboard.' })
    .finally(() => { creating = null; });
  await creating;
}

async function call(type, payload = {}) {
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({ target: 'offscreen', type, ...payload });
  if (res?.ok === false) throw new Error(res.error);
  return res;
}

export const offscreenApi = {
  checkPermission: async (key) => (await call('check-permission', { key })).state,
  fetchImages: (jobId, images) => call('fetch-images', { jobId, images }),
  write: (args) => call('write', args),
  remove: (key, folderName) => call('remove', { key, folderName }),
  copy: (text) => call('copy', { text }),
  revoke: (urls) => call('revoke-urls', { urls }),
};
