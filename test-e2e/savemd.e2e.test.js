// End-to-end: a throwaway Chrome for Testing with SaveMD (dist-e2e/) loaded, saving real pages
// through the real toolbar action into a temporary Downloads folder.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, stat, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { startServer } from './server.mjs';
import { datePrefix } from '../src/lib/filenames.js';

let browser, server, worker, extension, base, profileDir, downloadDir, linkedDir;
// Computed per use: a run can cross midnight.
const today = () => datePrefix(new Date());
// DownloadsWebClips is a junction to linkedDir, the way the README tells people to set it up,
// so every test also proves Chrome's downloads write through the link.
const clips = () => linkedDir;

beforeAll(async () => {
  server = await startServer();
  // localhost (not 127.0.0.1) so the 127.0.0.1 image on images.html is a genuinely different origin.
  base = `http://localhost:${server.address().port}`;
  profileDir = await mkdtemp(join(tmpdir(), 'savemd-e2e-'));
  downloadDir = join(profileDir, 'Downloads');
  linkedDir = join(profileDir, 'My Clips');
  await mkdir(downloadDir, { recursive: true });
  await mkdir(linkedDir, { recursive: true });
  await symlink(linkedDir, join(downloadDir, 'WebClips'), 'junction');
  await mkdir(join(profileDir, 'Default'), { recursive: true });
  await writeFile(join(profileDir, 'Default', 'Preferences'), JSON.stringify({
    download: { default_directory: downloadDir, prompt_for_download: false },
  }));
  browser = await puppeteer.launch({
    headless: true,
    userDataDir: profileDir,
    enableExtensions: [resolve('dist-e2e')],
  });
  const target = await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().endsWith('/background.js'));
  worker = await target.worker();
  [extension] = (await browser.extensions()).values();
}, 120000);

afterAll(async () => {
  await browser?.close();
  server?.close();
  if (profileDir) await rm(profileDir, { recursive: true, force: true }).catch(() => {});
});

async function open(path) {
  const page = await browser.newPage();
  await page.goto(path.includes('://') ? path : `${base}${path}`, { waitUntil: 'load' });
  await page.bringToFront();
  return page;
}

const toastText = (page) =>
  page.evaluate(() => document.getElementById('savemd-toast-host')?.shadowRoot?.querySelector('.text')?.textContent ?? null);

async function waitForToast(page, pattern) {
  await page.waitForFunction(
    (source) => {
      const text = document.getElementById('savemd-toast-host')?.shadowRoot?.querySelector('.text')?.textContent;
      return text && new RegExp(source).test(text);
    },
    { timeout: 30000 },
    pattern.source,
  ).catch(async (err) => {
    throw new Error(`Expected a notice matching ${pattern}, last notice was: ${JSON.stringify(await toastText(page))}`, { cause: err });
  });
  return toastText(page);
}

const clickToast = (page, id) =>
  page.evaluate((actionId) => document.getElementById('savemd-toast-host').shadowRoot.querySelector(`[data-id="${actionId}"]`).click(), id);

