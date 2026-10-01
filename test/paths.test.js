import { describe, it, expect } from 'vitest';
import { vscodeFileUrl } from '../src/lib/paths.js';

describe('vscodeFileUrl', () => {
  it('builds encoded vscode urls', () => {
    expect(vscodeFileUrl('C:\\Users\\me\\My Clips\\a#b.md')).toBe('vscode://file/C:/Users/me/My%20Clips/a%23b.md');
    expect(vscodeFileUrl('/Users/me/a.md')).toBe('vscode://file/Users/me/a.md');
  });
});
