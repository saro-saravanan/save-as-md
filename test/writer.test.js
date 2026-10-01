// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { fetchImages, planFiles, writeFolder, JobStore } from '../src/offscreen/writer.js';
import { FakeDir } from './helpers/fake-fs.js';

const png = () => new Blob(['PNG'], { type: 'image/png' });
const fakeFetch = (table) => async (url) => {
  const entry = table[url];
  if (!entry) return { ok: false, status: 404 };
  return { ok: true, blob: async () => entry };
};
describe('fetchImages', () => {
  it('classifies each image', async () => {
    const pixel = png();
    const images = [
      { index: 0, url: 'https://x/a.png', data: null },
      { index: 1, url: 'https://x/missing.png', data: null },
      { index: 2, url: 'https://x/page.html', data: null },
      { index: 3, url: null, data: '<svg xmlns="http://www.w3.org/2000/svg"/>', ext: 'svg' },
      { index: 4, url: 'https://x/pixel.png', data: null },
    ];
    const fetched = await fetchImages(images, {
      fetchImpl: fakeFetch({ 'https://x/a.png': png(), 'https://x/page.html': new Blob(['<html>'], { type: 'text/html' }), 'https://x/pixel.png': pixel }),
      measure: async (blob) => (blob === pixel ? { width: 1, height: 1 } : { width: 800, height: 600 }),
    });
    expect(fetched[0].ok).toBe(true);
    expect(fetched[1]).toEqual({ ok: false });
    expect(fetched[2]).toEqual({ ok: false });
    expect(fetched[3].blob.type).toBe('image/svg+xml');
    expect(fetched[4]).toEqual({ ok: true, tiny: true });
  });
});

describe('planFiles', () => {
  it('names assets, fills links and counts results', async () => {
    const capture = {
      title: 'T', meta: { title: 'T', source: 's' },
      markdown: '![a](__IMG_0__) ![b](__IMG_1__) ![c](__IMG_2__) ![d](__IMG_3__)',
      images: [
        { index: 0, url: 'https://x/a.png' }, { index: 1, url: 'https://x/b.png' },
        { index: 2, url: 'https://x/c.png' }, { index: 3, url: null, ext: 'svg' },
      ],
      source: { ext: 'html', text: '<html></html>' },
    };
    const fetched = [
      { ok: true, blob: png() }, { ok: false }, { ok: true, tiny: true },
      { ok: true, blob: new Blob(['<svg/>'], { type: 'image/svg+xml' }) },
    ];
    const { files, stats, markdownFile } = planFiles(capture, fetched);
    expect(files.map((f) => f.path)).toEqual(['assets/img-01.png', 'assets/img-02.svg', 'T.md', '.source.html']);
    expect(stats).toEqual({ saved: 2, failed: 1, total: 3 });
    expect(markdownFile).toBe('T.md');
    const md = await files[2].blob.text();
    expect(md).toContain('![a](assets/img-01.png)');
    expect(md).toContain('![b](https://x/b.png) *(image not saved)*');
    expect(md).not.toContain('![c]');
    expect(md).toContain('![d](assets/img-02.svg)');
  });
});

describe('writeFolder', () => {
  const files = () => [
    { path: 'assets/img-01.png', blob: png() },
    { path: 'T.md', blob: new Blob(['# T']) },
  ];

  it('writes every file into the folder', async () => {
    const root = new FakeDir();
    expect(await writeFolder(root, 'F', files())).toBe('F');
    expect(await root.tree()).toEqual({ 'F/assets/img-01.png': 'PNG', 'F/T.md': '# T' });
  });

  it('adds a suffix instead of overwriting', async () => {
    const root = new FakeDir();
    await root.getDirectoryHandle('F', { create: true });
    expect(await writeFolder(root, 'F', files())).toBe('F (2)');
  });

  it('replaces the folder when asked', async () => {
    const root = new FakeDir();
    const old = await root.getDirectoryHandle('F', { create: true });
    await old.getFileHandle('old.txt', { create: true });
    await writeFolder(root, 'F', files(), { replace: true });
    expect(Object.keys(await root.tree())).not.toContain('F/old.txt');
  });

  it('removes a half-written folder when a write fails', async () => {
    const root = new FakeDir('root', 'img-01.png');
    await expect(writeFolder(root, 'F', files())).rejects.toThrow('disk full');
    expect(root.entries.has('F')).toBe(false);
  });
});

describe('JobStore', () => {
  it('hands each job out once and forgets abandoned jobs', () => {
    let t = 0;
    const store = new JobStore({ ttlMs: 1000, now: () => t });
    store.set('abandoned', ['blob']);
    t = 2000;
    store.set('current', ['blob2']);
    expect(store.size).toBe(1);
    expect(store.take('current')).toEqual(['blob2']);
    expect(store.take('current')).toBeUndefined();
  });
});
