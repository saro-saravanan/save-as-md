import { assetName, extFor, markdownFileName, withSuffix } from '../lib/filenames.js';
import { assembleDocument } from '../lib/assemble.js';
import { MIN_IMAGE_PX } from '../lib/to-markdown.js';

// Holds fetched images between the 'fetch-images' and 'write' messages. A save that fails in
// between never calls take(), so entries older than the TTL are dropped on the next set().
export class JobStore {
  constructor({ ttlMs = 5 * 60_000, now = () => Date.now() } = {}) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.jobs = new Map();
  }
  get size() {
    return this.jobs.size;
  }
  set(id, value) {
    const cutoff = this.now() - this.ttlMs;
    for (const [key, job] of this.jobs) if (job.at <= cutoff) this.jobs.delete(key);
    this.jobs.set(id, { value, at: this.now() });
  }
  take(id) {
    const job = this.jobs.get(id);
    this.jobs.delete(id);
    return job?.value;
  }
}

export async function fetchImages(images, { fetchImpl = fetch, measure = measureBitmap, concurrency = 6 } = {}) {
  const results = new Array(images.length);
  let next = 0;
  async function worker() {
    while (next < images.length) {
      const i = next++;
      results[i] = await fetchOne(images[i], fetchImpl, measure);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, images.length) }, worker));
  return results;
}

async function fetchOne(img, fetchImpl, measure) {
  try {
    let blob;
    if (img.data && !img.data.startsWith('data:')) {
      blob = new Blob([img.data], { type: 'image/svg+xml' });
    } else {
      const res = await fetchImpl(img.data || img.url);
      if (!res.ok) return { ok: false };
      blob = await res.blob();
    }
    if (blob.type.startsWith('text/')) return { ok: false };
    const size = await measure(blob);
    if (size && size.width < MIN_IMAGE_PX && size.height < MIN_IMAGE_PX) return { ok: true, tiny: true };
    return { ok: true, blob };
  } catch {
    return { ok: false };
  }
}

async function measureBitmap(blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

export function planFiles(capture, fetched) {
  const assets = [];
  const results = capture.images.map((img, i) => {
    const f = fetched[i];
    if (f?.ok && f.tiny) return { status: 'skipped' };
    if (f?.ok && f.blob) {
      const file = assetName(assets.length, img.ext || extFor(f.blob.type, img.url));
      assets.push({ path: `assets/${file}`, blob: f.blob });
      return { status: 'saved', file };
    }
    return img.url ? { status: 'failed', url: img.url } : { status: 'skipped' };
  });
  const markdownFile = markdownFileName(capture.title);
  const markdown = assembleDocument(capture, results);
  const files = [
    ...assets,
    { path: markdownFile, blob: new Blob([markdown], { type: 'text/markdown' }) },
    { path: `.source.${capture.source.ext}`, blob: new Blob([capture.source.text], { type: 'text/plain' }) },
  ];
  const saved = results.filter((r) => r.status === 'saved').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  return { files, stats: { saved, failed, total: saved + failed }, markdownFile };
}

export async function writeFolder(root, desiredName, files, { replace = false } = {}) {
  let name = desiredName;
  if (replace) await root.removeEntry(name, { recursive: true }).catch(() => {});
  else for (let n = 2; await exists(root, name); n++) name = withSuffix(desiredName, n);

  const dir = await root.getDirectoryHandle(name, { create: true });
  // Markdown last: a folder without its .md means "didn't finish", never "looks complete but isn't".
  const ordered = [...files].sort((a, b) => Number(a.path.endsWith('.md')) - Number(b.path.endsWith('.md')));
  try {
    for (const f of ordered) await writeFile(dir, f.path, f.blob);
  } catch (err) {
    await root.removeEntry(name, { recursive: true }).catch(() => {});
    throw err;
  }
  return name;
}

async function exists(root, name) {
  try {
    await root.getDirectoryHandle(name);
    return true;
  } catch {
    return false;
  }
}

async function writeFile(dir, path, blob) {
  const parts = path.split('/');
  const fileName = parts.pop();
  let d = dir;
  for (const p of parts) d = await d.getDirectoryHandle(p, { create: true });
  const fh = await d.getFileHandle(fileName, { create: true });
  const w = await fh.createWritable();
  await w.write(blob);
  await w.close();
}
