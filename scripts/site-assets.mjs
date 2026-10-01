// Captures the website's proof images from the real extension: for each page, a screenshot of the
// page as it looks (the packet front), SaveMD's notice after saving it, and the saved Markdown.
// Run `node build.mjs --e2e && node scripts/site-assets.mjs`; output goes to site/assets/.
import puppeteer from 'puppeteer';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PAGES = [
  { key: 'tomato', url: 'https://en.wikipedia.org/wiki/Heirloom_tomato' },
  { key: 'pea', url: 'https://en.wikipedia.org/wiki/Snap_pea' },
  { key: 'fetch', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
];
const OUT = resolve('site/assets');

const profile = await mkdtemp(join(tmpdir(), 'savemd-assets-'));
const downloads = join(profile, 'Downloads');
await mkdir(join(profile, 'Default'), { recursive: true });
await writeFile(join(profile, 'Default', 'Preferences'), JSON.stringify({ download: { default_directory: downloads, prompt_for_download: false } }));
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, userDataDir: profile, enableExtensions: [resolve('dist-e2e')] });
await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().endsWith('/background.js'));
const [extension] = (await browser.extensions()).values();
const facts = {};

for (const { key, url } of PAGES) {
  const page = await browser.newPage();
  // A phone-width viewport (320 px; the crop keeps its left edge and drops only the right margin), so the article reflows to the packet window and lines wrap at whole words.
  await page.setViewport({ width: 320, height: 860, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  // The packet window shows the article from its title down: no campaign banners, site chrome or ads.
  const clip = await page.evaluate(() => {
    for (const sel of ['#siteNotice', '#centralNotice', '.cdx-message']) document.querySelectorAll(sel).forEach((e) => e.remove());
    window.scrollTo(0, 0);
    const r = document.querySelector('main h1, #firstHeading, h1').getBoundingClientRect();
    // About 300 CSS px wide: shown in a ~225 px window, the page's own text stays readable (~11 px).
    return { x: 0, y: Math.max(0, r.top - 10), width: 304, height: 266 };
  });
  await page.screenshot({ path: join(OUT, `${key}-page.png`), clip });
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
  await page.triggerExtensionAction(extension);
  await page.waitForFunction(() => /^Saved/.test(document.getElementById('savemd-toast-host')?.shadowRoot?.querySelector('.text')?.textContent ?? ''), { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 600));
  const notice = await page.evaluate(() => {
    const host = document.getElementById('savemd-toast-host');
    const box = host.shadowRoot.querySelector('.toast').getBoundingClientRect();
    return { text: host.shadowRoot.querySelector('.text').textContent, x: box.x, y: box.y, width: box.width, height: box.height };
  });
  if (key === 'tomato') {
    await page.screenshot({ path: join(OUT, 'notice.png'), clip: { x: notice.x - 16, y: notice.y - 16, width: notice.width + 32, height: notice.height + 32 } });
  }
  facts[key] = { url, notice: notice.text };
  await page.close();
}
await new Promise((r) => setTimeout(r, 2000));
await browser.close();

// Copy each saved Markdown file and list its folder, so the site shows what was really written.
const clips = join(downloads, 'WebClips');
for (const folder of await readdir(clips)) {
  const files = (await readdir(join(clips, folder), { recursive: true })).map((f) => f.replace(/\\/g, '/')).sort();
  const md = files.find((f) => f.endsWith('.md'));
  const text = await readFile(join(clips, folder, md), 'utf8');
  const source = /^source: "([^"]+)"/m.exec(text)?.[1] ?? '';
  const entry = Object.entries(facts).find(([, f]) => source && f.url.startsWith(source.replace(/\/$/, '')))
    ?? Object.entries(facts).find(([, f]) => f.url.includes(source.split('/').pop()));
  if (!entry) continue;
  const [key] = entry;
  await writeFile(join(OUT, `${key}.md`), text);
  facts[key].folder = folder;
  facts[key].files = files;
}

// Smaller, web-friendly copies of the page screenshots.
for (const { key } of PAGES) {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(OUT, `${key}-page.png`), '-quality', '84', join(OUT, `${key}-front.webp`)]);
  await rm(join(OUT, `${key}-page.png`));
}
await rm(profile, { recursive: true, force: true }).catch(() => {});
console.log(JSON.stringify(facts, null, 2));
