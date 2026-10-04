// Captures the Chrome Web Store images from the real extension: 1280x800 screenshots of pages just
// saved (with SaveMD's notice showing) and of the Options page, plus the 440x280 promo tile.
// Run `node build.mjs --e2e && node scripts/store-assets.mjs`; output goes to store/.
import puppeteer from 'puppeteer';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SHOTS = [
  { name: 'screenshot-1-article', url: 'https://en.wikipedia.org/wiki/Heirloom_tomato' },
  { name: 'screenshot-2-docs', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
];
const OUT = resolve('store');
await mkdir(OUT, { recursive: true });

const profile = await mkdtemp(join(tmpdir(), 'savemd-store-'));
const downloads = join(profile, 'Downloads');
await mkdir(join(profile, 'Default'), { recursive: true });
await writeFile(join(profile, 'Default', 'Preferences'), JSON.stringify({ download: { default_directory: downloads, prompt_for_download: false } }));

const browser = await puppeteer.launch({ headless: true, userDataDir: profile, enableExtensions: [resolve('dist-e2e')], args: ['--allow-file-access-from-files'] });
await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().endsWith('/background.js'));
const [extension] = (await browser.extensions()).values();

// Options first, before any save, so it shows no "last save" path from this machine.
const options = await browser.newPage();
await options.setViewport({ width: 1280, height: 800 });
await options.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
await options.goto(`chrome-extension://${extension.id}/options.html`, { waitUntil: 'networkidle0' });
await options.screenshot({ path: join(OUT, 'screenshot-3-options.png') });

for (const { name, url } of SHOTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    // No campaign banners or third-party ads in a store listing.
    for (const sel of ['#siteNotice', '#centralNotice', '.cdx-message', '.page-layout__banner', 'mdn-placement-sidebar', 'mdn-placement-bottom']) document.querySelectorAll(sel).forEach((e) => e.remove());
  });
  await page.triggerExtensionAction(extension);
  await page.waitForFunction(() => /^Saved/.test(document.getElementById('savemd-toast-host')?.shadowRoot?.querySelector('.text')?.textContent ?? ''), { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  await page.close();
}

const tile = await browser.newPage();
await tile.setViewport({ width: 440, height: 280 });
await tile.goto(pathToFileURL(resolve('store/promo-small.html')).href, { waitUntil: 'networkidle0' });
await tile.evaluate(() => document.fonts.ready);
await tile.screenshot({ path: join(OUT, 'promo-small.png') });

await browser.close();
await rm(profile, { recursive: true, force: true }).catch(() => {});
console.log('Wrote store/ screenshots and promo tile');
