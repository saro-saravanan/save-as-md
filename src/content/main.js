import { runCapture } from './capture.js';
import { showToast } from './toast.js';
import { pickElement } from './picker.js';

// Injected on every save; install the listener only once per page.
if (!window.__savemdLoaded) {
  window.__savemdLoaded = true;
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // Picking an area or answering a notice can outlast the service worker's 30 s idle timeout;
    // a pending reply doesn't count as activity, so ping it while we wait.
    const keepalive = setInterval(() => chrome.runtime.sendMessage({ type: 'keepalive' }).catch(() => {}), 20000);
    handle(msg)
      .then(sendResponse, (err) => sendResponse({ error: err?.message || String(err) }))
      .finally(() => clearInterval(keepalive));
    return true;
  });
}

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
