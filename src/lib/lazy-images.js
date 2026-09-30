import { absolutize } from './urls.js';

const LAZY_ATTRS = ['data-src', 'data-lazy-src', 'data-original', 'data-url', 'data-hi-res-src'];

export function largestFromSrcset(srcset) {
  if (!srcset || !srcset.trim()) return null;
  let best = null;
  let bestScore = -1;
  for (const candidate of srcset.trim().split(/,\s+/)) {
    const [url, descriptor = '1x'] = candidate.trim().split(/\s+/);
    const score = parseFloat(descriptor) || 1;
    if (url && score > bestScore) {
      best = url;
      bestScore = score;
    }
  }
  return best;
}

function isPlaceholder(src) {
  return !src || (src.startsWith('data:') && src.length < 200) || /(^|\/)(blank|spacer|placeholder|1x1)[^/]*$/i.test(src);
}

export function resolveLazyImages(root, baseUrl) {
  for (const img of root.querySelectorAll('img')) {
    const picture = img.parentElement?.tagName === 'PICTURE' ? img.parentElement : null;
    const pictureSets = picture
      ? [...picture.querySelectorAll('source')].map((s) => s.getAttribute('srcset') || s.getAttribute('data-srcset')).filter(Boolean)
      : [];
    const ownSet = img.getAttribute('srcset') || img.getAttribute('data-srcset');
    const best = largestFromSrcset([ownSet, ...pictureSets].filter(Boolean).join(', '));
    const lazy = LAZY_ATTRS.map((a) => img.getAttribute(a)).find(Boolean);
    const current = img.getAttribute('src') || '';
    const chosen = best || lazy || (isPlaceholder(current) ? null : current);
    if (chosen) img.setAttribute('src', absolutize(chosen, baseUrl));
    img.removeAttribute('srcset');
    img.removeAttribute('loading');
  }
  for (const source of root.querySelectorAll('picture source')) source.remove();
}
