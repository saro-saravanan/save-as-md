import { describe, it, expect } from 'vitest';
import { absolutize, stripTracking, normalizeForDedupe, decodeEntities } from '../src/lib/urls.js';

describe('absolutize', () => {
  it('resolves relative paths against the base', () => {
    expect(absolutize('/img/a.png', 'https://ex.com/post/1')).toBe('https://ex.com/img/a.png');
  });
  it('resolves protocol-relative urls', () => {
    expect(absolutize('//cdn.ex.com/a.png', 'https://ex.com/')).toBe('https://cdn.ex.com/a.png');
  });
  it('returns empty string for empty input', () => {
    expect(absolutize('', 'https://ex.com/')).toBe('');
  });
});

describe('stripTracking', () => {
  it('removes utm and click ids but keeps real params', () => {
    expect(stripTracking('https://ex.com/a?id=5&utm_source=x&fbclid=y')).toBe('https://ex.com/a?id=5');
  });
  it('drops the ? when nothing is left', () => {
    expect(stripTracking('https://ex.com/a?utm_source=x')).toBe('https://ex.com/a');
  });
  it('leaves urls without tracking untouched', () => {
    expect(stripTracking('https://ex.com/a?q=hello%20world')).toBe('https://ex.com/a?q=hello%20world');
  });
});

describe('normalizeForDedupe', () => {
  it('ignores tracking, hash and trailing slash', () => {
    expect(normalizeForDedupe('https://ex.com/a/?utm_source=x#top')).toBe('https://ex.com/a');
  });
});

describe('decodeEntities', () => {
  it('decodes the entities Reddit puts in URLs', () => {
    expect(decodeEntities('https://i.redd.it/x.jpg?a=1&amp;b=2')).toBe('https://i.redd.it/x.jpg?a=1&b=2');
  });
});
