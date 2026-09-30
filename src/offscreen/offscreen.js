import { getHandle } from '../lib/handle-store.js';
import { fetchImages, planFiles, writeFolder } from './writer.js';

const pending = new Map(); // jobId → fetched images, kept here so Blobs never cross messaging

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== 'offscreen') return false;
  handle(msg).then(sendResponse, (err) => sendResponse({ ok: false, error: err?.message || String(err) }));
  return true;
});

async function handle(msg) {
  switch (msg.type) {
    case 'check-permission': {
      const h = await getHandle(msg.key);
      return { state: h ? await h.queryPermission({ mode: 'readwrite' }) : 'missing' };
    }
    case 'fetch-images': {
      const fetched = await fetchImages(msg.images);
      pending.set(msg.jobId, fetched);
      return { failedUrls: msg.images.filter((img, i) => !fetched[i].ok && img.url).map((img) => img.url) };
    }
    case 'write':
      return write(msg);
    case 'remove': {
      const h = await getHandle(msg.key);
      await h.removeEntry(msg.folderName, { recursive: true });
      return { ok: true };
    }
    case 'copy':
      copyText(msg.text);
      return { ok: true };
    case 'revoke-urls':
      msg.urls.forEach((u) => URL.revokeObjectURL(u));
      return { ok: true };
    default:
      return { ok: false, error: `Unknown offscreen message: ${msg.type}` };
  }
}

async function write({ jobId, capture, target, folderName, replace, pageData = {} }) {
  const fetched = pending.get(jobId) || [];
  pending.delete(jobId);
  await Promise.all(capture.images.map(async (img, i) => {
    const dataUrl = img.url && pageData[img.url];
    if (!fetched[i]?.ok && dataUrl) fetched[i] = { ok: true, blob: await (await fetch(dataUrl)).blob() };
  }));
  const { files, stats, markdownFile } = planFiles(capture, fetched);

  if (target.kind === 'folder') {
    const root = await getHandle(target.key);
    if (!root || (await root.queryPermission({ mode: 'readwrite' })) !== 'granted') {
      return { ok: false, error: 'Chrome no longer allows access to the save folder. Save again to re-allow it.' };
    }
    const savedAs = await writeFolder(root, folderName, files, { replace });
    return { ok: true, folderName: savedAs, markdownFile, stats };
  }
  const blobFiles = files.map((f) => ({ path: f.path, url: URL.createObjectURL(f.blob) }));
  return { ok: true, folderName, markdownFile, stats, blobFiles };
}

function copyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.append(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}
