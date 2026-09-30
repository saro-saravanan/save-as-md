import { describe, it, expect } from 'vitest';
import { interpretMenuClick } from '../src/background/menus.js';

describe('interpretMenuClick', () => {
  it('maps save items', () => {
    expect(interpretMenuClick('pick')).toEqual({ action: 'save', opts: { scope: 'pick' } });
    expect(interpretMenuClick('copy')).toEqual({ action: 'save', opts: { dest: 'clipboard' } });
    expect(interpretMenuClick('save-to')).toEqual({ action: 'save', opts: { dest: 'oneoff' } });
    expect(interpretMenuClick('downloads')).toEqual({ action: 'save', opts: { dest: 'downloads' } });
    expect(interpretMenuClick('page:save')).toEqual({ action: 'save', opts: {} });
    expect(interpretMenuClick('page:selection')).toEqual({ action: 'save', opts: { scope: 'selection' } });
  });
  it('maps radio items', () => {
    expect(interpretMenuClick('mode:full')).toEqual({ action: 'site-mode', mode: 'full' });
    expect(interpretMenuClick('reddit:all')).toEqual({ action: 'reddit-mode', mode: 'all' });
  });
  it('ignores parents and unknown ids', () => {
    expect(interpretMenuClick('mode')).toBeNull();
    expect(interpretMenuClick('nope')).toBeNull();
  });
});
