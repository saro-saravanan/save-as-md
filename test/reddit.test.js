import { describe, it, expect } from 'vitest';
import { isRedditThread, redditJsonUrl, redditToMarkdown } from '../src/lib/reddit.js';
import { redditThread, comment, more } from './helpers/reddit-fixture.js';

describe('urls', () => {
  it('recognises thread pages only', () => {
    expect(isRedditThread('https://old.reddit.com/r/test/comments/abc/x/')).toBe(true);
    expect(isRedditThread('https://www.reddit.com/r/test/')).toBe(false);
  });
  it('builds the JSON url', () => {
    expect(redditJsonUrl('https://www.reddit.com/r/test/comments/abc/a_question/?sort=top#c'))
      .toBe('https://www.reddit.com/r/test/comments/abc/a_question/.json?raw_json=1&limit=500');
  });
});

describe('redditToMarkdown', () => {
  it('renders the post header and body, no comments in post mode', () => {
    const r = redditToMarkdown(redditThread({ comments: [comment('alice', 'Hi')] }), 'post');
    expect(r.markdown).toContain('*r/test · u/op · 42 points · 2026-01-01*');
    expect(r.markdown).toContain('Body **text**');
    expect(r.markdown).not.toContain('## Comments');
    expect(r.meta).toEqual({ title: 'A question', site: 'r/test', author: 'u/op', published: '2026-01-01' });
  });

  it('nests replies as blockquotes', () => {
    const r = redditToMarkdown(redditThread({ comments: [comment('alice', 'Top level', [comment('bob', 'Reply')])] }), 'top');
    expect(r.markdown).toContain('> **u/alice** · 5 points · 2026-01-01');
    expect(r.markdown).toContain('> > **u/bob**');
    expect(r.markdown).toContain('> > Reply');
  });

  it('limits top mode to 20 threads', () => {
    const comments = Array.from({ length: 25 }, (_, i) => comment(`user${i}`, 'x'));
    const r = redditToMarkdown(redditThread({ comments }), 'top');
    expect(r.markdown.match(/^> \*\*u\//gm)).toHaveLength(20);
  });

  it('notes replies deeper than the limit', () => {
    let chain = comment('c6', 'six');
    for (let i = 5; i >= 1; i--) chain = comment(`c${i}`, `level ${i}`, [chain]);
    const r = redditToMarkdown(redditThread({ comments: [chain] }), 'top');
    expect(r.markdown).toContain('*2 deeper replies not included*');
    expect(r.markdown).not.toContain('u/c5');
  });

  it('notes unloaded replies in all mode', () => {
    const r = redditToMarkdown(redditThread({ comments: [comment('a', 'x'), more(12)] }), 'all');
    expect(r.markdown).toContain('> *12 more replies not loaded*');
  });

  it('collects gallery images with decoded URLs', () => {
    const r = redditToMarkdown(redditThread({ post: {
      is_self: false, selftext: '', is_gallery: true, url: 'https://www.reddit.com/gallery/abc',
      gallery_data: { items: [{ media_id: 'm1', caption: 'First' }, { media_id: 'm2' }] },
      media_metadata: { m1: { s: { u: 'https://preview.redd.it/m1.jpg?width=640&amp;s=abc' } }, m2: { s: { u: 'https://preview.redd.it/m2.png?a=1' } } },
    } }), 'post');
    expect(r.images[0].url).toBe('https://preview.redd.it/m1.jpg?width=640&s=abc');
    expect(r.images).toHaveLength(2);
    expect(r.markdown).toContain('![First](__IMG_0__)');
    expect(r.markdown).not.toContain('Link:');
  });

  it('links videos and keeps the thumbnail', () => {
    const r = redditToMarkdown(redditThread({ post: {
      is_self: false, selftext: '', is_video: true, preview: { images: [{ source: { url: 'https://preview.redd.it/v.jpg' } }] },
    } }), 'post');
    expect(r.images[0].url).toBe('https://preview.redd.it/v.jpg');
    expect(r.markdown).toContain('[▶ Video on Reddit](https://www.reddit.com/r/test/comments/abc/a_question/)');
  });

  it('shows the target of link posts', () => {
    const r = redditToMarkdown(redditThread({ post: { is_self: false, selftext: '', url: 'https://example.com/article' } }), 'post');
    expect(r.markdown).toContain('Link: <https://example.com/article>');
  });
});

// Reddit shows bare image links in posts and comments as pictures, so SaveMD must save them as images.
describe('images inside post and comment text', () => {
  const PREVIEW = 'https://preview.redd.it/ckpyc9uxrpsh1.png?width=596&format=png&auto=webp&s=d5a1';

  it('turns a bare preview.redd.it link in a text post into a saved image', () => {
    const r = redditToMarkdown(redditThread({ post: { selftext: `Look at this:\n\n${PREVIEW}\n\nWow.` } }), 'post');
    expect(r.images).toEqual([{ index: 0, url: PREVIEW, data: null, ext: null, alt: '' }]);
    expect(r.markdown).toContain('Look at this:\n\n![](__IMG_0__)\n\nWow.');
    expect(r.markdown).not.toContain(PREVIEW);
  });

  it('does the same inside comments, keeping the blockquote nesting', () => {
    const r = redditToMarkdown(redditThread({ comments: [comment('alice', 'Top', [comment('bob', `Here:\n\nhttps://i.redd.it/abc123.jpeg`)])] }), 'top');
    expect(r.images[0].url).toBe('https://i.redd.it/abc123.jpeg');
    expect(r.markdown).toContain('> > ![](__IMG_0__)');
  });

  it('recognises image links from other hosts by their extension', () => {
    const r = redditToMarkdown(redditThread({ post: { selftext: 'See https://i.imgur.com/xyz.png and https://example.com/page' } }), 'post');
    expect(r.images.map((i) => i.url)).toEqual(['https://i.imgur.com/xyz.png']);
    expect(r.markdown).toContain('See ![](__IMG_0__) and https://example.com/page');
  });

  it('leaves image URLs that are link targets as links', () => {
    const r = redditToMarkdown(redditThread({ post: { selftext: `[the chart](${PREVIEW})` } }), 'post');
    expect(r.images).toEqual([]);
    expect(r.markdown).toContain(`[the chart](${PREVIEW})`);
  });

  it('saves Giphy embeds, using the media metadata when Reddit has it', () => {
    const r = redditToMarkdown(redditThread({ comments: [
      comment('a', '![gif](giphy|AAA111)', [], { media_metadata: { 'giphy|AAA111': { status: 'valid', s: { gif: 'https://i.giphy.com/from-metadata.gif' } } } }),
      comment('b', '![gif](giphy|BBB222)', [], { media_metadata: { 'giphy|BBB222': { status: 'invalid' } } }),
    ] }), 'top');
    expect(r.images.map((i) => i.url)).toEqual(['https://i.giphy.com/from-metadata.gif', 'https://i.giphy.com/media/BBB222/giphy.gif']);
    expect(r.markdown).toContain('> ![gif](__IMG_0__)');
    expect(r.markdown).toContain('> ![gif](__IMG_1__)');
  });

  it('resolves images uploaded into comments by media id', () => {
    const r = redditToMarkdown(redditThread({ comments: [
      comment('a', 'Screenshot:\n\n![img](m9xyz)', [], { media_metadata: { m9xyz: { status: 'valid', e: 'Image', s: { u: 'https://preview.redd.it/m9xyz.png?width=800&s=1' } } } }),
    ] }), 'top');
    expect(r.images[0].url).toBe('https://preview.redd.it/m9xyz.png?width=800&s=1');
    expect(r.markdown).toContain('> ![img](__IMG_0__)');
  });
});
