const HOST_ID = 'savemd-toast-host';
const CSS = `
  .toast { position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; display: flex; align-items: center; gap: 12px;
    max-width: 520px; padding: 10px 12px 10px 14px; border-radius: 8px; border: 1px solid #3d444d;
    background: #1f2328; color: #f0f3f6; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,.25); }
  .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: #3fb950; }
  .warn .dot { background: #d29922; }
  .error .dot { background: #f85149; }
  .ask .dot { background: #4493f8; }
  .text { flex: 1; }
  .actions { display: flex; gap: 6px; }
  button { font: inherit; color: #f0f3f6; background: #30363d; border: 0; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
  button:hover { background: #484f58; }
  .close { background: transparent; padding: 2px 6px; font-size: 16px; }
  iframe { border: 0; width: 56px; height: 26px; background: transparent; color-scheme: normal; }
`;

let current = null;

// A constructed stylesheet isn't subject to the page's style-src CSP the way an inline <style> is.
function applyStyles(root, doc) {
  if (typeof CSSStyleSheet === 'function' && 'replaceSync' in CSSStyleSheet.prototype) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    root.adoptedStyleSheets = [sheet];
    return;
  }
  const style = doc.createElement('style');
  style.textContent = CSS;
  root.prepend(style);
}

const defaultResolveUrl = (path) => chrome.runtime.getURL(path);

export function showToast({ tone = 'ok', text, actions = [], timeoutMs = 8000 }, doc = document, { resolveUrl = defaultResolveUrl } = {}) {
  current?.close(null);
  return new Promise((resolve) => {
    const host = doc.createElement('div');
    host.id = HOST_ID;
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<div class="toast ${tone}" role="status"><span class="dot" aria-hidden="true"></span><span class="text"></span><span class="actions"></span><button class="close" aria-label="Dismiss">×</button></div>`;
    applyStyles(root, doc);
    root.querySelector('.text').textContent = text;
    // Buttons that need a click inside the extension's own UI (Chrome requires it to open a download)
    // are embedded extension pages; they post 'action-done' when used.
    const frames = new Map();
    for (const action of actions) {
      if (action.frame) {
        const frame = doc.createElement('iframe');
        frame.src = resolveUrl(`${action.frame.path}#${action.frame.downloadId}`);
        frame.title = action.label;
        frame.dataset.id = action.id;
        root.querySelector('.actions').append(frame);
        frames.set(frame, action.id);
        continue;
      }
      const btn = doc.createElement('button');
      btn.textContent = action.label;
      btn.dataset.id = action.id;
      btn.addEventListener('click', () => close(action.id));
      root.querySelector('.actions').append(btn);
    }
    const onMessage = (event) => {
      if (event.data?.savemd !== 'action-done') return;
      for (const [frame, id] of frames) if (event.source === frame.contentWindow) close(id);
    };
    if (frames.size) doc.defaultView.addEventListener('message', onMessage);
    root.querySelector('.close').addEventListener('click', () => close(null));

    let timer = null;
    const arm = () => { if (timeoutMs > 0) timer = setTimeout(() => close(null), timeoutMs); };
    host.addEventListener('mouseenter', () => clearTimeout(timer));
    host.addEventListener('mouseleave', arm);

    const handle = { close };
    function close(result) {
      clearTimeout(timer);
      doc.defaultView.removeEventListener('message', onMessage);
      host.remove();
      if (current === handle) current = null;
      resolve(result);
    }
    current = handle;
    // Show in the browser's top layer: sites like Reddit put their own UI there, and anything
    // outside it (whatever its z-index) ends up underneath. The host is reset to an invisible
    // zero-size box so the popover's default centred-box styling never shows; .toast positions itself.
    host.setAttribute('popover', 'manual');
    host.style.cssText = 'all: initial !important; position: fixed !important; inset: auto !important; '
      + 'width: 0 !important; height: 0 !important; overflow: visible !important; display: block !important;';
    doc.documentElement.append(host);
    host.showPopover?.();
    arm();
  });
}
