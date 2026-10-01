import { decodeEntities } from './urls.js';
import { placeholder } from './assemble.js';

const THREAD = /^https?:\/\/(?:www\.|old\.|new\.|np\.)?reddit\.com\/r\/[^/]+\/comments\/[a-z0-9]+/i;
export const REDDIT_TOP_N = 20;
export const REDDIT_MAX_DEPTH = { post: 0, top: 4, all: 10 };

export const isRedditThread = (url) => THREAD.test(url || '');

export function redditJsonUrl(url) {
  const u = new URL(url);
  u.pathname = `${u.pathname.replace(/\/?$/, '/')}.json`;
  u.search = '?raw_json=1&limit=500';
  u.hash = '';
  return u.href;
}

const isoDate = (sec) => new Date(sec * 1000).toISOString().slice(0, 10);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function redditToMarkdown(json, mode = 'top') {
  const post = json[0].data.children[0].data;
  const images = [];
  const addImage = (url, alt = '') => {
    const index = images.length;
    const cleanAlt = alt.replace(/[[\]]/g, '').trim();
    images.push({ index, url: decodeEntities(url), data: null, ext: null, alt: cleanAlt });
    return `![${cleanAlt}](${placeholder(index)})`;
  };

  const parts = [`*${post.subreddit_name_prefixed} · u/${post.author} · ${post.score} points · ${isoDate(post.created_utc)}*`];
  if (post.selftext) parts.push(inlineImages(post.selftext.trim(), post.media_metadata, addImage));
  parts.push(...postMedia(post, addImage));
  if (post.url && !post.is_self && !isMediaPost(post)) parts.push(`Link: <${decodeEntities(post.url)}>`);

  if (mode !== 'post') {
    const listing = json[1]?.data?.children || [];
    const roots = mode === 'top' ? listing.filter((c) => c.kind === 't1').slice(0, REDDIT_TOP_N) : listing;
    const rendered = renderComments(roots, 1, REDDIT_MAX_DEPTH[mode] ?? 4, addImage);
    if (rendered.length) parts.push('---', '## Comments', ...rendered);
  }

  return {
    title: post.title,
    meta: { title: post.title, site: post.subreddit_name_prefixed, author: `u/${post.author}`, published: isoDate(post.created_utc) },
    markdown: parts.filter(Boolean).join('\n\n'),
    images,
  };
}

const isMediaPost = (post) => Boolean(post.is_gallery || post.post_hint === 'image' || post.is_video);

function postMedia(post, addImage) {
  if (post.is_gallery && post.gallery_data && post.media_metadata) {
    return post.gallery_data.items
      .map((item) => {
        const m = post.media_metadata[item.media_id];
        const url = m?.s?.u || m?.s?.gif;
        return url ? addImage(url, item.caption || '') : '';
      })
      .filter(Boolean);
  }
  if (post.post_hint === 'image' && post.url) return [addImage(post.url, post.title)];
  if (post.is_video) {
    const out = [];
    const thumb = post.preview?.images?.[0]?.source?.url;
    if (thumb) out.push(addImage(thumb, 'Video thumbnail'));
    out.push(`[▶ Video on Reddit](https://www.reddit.com${post.permalink})`);
    return out;
  }
  return [];
}

const IMAGE_HOSTS = /^(preview|i|external-preview)\.redd\.it$/i;
const IMAGE_PATH = /\.(png|jpe?g|gif|webp|avif)$/i;
// A bare URL: at the start or after whitespace, so link targets like [text](url) are left alone.
const BARE_URL = /(^|\s)(https?:\/\/[^\s<>()[\]]+)/g;
// Reddit's own embed syntax: ![gif](giphy|ID) or ![img](mediaId), resolved through media_metadata.
const EMBED = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

function isImageUrl(url) {
  try {
    const u = new URL(url);
    return IMAGE_HOSTS.test(u.hostname) || IMAGE_PATH.test(u.pathname);
  } catch {
    return false;
  }
}

function embedUrl(ref, media = {}) {
  const m = media[ref];
  const fromMetadata = m?.status === 'valid' ? m.s?.gif || m.s?.u : null;
  if (fromMetadata) return fromMetadata;
  const giphy = /^giphy\|([\w-]+)/.exec(ref);
  return giphy ? `https://i.giphy.com/media/${giphy[1]}/giphy.gif` : null;
}

// Reddit renders bare image links and its embed syntax as pictures; make them saved images.
function inlineImages(text, media, addImage) {
  return text
    .replace(EMBED, (whole, alt, ref) => {
      if (/^https?:/i.test(ref)) return whole;
      const url = embedUrl(ref, media);
      return url ? addImage(url, alt) : whole;
    })
    .replace(BARE_URL, (whole, lead, url) => (isImageUrl(url) ? `${lead}${addImage(url)}` : whole));
}

function renderComments(children, depth, maxDepth, addImage) {
  const blocks = [];
  for (const child of children) {
    if (child.kind === 'more') {
      if (child.data.count > 0) blocks.push(quote(`*${plural(child.data.count, 'more reply', 'more replies')} not loaded*`, depth));
      continue;
    }
    if (child.kind !== 't1') continue;
    const c = child.data;
    const body = inlineImages((c.body || '').trim(), c.media_metadata, addImage);
    blocks.push(quote(`**u/${c.author}** · ${c.score} points · ${isoDate(c.created_utc)}\n\n${body}`, depth));
    const replies = c.replies?.data?.children || [];
    if (!replies.length) continue;
    if (depth < maxDepth) blocks.push(...renderComments(replies, depth + 1, maxDepth, addImage));
    else blocks.push(quote(`*${plural(countAll(replies), 'deeper reply', 'deeper replies')} not included*`, depth + 1));
  }
  return blocks;
}

function countAll(children) {
  let n = 0;
  for (const c of children) {
    if (c.kind === 'more') n += c.data.count || 0;
    else if (c.kind === 't1') n += 1 + countAll(c.data.replies?.data?.children || []);
  }
  return n;
}

const quote = (text, depth) => text.split('\n').map((line) => `${'> '.repeat(depth)}${line}`.trimEnd()).join('\n');
