import { describe, it, expect, beforeEach } from 'vitest';
import { pickElement } from '../src/content/picker.js';

const over = (el) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const key = (k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('pickElement', () => {
  beforeEach(() => { document.body.innerHTML = '<div id="outer"><p id="inner">hi</p></div>'; });

  it('resolves with the clicked element', async () => {
    const p = pickElement(document);
    const inner = document.getElementById('inner');
    over(inner);
    click(inner);
    await expect(p).resolves.toBe(inner);
  });

  it('widens to the parent with ArrowUp', async () => {
    const p = pickElement(document);
    over(document.getElementById('inner'));
    key('ArrowUp');
    click(document.getElementById('inner'));
    await expect(p).resolves.toBe(document.getElementById('outer'));
  });

  it('cancels with Escape and cleans up', async () => {
    const p = pickElement(document);
    key('Escape');
    await expect(p).resolves.toBeNull();
    expect(document.querySelectorAll('[data-savemd-picker]')).toHaveLength(0);
  });
});
