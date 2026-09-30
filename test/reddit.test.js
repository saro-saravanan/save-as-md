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
