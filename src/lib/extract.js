import { Readability } from '@mozilla/readability';

export const MIN_ARTICLE_RATIO = 0.3;

const JUNK_SELECTORS = [
  'script', 'style', 'noscript', 'template', 'iframe', 'form', 'button', 'input', 'select', 'textarea',
  'nav', 'header', 'footer', 'aside', 'dialog',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]',
  '[role="dialog"]', '[role="alertdialog"]', '[aria-hidden="true"]', '[hidden]',
].join(',');
const JUNK_NAME = /^(ad|ads|advert\w*|.*cookie.*|.*consent.*|.*gdpr.*|.*newsletter.*)$/i;

const readabilityParse = (doc) => new Readability(doc.cloneNode(true)).parse();

export function extract(doc, { url, mode = 'auto', fragmentHtml = null, fragmentKind = 'selection', parseArticle = readabilityParse } = {}) {
  const meta = readMetadata(doc, url);
  if (fragmentHtml != null) return { ...meta, contentHtml: fragmentHtml, modeUsed: fragmentKind };

  if (mode !== 'full') {
    // Readability drops ids and classes, so named junk (cookie/consent/ad blocks) must go before it runs.
    const readable = doc.cloneNode(true);
    removeNamedJunk(readable.body);
    const article = parseArticle(readable);
    const articleText = (article?.textContent || '').trim().length;
    const pageText = cleanFullPage(doc.body).textContent.replace(/\s+/g, ' ').trim().length;
    if (article?.content && (mode === 'article' || articleText >= pageText * MIN_ARTICLE_RATIO)) {
      return {
        title: article.title || meta.title,
        site: article.siteName || meta.site,
        author: article.byline || meta.author,
        published: article.publishedTime || meta.published,
        contentHtml: cleanHtml(doc, article.content),
        modeUsed: 'article',
      };
    }
  }
  return { ...meta, contentHtml: cleanFullPage(doc.body).innerHTML, modeUsed: 'full' };
}

// Readability keeps nav, headers and banners on short pages; clean its output the same way.
function cleanHtml(doc, html) {
  const holder = doc.createElement('div');
  holder.innerHTML = html;
  return cleanFullPage(holder).innerHTML;
}

export function cleanFullPage(body) {
  const root = body.cloneNode(true);
  for (const el of root.querySelectorAll(JUNK_SELECTORS)) el.remove();
  removeNamedJunk(root);
  return root;
}

function removeNamedJunk(root) {
  for (const el of root.querySelectorAll('[id], [class]')) {
    if ([el.id, ...el.classList].some((t) => t && JUNK_NAME.test(t))) el.remove();
  }
}

export function readMetadata(doc, url) {
  const meta = (...names) => {
    for (const n of names) {
      const v = doc.querySelector(`meta[property="${n}"], meta[name="${n}"], meta[itemprop="${n}"]`)?.getAttribute('content')?.trim();
      if (v) return v;
    }
    return '';
  };
  return {
    title: meta('og:title', 'twitter:title') || (doc.title || '').trim(),
    site: meta('og:site_name', 'application-name') || hostOf(url),
    author: meta('author', 'article:author'),
    published: meta('article:published_time', 'datePublished', 'date') || doc.querySelector('time[datetime]')?.getAttribute('datetime') || '',
  };
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
