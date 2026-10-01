// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, lstat, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { linkWebClips } from '../scripts/link-webclips.mjs';

let root, downloads, target, webclips;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'savemd-link-'));
  downloads = join(root, 'Downloads');
  target = join(root, 'My Clips');
  webclips = join(downloads, 'WebClips');
  await mkdir(downloads);
});
afterEach(() => rm(root, { recursive: true, force: true }));

const isLinkTo = async (dir) => (await lstat(webclips)).isSymbolicLink() && (await realpath(webclips)) === (await realpath(dir));

describe('linkWebClips', () => {
  it('creates the target folder and links WebClips to it', async () => {
    expect(await linkWebClips({ downloadsDir: downloads, target })).toBe('linked');
    expect(await isLinkTo(target)).toBe(true);
    await writeFile(join(webclips, 'probe.md'), 'x');
    expect(await readFile(join(target, 'probe.md'), 'utf8')).toBe('x');
  });

  it('does nothing when already linked to the target', async () => {
    await linkWebClips({ downloadsDir: downloads, target });
    expect(await linkWebClips({ downloadsDir: downloads, target })).toBe('already linked');
  });

  it('re-points a link to a different folder', async () => {
    const old = join(root, 'Old');
    await mkdir(old);
    await linkWebClips({ downloadsDir: downloads, target: old });
    expect(await linkWebClips({ downloadsDir: downloads, target })).toBe('relinked');
    expect(await isLinkTo(target)).toBe(true);
    expect(await readdir(old)).toEqual([]); // the old folder itself is left alone
  });

  it('moves pages already saved in a real WebClips folder into the target', async () => {
    await mkdir(join(webclips, '2026-09-30 Page'), { recursive: true });
    await writeFile(join(webclips, '2026-09-30 Page', 'Page.md'), '# Page');
    expect(await linkWebClips({ downloadsDir: downloads, target })).toBe('moved 1 item and linked');
    expect(await isLinkTo(target)).toBe(true);
    expect(await readFile(join(target, '2026-09-30 Page', 'Page.md'), 'utf8')).toBe('# Page');
  });

  it('refuses to overwrite something already in the target', async () => {
    await mkdir(join(webclips, 'Same'), { recursive: true });
    await mkdir(join(target, 'Same'), { recursive: true });
    await expect(linkWebClips({ downloadsDir: downloads, target })).rejects.toThrow('already has "Same"');
    expect((await lstat(webclips)).isSymbolicLink()).toBe(false); // nothing changed
  });
});
