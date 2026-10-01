import { runCapture } from './capture.js';
import { showToast } from './toast.js';
import { pickElement } from './picker.js';

// Injected only when no live copy answers a ping (see page-client.js). Replace any older listener
// rather than skipping: after an extension reload the old one is orphaned and can no longer reply.
try {
  if (window.__savemdListener) chrome.runtime.onMessage.removeListener(window.__savemdListener);
} catch {
  // The old listener belonged to an invalidated extension context; nothing to remove.
}
window.__savemdListener = (msg, _sender, sendResponse) => {
  if (msg?.type === 'ping') {
    sendResponse('pong');
    return false;
  }
  // Picking an area or answering a notice can outlast the service worker's 30 s idle timeout;
  // a pending reply doesn't count as activity, so ping it while we wait.
  const keepalive = setInterval(() => chrome.runtime.sendMessage({ type: 'keepalive' }).catch(() => {}), 20000);
  handle(msg)
    .then(sendResponse, (err) => sendResponse({ error: err?.message || String(err) }))
    .finally(() => clearInterval(keepalive));
  return true;
};
chrome.runtime.onMessage.addListener(window.__savemdListener);

async function handle(msg) {
  if (msg.type === 'capture') {
    return runCapture(msg, { doc: document, url: location.href, fetchImpl: (...a) => fetch(...a), pickElement, selectionHtml });
  }
  if (msg.type === 'toast') return showToast(msg.toast);
  if (msg.type === 'fetch-in-page') return fetchInPage(msg.urls);
  return { error: `Unknown message: ${msg.type}` };
}

function selectionHtml() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return '';
  const div = document.createElement('div');
  for (let i = 0; i < sel.rangeCount; i++) div.append(sel.getRangeAt(i).cloneContents());
  return div.innerHTML;
}

// Retry for images the extension could not fetch (hotlink/referrer protection).
function fetchInPage(urls) {
  return Promise.all(urls.map(async (url) => {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return { url, dataUrl: null };
      return { url, dataUrl: await blobToDataUrl(await res.blob()) };
    } catch {
      return { url, dataUrl: null };
    }
  }));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
