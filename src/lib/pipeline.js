import { resolveLazyImages } from './lazy-images.js';
import { extract } from './extract.js';
import { htmlToMarkdown, markCodeLanguages } from './to-markdown.js';
import { countWords } from './assemble.js';
import { redditToMarkdown } from './reddit.js';
import { stripTracking } from './urls.js';
import { composedClone } from './composed-clone.js';

export function capturePage(doc, { url, mode = 'auto', fragmentHtml = null, fragmentKind = 'selection', now = new Date(), parseArticle } = {}) {
  const clone = composedClone(doc); // includes what web components render (shadow DOM)
  resolveLazyImages(clone, url);
  markCodeLanguages(clone);
  let fragment = null;
  if (fragmentHtml != null) {
    const holder = clone.createElement('div');
    holder.innerHTML = fragmentHtml;
    resolveLazyImages(holder, url);
    markCodeLanguages(holder);
    fragment = holder.innerHTML;
  }
  const ex = extract(clone, { url, mode, fragmentHtml: fragment, fragmentKind, ...(parseArticle && { parseArticle }) });
  const { markdown, images } = htmlToMarkdown(ex.contentHtml, url);
  const title = ex.title || 'Untitled';
  return {
    title,
    meta: { title, source: stripTracking(url), site: ex.site, author: ex.author, published: ex.published, saved: now.toISOString() },
    markdown,
    images,
    source: { ext: 'html', text: `<!-- saved from ${url} on ${now.toISOString()} -->\n${clone.documentElement.outerHTML}` },
    modeUsed: ex.modeUsed,
    wordCount: countWords(markdown),
  };
}

export function captureReddit(json, { url, mode = 'top', now = new Date() }) {
  const r = redditToMarkdown(json, mode);
  return {
    title: r.title,
    meta: { ...r.meta, source: stripTracking(url), saved: now.toISOString() },
    markdown: r.markdown,
    images: r.images,
    source: { ext: 'json', text: JSON.stringify(json) },
    modeUsed: 'reddit',
    wordCount: countWords(r.markdown),
  };
}
