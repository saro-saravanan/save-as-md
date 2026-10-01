import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { capturePage } from '../src/lib/pipeline.js';

const URL_ = 'https://docs.example.com/guide';
const NOW = new Date('2026-10-01T12:00:00.000Z');
const paras = Array.from({ length: 5 }, (_, i) => `<p>${`Paragraph ${i} explains the API in enough words to read as an article body. `.repeat(5)}</p>`).join('');

function page(body) {
  const dom = new JSDOM(`<html><head><title>Guide</title></head><body><article><h1>Guide</h1>${paras}${body}${paras}</article></body></html>`, { url: URL_ });
  return dom.window.document;
}

// Sites like MDN render code examples inside web components; their contents live in a shadow root,
// which a plain cloneNode() leaves behind.
describe('content inside web components', () => {
  it('keeps code that a component renders in its shadow root', () => {
    const doc = page('<mdn-code-example></mdn-code-example>');
    const host = doc.querySelector('mdn-code-example');
    host.attachShadow({ mode: 'open' }).innerHTML = '<style>pre { color: red }</style><div class="header">js</div><pre class="language-js"><code>const response = await fetch(url);</code></pre>';
    const c = capturePage(doc, { url: URL_, now: NOW });
    expect(c.markdown).toContain('```js\nconst response = await fetch(url);\n```');
    expect(c.markdown).not.toContain('color: red');
  });

  it('places slotted page content where the component shows it, once', () => {
    const doc = page('<photo-card><img src="/hero.jpg" width="800" height="600" alt="Field of peas"></photo-card>');
    const host = doc.querySelector('photo-card');
    host.attachShadow({ mode: 'open' }).innerHTML = '<figure><slot></slot><figcaption>Peas in June</figcaption></figure>';
    const c = capturePage(doc, { url: URL_, now: NOW });
    expect(c.images.map((i) => i.url)).toEqual(['https://docs.example.com/hero.jpg']);
    expect(c.markdown).toContain('Peas in June');
  });

  it('uses a slot\'s fallback content when nothing is slotted', () => {
    const doc = page('<note-box></note-box>');
    doc.querySelector('note-box').attachShadow({ mode: 'open' }).innerHTML = '<p><slot>Default note text from the component.</slot></p>';
    expect(capturePage(doc, { url: URL_, now: NOW }).markdown).toContain('Default note text from the component.');
  });

  it('leaves the live page untouched', () => {
    const doc = page('<mdn-code-example></mdn-code-example>');
    doc.querySelector('mdn-code-example').attachShadow({ mode: 'open' }).innerHTML = '<pre><code>x</code></pre>';
    capturePage(doc, { url: URL_, now: NOW });
    expect(doc.querySelector('mdn-code-example').children).toHaveLength(0);
    expect(doc.querySelector('mdn-code-example').shadowRoot.querySelector('pre')).not.toBeNull();
  });
});

describe('Pick an area over web components', () => {
  it('keeps shadow content inside the picked area', async () => {
    const { runCapture } = await import('../src/content/capture.js');
    const doc = page('<section id="picked"><h2>Example</h2><mdn-code-example></mdn-code-example></section>');
    doc.querySelector('mdn-code-example').attachShadow({ mode: 'open' }).innerHTML = '<pre class="language-js"><code>await fetch(url);</code></pre>';
    const res = await runCapture({ scope: 'pick' }, {
      doc, url: URL_, fetchImpl: async () => ({ ok: false }), selectionHtml: () => '',
      pickElement: async (d) => d.getElementById('picked'),
    });
    expect(res.capture.markdown).toContain('```js\nawait fetch(url);\n```');
  });
});
