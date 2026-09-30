import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { absolutize, stripTracking } from './urls.js';
import { placeholder } from './assemble.js';

export const MIN_IMAGE_PX = 32;
const LANG_PATTERNS = [
  /(?:^|\s)lang(?:uage)?-([\w+#-]+)/,
  /(?:^|\s)highlight-(?:source-)?([\w+#-]+)/,
  /brush:\s*([\w+#-]+)/,
];

export function htmlToMarkdown(html, baseUrl) {
  const root = new DOMParser().parseFromString(html, 'text/html').body;
  const images = [];
  normalizeCodeBlocks(root);
  registerImages(root, baseUrl, images);
  const markdown = createTurndown(baseUrl).turndown(root).trim();
  return { markdown, images };
}

function createTurndown(baseUrl) {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*', hr: '---' });
  td.use(gfm);
  td.remove(['script', 'style', 'noscript', 'template', 'iframe', 'button', 'form', 'input', 'select', 'textarea']);
  td.addRule('cleanLinks', {
    filter: (node) => node.nodeName === 'A' && Boolean(node.getAttribute('href')),
    replacement(content, node) {
      const href = node.getAttribute('href').trim();
      if (!content.trim()) return '';
      if (href.startsWith('#') || /^javascript:/i.test(href)) return content;
      const url = stripTracking(absolutize(href, baseUrl)).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20');
      return `[${content}](${url})`;
    },
  });
  return td;
}

function normalizeCodeBlocks(root) {
  for (const pre of [...root.querySelectorAll('pre')]) {
    const code = pre.querySelector('code');
    const lang = detectLang([pre.className, code?.className, pre.parentElement?.className].filter((c) => typeof c === 'string').join(' '));
    const fresh = pre.ownerDocument.createElement('code');
    if (lang) fresh.className = `language-${lang}`;
    fresh.textContent = pre.textContent.replace(/\n$/, '');
    pre.replaceChildren(fresh);
  }
}

function detectLang(classes) {
  for (const re of LANG_PATTERNS) {
    const m = re.exec(classes);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

function registerImages(root, baseUrl, images) {
  // Collect <img> first: SVG swaps below insert placeholder <img>s that must not be registered again.
  const imgs = [...root.querySelectorAll('img')];
  for (const svg of [...root.querySelectorAll('svg')]) {
    if (svg.parentElement?.closest('svg')) continue;
    if (!svgIsBigEnough(svg)) {
      svg.remove();
      continue;
    }
    swap(svg, images, { url: null, data: withXmlns(svg.outerHTML), ext: 'svg', alt: svg.getAttribute('aria-label') });
  }
  for (const img of imgs) {
    const src = (img.getAttribute('src') || '').trim();
    if (!src || (src.startsWith('data:') && src.length < 200)) {
      img.remove();
      continue;
    }
    if (isTiny(img)) {
      replaceTiny(img);
      continue;
    }
    const isData = src.startsWith('data:');
    swap(img, images, { url: isData ? null : absolutize(src, baseUrl), data: isData ? src : null, alt: img.getAttribute('alt') });
  }
}

function swap(el, images, info) {
  const index = images.length;
  const alt = (info.alt || '').replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
  images.push({ index, url: info.url, data: info.data, ext: info.ext ?? null, alt });
  const img = el.ownerDocument.createElement('img');
  img.setAttribute('src', placeholder(index));
  img.setAttribute('alt', alt);
  el.replaceWith(img);
}

function dim(el, attr) {
  const v = parseFloat(el.getAttribute(attr));
  return Number.isFinite(v) ? v : null;
}

function isTiny(img) {
  const w = dim(img, 'width');
  const h = dim(img, 'height');
  return (w !== null && w < MIN_IMAGE_PX) || (h !== null && h < MIN_IMAGE_PX);
}

function replaceTiny(img) {
  const alt = (img.getAttribute('alt') || '').trim();
  if (alt && Array.from(alt).length <= 4) img.replaceWith(img.ownerDocument.createTextNode(alt));
  else img.remove();
}

function svgIsBigEnough(svg) {
  if (svg.querySelector('use')) return false;
  const box = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const w = dim(svg, 'width') ?? (box.length === 4 ? box[2] : null);
  const h = dim(svg, 'height') ?? (box.length === 4 ? box[3] : null);
  return w !== null && h !== null && w >= MIN_IMAGE_PX && h >= MIN_IMAGE_PX;
}

const withXmlns = (markup) =>
  markup.includes('xmlns=') ? markup : markup.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
