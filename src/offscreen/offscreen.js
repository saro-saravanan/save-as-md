import { fetchImages, planFiles, JobStore } from './writer.js';

const pending = new JobStore(); // jobId → fetched images, kept here so Blobs never cross messaging

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== 'offscreen') return false;
  handle(msg.type, msg.payload ?? {}).then(sendResponse, (err) => sendResponse({ ok: false, error: err?.message || String(err) }));
  return true;
});

async function handle(type, msg) {
  switch (type) {
    case 'fetch-images': {
      const fetched = await fetchImages(msg.images);
      pending.set(msg.jobId, fetched);
      return {
        failedUrls: msg.images.filter((img, i) => !fetched[i].ok && img.url).map((img) => img.url),
        usable: fetched.filter((f) => f.ok && !f.tiny).length,
      };
    }
    case 'write':
      return write(msg);
    case 'copy':
      copyText(msg.text);
      return { ok: true };
    case 'revoke-urls':
      msg.urls.forEach((u) => URL.revokeObjectURL(u));
      return { ok: true };
    default:
      return { ok: false, error: `Unknown offscreen message: ${type}` };
  }
}

// Builds the files and hands them back as blob URLs; the service worker downloads them.
async function write({ jobId, capture, pageData = {} }) {
  const fetched = pending.take(jobId) || [];
  await Promise.all(capture.images.map(async (img, i) => {
    const dataUrl = img.url && pageData[img.url];
    if (!fetched[i]?.ok && dataUrl) fetched[i] = { ok: true, blob: await (await fetch(dataUrl)).blob() };
  }));
  const { files, stats, markdownFile } = planFiles(capture, fetched);
  const blobFiles = files.map((f) => ({ path: f.path, url: URL.createObjectURL(f.blob) }));
  return { ok: true, markdownFile, stats, blobFiles };
}

function copyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.append(ta);
  ta.select();
  const copied = document.execCommand('copy');
  ta.remove();
  if (!copied) throw new Error('Chrome did not allow copying to the clipboard.');
}
