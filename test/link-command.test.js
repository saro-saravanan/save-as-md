// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, lstat, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { linkCommand, checkTarget } from '../src/lib/link-command.js';

describe('checkTarget', () => {
  it('accepts absolute Windows folders', () => {
    expect(checkTarget('C:\\Users\\me\\OneDrive\\Clips')).toBeNull();
    expect(checkTarget('\\\\server\\share\\Clips')).toBeNull();
  });
  it('explains what is wrong with anything else', () => {
    expect(checkTarget('')).toBe('Type the full path of a folder, like C:\\Users\\you\\Documents\\Clips.');
    expect(checkTarget('Clips')).toBe('Type the full path of a folder, like C:\\Users\\you\\Documents\\Clips.');
    expect(checkTarget('C:\\Users\\me\\Downloads\\WebClips\\inner')).toBe("Pick a folder outside Downloads\\WebClips: that's the folder being linked.");
  });
});

describe('linkCommand', () => {
  it('builds one PowerShell line with the paths safely quoted', () => {
    const cmd = linkCommand({ target: "C:\\Users\\me\\Bob's Clips", downloadsDir: 'D:\\Downloads' });
    expect(cmd).not.toContain('\n');
    expect(cmd).toContain("$t='C:\\Users\\me\\Bob''s Clips'");
    expect(cmd).toContain("$d='D:\\Downloads'");
  });
  it("asks Windows for the Downloads folder when Chrome hasn't told us yet", () => {
    expect(linkCommand({ target: 'C:\\Clips' })).toContain("NameSpace('shell:Downloads')");
  });
});

// Run the generated command for real, the way a person pasting it into Windows Terminal would.
// Each test starts PowerShell (a few seconds each when the suite runs in parallel).
describe.runIf(process.platform === 'win32')('running the command in PowerShell', { timeout: 30000 }, () => {
  let root, downloads, target, webclips;
  const run = (opts) => execFileSync('powershell.exe', ['-NoProfile', '-Command', linkCommand(opts)], { encoding: 'utf8' });
  const isLinkTo = async (dir) => (await lstat(webclips)).isSymbolicLink() && (await realpath(webclips)) === (await realpath(dir));

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "savemd-cmd-it's "));
    downloads = join(root, 'Downloads');
    target = join(root, 'My Clips');
    webclips = join(downloads, 'WebClips');
    await mkdir(downloads);
  });
  afterEach(() => rm(root, { recursive: true, force: true }));

  it('creates the folder and the link', async () => {
    expect(run({ target, downloadsDir: downloads })).toContain('Linked');
    expect(await isLinkTo(target)).toBe(true);
    await writeFile(join(webclips, 'probe.md'), 'x');
    expect(await readFile(join(target, 'probe.md'), 'utf8')).toBe('x');
  });

  it('moves pages already saved into the new folder', async () => {
    await mkdir(join(webclips, '2026-09-30 Page'), { recursive: true });
    await writeFile(join(webclips, '2026-09-30 Page', 'Page.md'), '# Page');
    run({ target, downloadsDir: downloads });
    expect(await isLinkTo(target)).toBe(true);
    expect(await readFile(join(target, '2026-09-30 Page', 'Page.md'), 'utf8')).toBe('# Page');
  });

  it('re-points an existing link and leaves the old folder alone', async () => {
    const old = join(root, 'Old');
    run({ target: old, downloadsDir: downloads });
    await writeFile(join(old, 'keep.md'), 'old');
    run({ target, downloadsDir: downloads });
    expect(await isLinkTo(target)).toBe(true);
    expect(await readdir(old)).toEqual(['keep.md']);
  });

  it('stops without deleting anything when a name already exists in the new folder', async () => {
    await mkdir(join(webclips, 'Same'), { recursive: true });
    await writeFile(join(webclips, 'Same', 'a.md'), 'a');
    await mkdir(join(target, 'Same'), { recursive: true });
    expect(() => run({ target, downloadsDir: downloads })).toThrow(/already has "Same"/);
    expect((await lstat(webclips)).isSymbolicLink()).toBe(false);
    expect(await readFile(join(webclips, 'Same', 'a.md'), 'utf8')).toBe('a');
  });
});
