const RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
const MAX_TITLE = 80;
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
  'image/avif': 'avif', 'image/svg+xml': 'svg', 'image/bmp': 'bmp', 'image/x-icon': 'ico',
};
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg|bmp|ico)$/i;

export function sanitizeTitle(title) {
  let s = (title || '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[<>:"/\\|?*]/g, ' ')
    .replace(/\p{Extended_Pictographic}\uFE0F?|\u200D/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const chars = Array.from(s);
  if (chars.length > MAX_TITLE) {
    const cut = chars.slice(0, MAX_TITLE).join('');
    s = cut.replace(/\s+\S*$/, '') || cut;
  }
  s = s.replace(/[. ]+$/, '');
  if (!s) s = 'Untitled';
  if (RESERVED.test(s)) s = `${s}_`;
  return s;
}

export function datePrefix(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export const folderNameFor = (date, title) => `${datePrefix(date)} ${sanitizeTitle(title)}`;
export const markdownFileName = (title) => `${sanitizeTitle(title)}.md`;
export const assetName = (index, ext) => `img-${String(index + 1).padStart(2, '0')}.${ext}`;
export const withSuffix = (name, n) => (n < 2 ? name : `${name} (${n})`);

export function extFor(contentType, url) {
  const type = (contentType || '').split(';')[0].trim().toLowerCase();
  if (EXT_BY_TYPE[type]) return EXT_BY_TYPE[type];
  const m = IMAGE_EXT.exec(pathOf(url));
  if (m) return m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
  // Unknown: jpg still renders because viewers sniff the actual bytes.
  return 'jpg';
}

function pathOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}
