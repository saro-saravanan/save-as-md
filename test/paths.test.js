import { describe, it, expect } from 'vitest';
import { joinPath, vscodeFileUrl, pathEndsWithFolder } from '../src/lib/paths.js';

describe('paths', () => {
  it('joins with the base path separator', () => {
    expect(joinPath('C:\\Users\\me\\Clips\\', '2026-09-30 T', 'T.md')).toBe('C:\\Users\\me\\Clips\\2026-09-30 T\\T.md');
    expect(joinPath('/Users/me/Clips', 'F', 'T.md')).toBe('/Users/me/Clips/F/T.md');
  });
  it('builds encoded vscode urls', () => {
    expect(vscodeFileUrl('C:\\Users\\me\\My Clips\\a#b.md')).toBe('vscode://file/C:/Users/me/My%20Clips/a%23b.md');
    expect(vscodeFileUrl('/Users/me/a.md')).toBe('vscode://file/Users/me/a.md');
  });
  it('checks that a typed path matches the chosen folder', () => {
    expect(pathEndsWithFolder('C:\\x\\Clips\\', 'Clips')).toBe(true);
    expect(pathEndsWithFolder('C:\\x\\Other', 'Clips')).toBe(false);
  });
});
