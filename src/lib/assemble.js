import { buildFrontmatter } from './frontmatter.js';

export const placeholder = (index) => `__IMG_${index}__`;
const IMAGE_MD = /!\[([^\]]*)\]\(__IMG_(\d+)__\)/g;
const BARE = /__IMG_(\d+)__/g;

export function applyImageResults(markdown, results) {
  return markdown
    .replace(IMAGE_MD, (_m, alt, i) => {
      const r = results[Number(i)] ?? { status: 'skipped' };
      if (r.status === 'saved') return `![${alt}](assets/${r.file})`;
      if (r.status === 'remote') return `![${alt}](${r.url})`;
      if (r.status === 'failed') return `![${alt}](${r.url}) *(image not saved)*`;
      return '';
    })
    .replace(BARE, (_m, i) => {
      const r = results[Number(i)];
      return r?.status === 'saved' ? `assets/${r.file}` : (r?.url ?? '');
    });
}

export function remoteResults(images) {
  return images.map((img) => (img.url ? { status: 'remote', url: img.url } : { status: 'skipped' }));
}

export function countWords(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/^\s*(?:[-*+>#|]\s*)+/gm, ' ')
    .replace(/[*_`|[\]]/g, ' ');
  return (text.match(/[\p{L}\p{N}]\S*/gu) || []).length;
}

export function assembleDocument(capture, results) {
  const body = applyImageResults(capture.markdown, results).trim();
  const heading = /^#\s/.test(body) ? '' : `# ${capture.meta.title}\n\n`;
  return `${buildFrontmatter(capture.meta)}\n\n${heading}${body}\n`;
}
