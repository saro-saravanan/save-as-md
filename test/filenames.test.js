import { describe, it, expect } from 'vitest';
import { sanitizeTitle, datePrefix, folderNameFor, markdownFileName, extFor, assetName, withSuffix } from '../src/lib/filenames.js';

describe('sanitizeTitle', () => {
  it('replaces characters Windows forbids', () => {
    expect(sanitizeTitle('a: b/c? "d" <e>|f*')).toBe('a b c d e f');
  });
  it('drops emoji', () => {
    expect(sanitizeTitle('🔥 Hot take 🚀 today')).toBe('Hot take today');
  });
  it('trims trailing dots', () => {
    expect(sanitizeTitle('Wait for it...')).toBe('Wait for it');
  });
  it('falls back to Untitled', () => {
    expect(sanitizeTitle('???')).toBe('Untitled');
  });
  it('avoids reserved device names', () => {
    expect(sanitizeTitle('CON')).toBe('CON_');
  });
  it('truncates long titles at a word boundary', () => {
    const t = sanitizeTitle('word '.repeat(40));
    expect(t.length).toBeLessThanOrEqual(80);
    expect(t.endsWith('word')).toBe(true);
  });
});

describe('names', () => {
  it('builds folder and file names', () => {
    expect(datePrefix(new Date(2026, 8, 30))).toBe('2026-09-30');
    expect(folderNameFor(new Date(2026, 8, 30), 'Hello: World')).toBe('2026-09-30 Hello World');
    expect(markdownFileName('Hello: World')).toBe('Hello World.md');
    expect(assetName(0, 'png')).toBe('img-01.png');
    expect(assetName(11, 'jpg')).toBe('img-12.jpg');
    expect(withSuffix('x', 1)).toBe('x');
    expect(withSuffix('x', 2)).toBe('x (2)');
  });
});

describe('extFor', () => {
  it('prefers the content type', () => {
    expect(extFor('image/png; charset=binary', 'https://x/a')).toBe('png');
    expect(extFor('image/svg+xml', null)).toBe('svg');
  });
  it('falls back to a known image extension in the URL', () => {
    expect(extFor('', 'https://x/a/photo.JPEG?w=1')).toBe('jpg');
  });
  // Review Focus #3: extension-less CDN images must still render
  it('uses jpg for extension-less CDN images with a generic type', () => {
    expect(extFor('application/octet-stream', 'https://cdn.x/img?w=800&fm=webp')).toBe('jpg');
    expect(extFor('', 'https://x/image.php?id=3')).toBe('jpg');
  });
});
