const HOST_ID = 'savemd-toast-host';
const CSS = `
  .toast { position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; display: flex; align-items: center; gap: 12px;
    max-width: 520px; padding: 10px 12px 10px 14px; border-radius: 8px; border-left: 4px solid #1f883d;
    background: #1f2328; color: #f0f3f6; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,.25); }
  .toast.warn { border-left-color: #d29922; }
  .toast.error { border-left-color: #f85149; }
  .toast.ask { border-left-color: #388bfd; }
  .text { flex: 1; }
  .actions { display: flex; gap: 6px; }
  button { font: inherit; color: #f0f3f6; background: #30363d; border: 0; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
  button:hover { background: #484f58; }
  .close { background: transparent; padding: 2px 6px; font-size: 16px; }
`;

let current = null;

export function showToast({ tone = 'ok', text, actions = [], timeoutMs = 8000 }, doc = document) {
  current?.close(null);
  return new Promise((resolve) => {
    const host = doc.createElement('div');
    host.id = HOST_ID;
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style><div class="toast ${tone}" role="status"><span class="text"></span><span class="actions"></span><button class="close" aria-label="Dismiss">×</button></div>`;
    root.querySelector('.text').textContent = text;
    for (const action of actions) {
      const btn = doc.createElement('button');
      btn.textContent = action.label;
      btn.dataset.id = action.id;
      btn.addEventListener('click', () => close(action.id));
      root.querySelector('.actions').append(btn);
    }
    root.querySelector('.close').addEventListener('click', () => close(null));

    let timer = null;
    const arm = () => { if (timeoutMs > 0) timer = setTimeout(() => close(null), timeoutMs); };
    host.addEventListener('mouseenter', () => clearTimeout(timer));
    host.addEventListener('mouseleave', arm);

    const handle = { close };
    function close(result) {
      clearTimeout(timer);
      host.remove();
      if (current === handle) current = null;
      resolve(result);
    }
    current = handle;
    doc.documentElement.append(host);
    arm();
  });
}
