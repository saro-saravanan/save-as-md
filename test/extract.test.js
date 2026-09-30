import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { extract } from '../src/lib/extract.js';

const URL_ = 'https://blog.ex.com/p/1';
const docFrom = (html) => new JSDOM(html, { url: URL_ }).window.document;
const paras = Array.from({ length: 6 }, (_, i) =>
  `<p>${`Sentence number ${i} has several words in it, making it long enough to count. `.repeat(6)}</p>`).join('');
const ARTICLE = `<html><head><title>My Post | Blog</title>
  <meta property="og:title" content="My Post"><meta property="og:site_name" content="Blog">
  <meta name="author" content="Ada"><meta property="article:published_time" content="2026-09-01T08:00:00Z"></head>
  <body><nav><a href="/">Home</a><a href="/about">About</a></nav>
  <article><h1>My Post</h1>${paras}</article>
  <footer>© Blog</footer><div class="cookie-banner">We use cookies</div></body></html>`;

describe('extract', () => {
  it('uses Readability for articles', () => {
    const r = extract(docFrom(ARTICLE), { url: URL_ });
    expect(r.modeUsed).toBe('article');
    expect(r.title).toBe('My Post');
    expect(r.site).toBe('Blog');
    expect(r.author).toBe('Ada');
    expect(r.contentHtml).toContain('Sentence number 0');
    expect(r.contentHtml).not.toContain('We use cookies');
  });

  it('falls back to full page when the article is under 30% of the page', () => {
    const short = () => ({ title: 'X', textContent: 'tiny', content: '<p>tiny</p>' });
    const r = extract(docFrom(ARTICLE), { url: URL_, parseArticle: short });
    expect(r.modeUsed).toBe('full');
    expect(r.contentHtml).toContain('Sentence number 5');
  });

  it('keeps a short article when mode is article', () => {
    const short = () => ({ title: 'X', textContent: 'tiny', content: '<p>tiny</p>' });
    const r = extract(docFrom(ARTICLE), { url: URL_, mode: 'article', parseArticle: short });
    expect(r.modeUsed).toBe('article');
    expect(r.contentHtml).toBe('<p>tiny</p>');
  });

  it('strips navigation, footers, cookie and ad blocks in full mode', () => {
    const d = docFrom(`<html><head><title>Prices</title></head><body><nav>Menu</nav>
      <main><table><tr><td>A</td></tr></table><p>Keep me</p></main>
      <div id="cookie-consent">Accept cookies</div><div class="ad">Buy now</div><footer>Foot</footer></body></html>`);
    const r = extract(d, { url: URL_, mode: 'full' });
    expect(r.modeUsed).toBe('full');
    expect(r.contentHtml).toContain('Keep me');
    expect(r.contentHtml).toContain('<table');
    for (const junk of ['Menu', 'Accept cookies', 'Buy now', 'Foot']) expect(r.contentHtml).not.toContain(junk);
  });

  it('uses a fragment as-is', () => {
    const r = extract(docFrom(ARTICLE), { url: URL_, fragmentHtml: '<p>Only this</p>', fragmentKind: 'pick' });
    expect(r.modeUsed).toBe('pick');
    expect(r.contentHtml).toBe('<p>Only this</p>');
    expect(r.title).toBe('My Post');
    expect(r.published).toBe('2026-09-01T08:00:00Z');
  });
});
