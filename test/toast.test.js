import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showToast } from '../src/content/toast.js';

const host = () => document.getElementById('savemd-toast-host');
const shadow = () => host()?.shadowRoot;

describe('showToast', () => {
  beforeEach(() => { document.documentElement.innerHTML = '<head></head><body></body>'; vi.useFakeTimers(); });
  afterEach(() => vi.useRealTimers());

  it('shows text and resolves with the clicked action', async () => {
    const p = showToast({ text: 'Saved · 10 words', actions: [{ id: 'undo', label: 'Undo' }] });
    expect(shadow().querySelector('.text').textContent).toBe('Saved · 10 words');
    shadow().querySelector('[data-id="undo"]').click();
    await expect(p).resolves.toBe('undo');
    expect(host()).toBeNull();
  });

  it('resolves null after the timeout', async () => {
    const p = showToast({ text: 'x', timeoutMs: 1000 });
    vi.advanceTimersByTime(1000);
    await expect(p).resolves.toBeNull();
  });

  it('pauses the timeout while hovered', async () => {
    const p = showToast({ text: 'x', timeoutMs: 1000 });
    host().dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(5000);
    expect(host()).not.toBeNull();
    host().dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(1000);
    await expect(p).resolves.toBeNull();
  });

  it('replaces an existing toast', async () => {
    const first = showToast({ text: 'one' });
    showToast({ text: 'two' });
    await expect(first).resolves.toBeNull();
    expect(document.querySelectorAll('#savemd-toast-host')).toHaveLength(1);
  });

  it('styles itself with a constructed stylesheet so page CSP cannot block it', () => {
    const original = globalThis.CSSStyleSheet;
    globalThis.CSSStyleSheet = class { replaceSync(text) { this.text = text; } };
    try {
      showToast({ text: 'x' });
      expect(shadow().querySelector('style')).toBeNull();
      expect(shadow().adoptedStyleSheets).toHaveLength(1);
      expect(shadow().adoptedStyleSheets[0].text).toContain('.toast');
    } finally {
      globalThis.CSSStyleSheet = original;
    }
  });

  it('falls back to a <style> element where constructed stylesheets are unavailable', () => {
    const original = globalThis.CSSStyleSheet;
    globalThis.CSSStyleSheet = undefined;
    try {
      showToast({ text: 'x' });
      expect(shadow().querySelector('style').textContent).toContain('.toast');
    } finally {
      globalThis.CSSStyleSheet = original;
    }
  });
});
