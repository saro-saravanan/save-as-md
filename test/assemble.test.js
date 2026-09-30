import { describe, it, expect } from 'vitest';
import { buildFrontmatter } from '../src/lib/frontmatter.js';
import { applyImageResults, remoteResults, countWords, assembleDocument } from '../src/lib/assemble.js';

describe('applyImageResults', () => {
  it('handles every result status', () => {
    const md = 'A ![x](__IMG_0__) B ![y](__IMG_1__) C ![z](__IMG_2__) D ![w](__IMG_3__)';
    const out = applyImageResults(md, [
      { status: 'saved', file: 'img-01.png' },
      { status: 'remote', url: 'https://r/y.png' },
      { status: 'failed', url: 'https://f/z.png' },
      { status: 'skipped' },
    ]);
    expect(out).toBe('A ![x](assets/img-01.png) B ![y](https://r/y.png) C ![z](https://f/z.png) *(image not saved)* D ');
  });
  it('fills bare placeholders inside kept HTML', () => {
    expect(applyImageResults('<img src="__IMG_0__">', [{ status: 'saved', file: 'img-01.png' }])).toBe('<img src="assets/img-01.png">');
  });
});

describe('buildFrontmatter', () => {
  it('escapes quotes and omits empty values', () => {
    expect(buildFrontmatter({ title: 'Say "hi"', source: 'https://x', author: '' })).toBe('---\ntitle: "Say \\"hi\\""\nsource: "https://x"\n---');
  });
});

describe('assembleDocument', () => {
  it('adds an H1 when the body has none', () => {
    const doc = assembleDocument({ meta: { title: 'T', source: 's' }, markdown: 'Body' }, []);
    expect(doc).toBe('---\ntitle: "T"\nsource: "s"\n---\n\n# T\n\nBody\n');
  });
  it('does not duplicate an existing H1', () => {
    const doc = assembleDocument({ meta: { title: 'T' }, markdown: '# T\n\nBody' }, []);
    expect(doc.match(/^# T$/gm)).toHaveLength(1);
  });
});

describe('helpers', () => {
  it('counts words, ignoring code, images and URLs', () => {
    expect(countWords('# Hello world\n\n![alt](__IMG_0__) [link text](https://x)\n\n```\ncode here\n```')).toBe(4);
  });
  it('builds remote results for clipboard copies', () => {
    expect(remoteResults([{ url: 'u' }, { url: null, data: 'd' }])).toEqual([{ status: 'remote', url: 'u' }, { status: 'skipped' }]);
  });
});