async function waitForOpenButton(page) {
  for (let i = 0; i < 40; i++) {
    const frame = page.frames().find((f) => f.url().includes('/open.html#'));
    if (frame && (await frame.$('#open'))) return frame;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('The Open button never loaded');
}

async function saveWithToolbar(page, pattern = /^Saved/) {
  await page.triggerExtensionAction(extension);
  return waitForToast(page, pattern);
}

async function activeTabId() {
  return worker.evaluate(async () => (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0].id);
}

async function savedFolder(name) {
  const dir = join(clips(), name);
  const files = existsSync(dir) ? await readdir(dir, { recursive: true }) : [];
  return { dir, files: files.map((f) => f.replace(/\\/g, '/')).sort() };
}

describe('SaveMD in Chrome', () => {
  it('saves an article with its lazy-loaded image, code language and clean links', async () => {
    const page = await open('/fixtures/article.html');
    expect(await saveWithToolbar(page)).toMatch(/^Saved · [\d,]+ words · 1\/1 images$/);

    const { dir, files } = await savedFolder(`${today()} Why lazy images break printing`);
    expect(files).toEqual(['Why lazy images break printing.md', '_source.html', 'assets', 'assets/img-01.png']);
    expect(await readFile(join(dir, '_source.html'), 'utf8')).toMatch(/^<!-- saved from /);
    const md = await readFile(join(dir, 'Why lazy images break printing.md'), 'utf8');
    expect(md).toMatch(/^---\ntitle: "Why lazy images break printing"\n/);
    expect(md).toContain('author: "Ada Lovelace"');
    expect(md).toContain('![Placeholder next to the real image](assets/img-01.png)');
    expect(md).toContain('```js\nimg.src = img.dataset.src;\n```');
    expect(md).toContain(`(${base}/archive?page=2)`);
    expect(md).not.toMatch(/utm_|cookies/);
    expect((await readFile(join(dir, 'assets/img-01.png'))).subarray(1, 4).toString()).toBe('PNG');
    await page.close();
  });

  it('saves lazy, cross-origin, hotlink-protected and extension-less images', async () => {
    const page = await open('/images.html');
    expect(await saveWithToolbar(page)).toMatch(/· 4\/4 images$/);
    const { dir, files } = await savedFolder(`${today()} Images of every kind`);
    expect(files.filter((f) => f.startsWith('assets/'))).toEqual(['assets/img-01.png', 'assets/img-02.png', 'assets/img-03.png', 'assets/img-04.jpg']);
    const md = await readFile(join(dir, 'Images of every kind.md'), 'utf8');
    expect(md).not.toContain('image not saved');
    await page.close();
  });

  it('asks before saving the same page again and keeps both copies', async () => {
    const page = await open('/fixtures/article.html');
    expect(await saveWithToolbar(page, /^You saved this page on/)).toBe(`You saved this page on ${today()}.`);
    await clickToast(page, 'new');
    await waitForToast(page, /^Saved/);
    const { files } = await savedFolder(`${today()} Why lazy images break printing (2)`);
    expect(files).toContain('Why lazy images break printing.md');
    await page.close();
  });

  it('undoes a save', async () => {
    const page = await open('/fixtures/code-and-tables.html');
    await saveWithToolbar(page);
    const { dir, files } = await savedFolder(`${today()} Install the CLI · Example Docs`);
    expect(files).toContain('Install the CLI · Example Docs.md');
    const md = await readFile(join(dir, 'Install the CLI · Example Docs.md'), 'utf8');
    expect(md).toContain('```shell');
    expect(md).toContain('<table>');

    await clickToast(page, 'undo');
    expect(await waitForToast(page, /^Removed/)).toBe('Removed. Chrome leaves the empty folder in Downloads\\WebClips.');
    await expect(stat(join(dir, 'Install the CLI · Example Docs.md'))).rejects.toThrow();
    await page.close();
  });

  it('keeps navigation and cookie banners out of a short listing page', async () => {
    const page = await open('/fixtures/listing.html');
    await saveWithToolbar(page);
    const { dir } = await savedFolder(`${today()} Releases – Example Tools`);
    const md = await readFile(join(dir, 'Releases – Example Tools.md'), 'utf8');
    expect(md).toContain('| 3.2.0 | 2026-09-12 | Faster sync |');
    expect(md).not.toMatch(/Accept all cookies|Example Tools Inc/);
    await page.close();
  });

  it('refuses to save an empty app shell and suggests picking an area', async () => {
    const before = existsSync(clips()) ? await readdir(clips()) : [];
    const page = await open('/empty.html');
    expect(await saveWithToolbar(page, /^Couldn't find/)).toBe(
      "Couldn't find anything to save here. Right-click the SaveMD button → Pick an area to save…",
    );
    expect(await readdir(clips())).toEqual(before);
    await page.close();
  });

  it('saves only the picked area', async () => {
    const page = await open('/pick.html');
    const tabId = await activeTabId();
    const saving = worker.evaluate((id) => globalThis.__savemdTest.save(id, { scope: 'pick' }), tabId);
    await page.waitForSelector('[data-savemd-picker="overlay"]');
    const box = await (await page.$('#wanted p')).boundingBox();
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.keyboard.press('ArrowUp'); // widen from the paragraph to its section
    await page.mouse.click(box.x + 5, box.y + 5);
    await saving;
    const { dir } = await savedFolder(`${today()} Pick test`);
    const md = await readFile(join(dir, 'Pick test.md'), 'utf8');
    expect(md).toContain('Only this part');
    expect(md).not.toMatch(/Not this part|Site navigation/);
    await page.close();
  });

  it('copies a page as Markdown', async () => {
    const page = await open('/fixtures/listing.html');
    const tabId = await activeTabId();
    await browser.defaultBrowserContext().overridePermissions(base, ['clipboard-read']);
    // The save resolves only after its notice closes, so check the notice while it is showing.
    const saving = worker.evaluate((id) => globalThis.__savemdTest.save(id, { dest: 'clipboard' }), tabId);
    expect(await waitForToast(page, /^Copied/)).toMatch(/^Copied as Markdown · [\d,]+ words$/);
    expect(await saving).toEqual({ status: 'copied' });
    // The Windows clipboard stores text with CRLF line endings.
    const copied = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');
    expect(copied).toMatch(/^---\ntitle: "Releases – Example Tools"/);
    expect(copied).toContain('| 3.2.0 | 2026-09-12 | Faster sync |');
    await page.close();
  });

  it('shows its notice above a page overlay that covers everything', async () => {
    const page = await open('/overlay.html');
    await saveWithToolbar(page);
    const onTop = await page.evaluate(() => {
      const host = document.getElementById('savemd-toast-host');
      const box = host.shadowRoot.querySelector('.toast').getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { inTopLayer: host.matches(':popover-open'), hitIsNotice: hit === host, width: Math.round(box.width) };
    });
    expect(onTop).toMatchObject({ inTopLayer: true, hitIsNotice: true });
    expect(onTop.width).toBeGreaterThan(100);
    await page.close();
  });

  it('opens the saved file from the notice, even on a page that forbids frames', async () => {
    const page = await open('/strict.html');
    await saveWithToolbar(page);
    const frame = await waitForOpenButton(page);
    expect(await frame.$eval('#open', (b) => b.textContent)).toBe('Open');
    const box = await (await frame.$('#open')).boundingBox();
    expect(box.width).toBeGreaterThan(40);
    // Delete the file first so nothing launches on this machine; Chrome then reports the missing
    // file instead of "User gesture required", which proves the click came from the extension.
    const downloadId = Number(new URL(frame.url()).hash.slice(1));
    await worker.evaluate((id) => chrome.downloads.removeFile(id), downloadId);
    await frame.click('#open');
    await expect.poll(() => frame.$eval('#open', (b) => b.title), { timeout: 5000 }).toMatch(/deleted/i);
    await page.close();
  });

  it('keeps code that web components render in their shadow DOM', async () => {
    const page = await open('/components.html');
    await saveWithToolbar(page);
    const md = await readFile(join(clips(), `${today()} Component docs`, 'Component docs.md'), 'utf8');
    expect(md).toContain('```js\nconst answer = await fetch(url);\n```');
    await page.close();
  });

  it('badges browser pages it is not allowed to read', async () => {
    const page = await open('chrome://version');
    const tabId = await activeTabId();
    await page.triggerExtensionAction(extension);
    await expect.poll(() => worker.evaluate((id) => chrome.action.getBadgeText({ tabId: id }), tabId), { timeout: 15000 }).toBe('!');
    expect(await worker.evaluate((id) => chrome.action.getTitle({ tabId: id }), tabId)).toBe(
      "This page can't be saved: the browser doesn't allow extensions on it.",
    );
    await page.close();
  });
});
