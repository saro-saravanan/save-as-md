import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { runCapture } from '../src/content/capture.js';
import { redditThread, comment } from './helpers/reddit-fixture.js';

const REDDIT = 'https://www.reddit.com/r/test/comments/abc/a_question/';
function env(over = {}) {
  const doc = new JSDOM('<html><head><title>Fallback page</title></head><body><main><p>Some rendered text on the page.</p></main></body></html>', { url: REDDIT }).window.document;
  return { doc, url: REDDIT, fetchImpl: vi.fn(), pickElement: vi.fn(async () => null), selectionHtml: () => '', ...over };
}

describe('runCapture', () => {
  it('uses Reddit JSON for thread pages', async () => {
    const e = env({ fetchImpl: vi.fn(async () => ({ ok: true, json: async () => redditThread({ comments: [comment('alice', 'Hi')] }) })) });
    const res = await runCapture({ scope: 'page', redditMode: 'top' }, e);
    expect(res.capture.modeUsed).toBe('reddit');
    expect(e.fetchImpl).toHaveBeenCalledWith('https://www.reddit.com/r/test/comments/abc/a_question/.json?raw_json=1&limit=500', { credentials: 'include' });
  });

  // Review Focus #2
  it('falls back to the rendered page when Reddit JSON is blocked', async () => {
    const res = await runCapture({ scope: 'page' }, env({ fetchImpl: vi.fn(async () => ({ ok: false, status: 403 })) }));
    expect(res.capture.modeUsed).not.toBe('reddit');
    expect(res.capture.markdown).toContain('Some rendered text');
  });

  it('falls back when the Reddit request throws', async () => {
    const res = await runCapture({ scope: 'page' }, env({ fetchImpl: vi.fn(async () => { throw new TypeError('Failed to fetch'); }) }));
    expect(res.capture.markdown).toContain('Some rendered text');
  });

  it('reports an empty selection', async () => {
    expect(await runCapture({ scope: 'selection' }, env())).toEqual({ error: 'Nothing is selected.' });
  });

  it('reports a cancelled pick', async () => {
    expect(await runCapture({ scope: 'pick' }, env())).toEqual({ cancelled: true });
  });

  it('captures a picked element', async () => {
    const e = env();
    e.pickElement = vi.fn(async (doc) => doc.querySelector('p'));
    const res = await runCapture({ scope: 'pick' }, e);
    expect(res.capture.modeUsed).toBe('pick');
    expect(res.capture.markdown).toContain('Some rendered text');
  });
});
