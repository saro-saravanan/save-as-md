import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { resolveLazyImages, largestFromSrcset } from '../src/lib/lazy-images.js';

const BASE = 'https://ex.com/post/1';
const docFrom = (html) => new JSDOM(`<body>${html}</body>`, { url: BASE }).window.document;
const srcOf = (d) => d.querySelector('img').getAttribute('src');

describe('resolveLazyImages', () => {
  it('uses data-src when src is a placeholder', () => {
    const d = docFrom('<img src="data:image/gif;base64,R0lGOD" data-src="/real.jpg">');
    resolveLazyImages(d, BASE);
    expect(srcOf(d)).toBe('https://ex.com/real.jpg');
  });
  it('picks the largest srcset candidate', () => {
    const d = docFrom('<img src="small.jpg" srcset="a-400.jpg 400w, a-1200.jpg 1200w, a-800.jpg 800w">');
    resolveLazyImages(d, BASE);
    expect(srcOf(d)).toBe('https://ex.com/post/a-1200.jpg');
    expect(d.querySelector('img').hasAttribute('srcset')).toBe(false);
  });
  it('reads <picture> sources and removes them', () => {
    const d = docFrom('<picture><source srcset="p-2x.webp 2x, p-1x.webp 1x"><img src="p.jpg"></picture>');
    resolveLazyImages(d, BASE);
    expect(srcOf(d)).toBe('https://ex.com/post/p-2x.webp');
    expect(d.querySelector('source')).toBeNull();
  });
  it('absolutizes a normal src', () => {
    const d = docFrom('<img src="/a.png">');
    resolveLazyImages(d, BASE);
    expect(srcOf(d)).toBe('https://ex.com/a.png');
  });
});

describe('largestFromSrcset', () => {
  it('handles empty input', () => {
    expect(largestFromSrcset(null)).toBeNull();
    expect(largestFromSrcset('')).toBeNull();
  });
});
