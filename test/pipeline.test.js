import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { capturePage, captureReddit } from '../src/lib/pipeline.js';
import { redditThread } from './helpers/reddit-fixture.js';

const URL_ = 'https://blog.ex.com/p?utm_source=x';
const NOW = new Date('2026-09-30T12:00:00.000Z');
const docFrom = (html) => new JSDOM(html, { url: URL_ }).window.document;

describe('capturePage', () => {
  it('produces a complete CaptureResult', () => {
    const paras = Array.from({ length: 6 }, (_, i) => `<p>${`Paragraph ${i} carries enough words to be treated as an article body. `.repeat(6)}</p>`).join('');
    const c = capturePage(docFrom(`<html><head><title>Hello</title></head><body><article>${paras}</article></body></html>`), { url: URL_, now: NOW });
    expect(c.title).toBe('Hello');
    expect(c.meta.source).toBe('https://blog.ex.com/p');
    expect(c.meta.saved).toBe('2026-09-30T12:00:00.000Z');
    expect(c.source.ext).toBe('html');
    expect(c.source.text.startsWith(`<!-- saved from ${URL_} on 2026-09-30T12:00:00.000Z -->`)).toBe(true);
    expect(c.modeUsed).toBe('article');
    expect(c.wordCount).toBeGreaterThan(50);
  });

  it('resolves lazy images inside fragments', () => {
    const c = capturePage(docFrom('<html><body><p>x</p></body></html>'), {
      url: URL_, now: NOW, fragmentHtml: '<p><img src="data:image/gif;base64,R0lGOD" data-src="/hero.jpg"></p>', fragmentKind: 'selection',
    });
    expect(c.modeUsed).toBe('selection');
    expect(c.images[0].url).toBe('https://blog.ex.com/hero.jpg');
  });
});

describe('captureReddit', () => {
  it('keeps the JSON as the source', () => {
    const json = redditThread();
    const c = captureReddit(json, { url: 'https://www.reddit.com/r/test/comments/abc/a_question/', mode: 'post', now: NOW });
    expect(c.modeUsed).toBe('reddit');
    expect(c.source).toEqual({ ext: 'json', text: JSON.stringify(json) });
    expect(c.meta.saved).toBe('2026-09-30T12:00:00.000Z');
  });
});

describe('capturePage through Readability', () => {
  const paras = Array.from({ length: 6 }, (_, i) => `<p>${`Paragraph ${i} carries enough words to be treated as an article body. `.repeat(6)}</p>`).join('');

  it('keeps code block languages that Readability would strip', () => {
    const c = capturePage(docFrom(`<html><head><title>Code</title></head><body><article>${paras}
      <pre class="language-js"><code>let a = 1;</code></pre>
      <div class="highlight highlight-source-shell"><pre>npm test</pre></div>${paras}</article></body></html>`), { url: URL_, now: NOW });
    expect(c.modeUsed).toBe('article');
    expect(c.markdown).toContain('```js\nlet a = 1;\n```');
    expect(c.markdown).toContain('```shell\nnpm test\n```');
  });

  it('removes navigation and cookie blocks that Readability keeps on short pages', () => {
    const c = capturePage(docFrom(`<html><head><title>Releases</title></head><body>
      <header><a href="/">Example Tools</a></header><nav><a href="/docs">Docs</a></nav>
      <main><h1>Releases</h1><table><thead><tr><th>Version</th></tr></thead><tbody><tr><td>3.2.0</td></tr></tbody></table></main>
      <div id="cookie-consent">Accept all cookies?</div><footer>Example Tools Inc.</footer></body></html>`), { url: URL_, now: NOW });
    expect(c.markdown).toContain('3.2.0');
    for (const junk of ['Example Tools', 'Docs', 'Accept all cookies']) expect(c.markdown).not.toContain(junk);
  });
});
