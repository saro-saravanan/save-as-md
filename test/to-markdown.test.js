import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from '../src/lib/to-markdown.js';

const BASE = 'https://ex.com/blog/post';

describe('htmlToMarkdown', () => {
  it('converts basic structure', () => {
    const { markdown } = htmlToMarkdown('<h2>Title</h2><p>Hello <strong>world</strong></p><ul><li>a</li><li>b</li></ul>', BASE);
    expect(markdown).toContain('## Title');
    expect(markdown).toContain('Hello **world**');
    expect(markdown).toMatch(/^-\s+a$/m);
  });

  it('absolutizes links and strips tracking', () => {
    const { markdown } = htmlToMarkdown('<p><a href="/x?utm_source=tw&id=2">X</a></p>', BASE);
    expect(markdown).toBe('[X](https://ex.com/x?id=2)');
  });

  it('keeps in-page anchors as plain text', () => {
    expect(htmlToMarkdown('<p><a href="#sec">jump</a></p>', BASE).markdown).toBe('jump');
  });

  it('replaces images with placeholders and records them', () => {
    const { markdown, images } = htmlToMarkdown('<p><img src="/i/a.png" alt="A [chart]"></p>', BASE);
    expect(markdown).toBe('![A chart](__IMG_0__)');
    expect(images).toEqual([{ index: 0, url: 'https://ex.com/i/a.png', data: null, ext: null, alt: 'A chart' }]);
  });

  it('drops tiny images but keeps emoji alt text', () => {
    const { markdown, images } = htmlToMarkdown(
      '<p>Hi <img src="/e.png" width="16" height="16" alt="😀"> <img src="/pixel.gif" width="1" height="1"></p>', BASE);
    expect(markdown).toContain('Hi 😀');
    expect(images).toHaveLength(0);
  });

  it('keeps large data-URI images as data', () => {
    const src = `data:image/png;base64,${'A'.repeat(300)}`;
    const { images } = htmlToMarkdown(`<p><img src="${src}"></p>`, BASE);
    expect(images[0].url).toBeNull();
    expect(images[0].data).toBe(src);
  });

  it('saves large inline SVG and drops icons', () => {
    const { markdown, images } = htmlToMarkdown(
      '<p>x</p><svg width="300" height="200"><rect width="10" height="10"/></svg><svg viewBox="0 0 24 24"><path d="M0"/></svg>', BASE);
    expect(images).toHaveLength(1);
    expect(images[0].ext).toBe('svg');
    expect(images[0].data).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(markdown).toContain('![](__IMG_0__)');
  });

  it('keeps the code language', () => {
    const { markdown } = htmlToMarkdown('<pre class="language-python"><code>print(1)\n</code></pre>', BASE);
    expect(markdown).toBe('```python\nprint(1)\n```');
  });

  it('detects GitHub-style highlight language', () => {
    const { markdown } = htmlToMarkdown('<div class="highlight highlight-source-js"><pre><span>let a</span></pre></div>', BASE);
    expect(markdown).toContain('```js');
    expect(markdown).toContain('let a');
  });

  it('makes pipe tables when there is a header row', () => {
    const { markdown } = htmlToMarkdown(
      '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>', BASE);
    expect(markdown).toContain('| A | B |');
    expect(markdown).toContain('| 1 | 2 |');
  });

  it('keeps headerless tables as HTML', () => {
    const { markdown } = htmlToMarkdown('<table><tr><td>1</td><td>2</td></tr></table>', BASE);
    expect(markdown).toContain('<table>');
  });
});
