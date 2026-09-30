export function pickElement(doc = document) {
  return new Promise((resolve) => {
    const overlay = doc.createElement('div');
    overlay.dataset.savemdPicker = 'overlay';
    Object.assign(overlay.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '2147483646', display: 'none',
      background: 'rgba(56,139,253,0.15)', outline: '2px solid #388bfd', transition: 'all 60ms',
    });
    const hint = doc.createElement('div');
    hint.dataset.savemdPicker = 'hint';
    hint.textContent = 'Click an area to save · ↑ to widen · Esc to cancel';
    Object.assign(hint.style, {
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: '2147483647',
      background: '#1f2328', color: '#f0f3f6', padding: '6px 12px', borderRadius: '6px',
      font: '13px system-ui, sans-serif', pointerEvents: 'none',
    });
    doc.documentElement.append(overlay, hint);

    let target = null;
    const highlight = (el) => {
      target = el;
      const r = el.getBoundingClientRect();
      Object.assign(overlay.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    };
    const onMove = (e) => {
      const el = e.target;
      if (el && el !== overlay && el !== hint && el !== doc.documentElement && el !== doc.body) highlight(el);
    };
    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      finish(target || e.target);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish(null);
      } else if (e.key === 'ArrowUp' && target?.parentElement && target.parentElement !== doc.body) {
        e.preventDefault();
        highlight(target.parentElement);
      }
    };
    function finish(el) {
      doc.removeEventListener('mouseover', onMove, true);
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('keydown', onKey, true);
      overlay.remove();
      hint.remove();
      resolve(el);
    }
    doc.addEventListener('mouseover', onMove, true);
    doc.addEventListener('click', onClick, true);
    doc.addEventListener('keydown', onKey, true);
  });
}
