import { capturePage, captureReddit } from '../lib/pipeline.js';
import { isRedditThread, redditJsonUrl } from '../lib/reddit.js';
import { composedOuterHTML } from '../lib/composed-clone.js';

export async function runCapture({ scope = 'page', mode = 'auto', redditMode = 'top' } = {}, env) {
  const { doc, url, fetchImpl, pickElement, selectionHtml } = env;
  // Chrome's PDF viewer: the page is only an <embed>, so there's nothing to extract.
  if (doc.contentType === 'application/pdf') return { protectedPage: true };

  if (scope === 'page' && isRedditThread(url)) {
    try {
      const res = await fetchImpl(redditJsonUrl(url), { credentials: 'include' });
      if (res.ok) return { capture: captureReddit(await res.json(), { url, mode: redditMode }) };
    } catch {
      // Blocked, rate-limited or not JSON: fall through to the rendered page.
    }
  }
  if (scope === 'selection') {
    const html = selectionHtml();
    if (!html) return { error: 'Nothing is selected.' };
    return { capture: capturePage(doc, { url, mode, fragmentHtml: html, fragmentKind: 'selection' }) };
  }
  if (scope === 'pick') {
    const el = await pickElement(doc);
    if (!el) return { cancelled: true };
    return { capture: capturePage(doc, { url, mode, fragmentHtml: composedOuterHTML(el), fragmentKind: 'pick' }) };
  }
  return { capture: capturePage(doc, { url, mode }) };
}
