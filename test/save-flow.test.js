import { describe, it, expect, vi } from 'vitest';
import { createSaveFlow } from '../src/background/save-flow.js';
import { datePrefix } from '../src/lib/filenames.js';

const TAB = { id: 7, url: 'https://blog.ex.com/post?utm_source=x' };
const KEY = 'https://blog.ex.com/post';
const MD_PATH = 'C:\\Users\\me\\Downloads\\WebClips\\2026-09-30 T\\T.md';

function sampleCapture(extra = {}) {
  return {
    title: 'T', meta: { title: 'T', source: KEY }, markdown: 'Hello ![a](__IMG_0__)',
    images: [{ index: 0, url: 'https://blog.ex.com/a.png', data: null, ext: null, alt: 'a' }],
    source: { ext: 'html', text: '<html></html>' }, modeUsed: 'article', wordCount: 1234, ...extra,
  };
}

function makeDeps(over = {}) {
  const deps = {
    settingsState: { redditMode: 'top', siteModes: {}, saved: {}, ...over.settings },
    toastAnswers: [...(over.toastAnswers ?? [])],
    page: {
      probe: over.probe ?? vi.fn(async () => {}),
      capture: over.capture ?? vi.fn(async () => ({ capture: sampleCapture(over.captureExtra) })),
      toast: vi.fn(async () => deps.toastAnswers.shift() ?? null),
      fetchInPage: vi.fn(async (_t, urls) => urls.map((url) => ({ url, dataUrl: 'data:image/png;base64,AAA' }))),
    },
    offscreen: {
      fetchImages: vi.fn(async () => ({ failedUrls: over.failedUrls ?? [], usable: over.usable ?? 1 })),
      write: vi.fn(async () => ({ ok: true, markdownFile: 'T.md', stats: over.stats ?? { saved: 2, failed: 0, total: 2 }, blobFiles: [{ path: 'T.md', url: 'blob:1' }] })),
      copy: vi.fn(async () => ({ ok: true })),
    },
    downloads: {
      write: vi.fn(async () => [11, 12]),
      remove: vi.fn(async () => {}),
      absolutePath: vi.fn(async () => MD_PATH),
      show: vi.fn(),
      freeFolderName: vi.fn(async (name) => (over.takenFolders ?? []).includes(name) ? `${name} (2)` : name),
    },
    settings: {
      get: vi.fn(async () => structuredClone(deps.settingsState)),
      patch: vi.fn(async (p) => Object.assign(deps.settingsState, p)),
    },
    openExternal: vi.fn(async () => {}),
    badge: vi.fn(async () => {}),
    clearBadge: vi.fn(async () => {}),
    now: () => new Date(2026, 8, 30, 14, 5),
    newId: () => 'job-1',
  };
  return deps;
}
const lastToast = (deps) => deps.page.toast.mock.calls.at(-1)[1];
const previousSave = (extra = {}) => ({ folderName: '2026-09-01 T', markdownFile: 'T.md', savedAt: '2026-09-01T10:00:00.000Z', downloadIds: [1, 2], ...extra });

describe('save flow', () => {
  it('saves into Downloads\\WebClips and reports stats', async () => {
    const deps = makeDeps();
    expect((await createSaveFlow(deps).save(TAB)).status).toBe('saved');
    expect(deps.page.capture).toHaveBeenCalledWith(7, { scope: 'page', mode: 'auto', redditMode: 'top' });
    expect(deps.offscreen.write).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'job-1', pageData: {} }));
    expect(deps.downloads.write).toHaveBeenCalledWith('2026-09-30 T', [{ path: 'T.md', url: 'blob:1' }]);
    expect(lastToast(deps).text).toBe('Saved · 1,234 words · 2/2 images');
    expect(lastToast(deps).actions.map((a) => a.id)).toEqual(['open', 'folder', 'undo']);
    expect(deps.settingsState.saved[KEY]).toMatchObject({ folderName: '2026-09-30 T', markdownFile: 'T.md', downloadIds: [11, 12] });
  });

  it('opens the saved file in VS Code', async () => {
    const deps = makeDeps({ toastAnswers: ['open'] });
    await createSaveFlow(deps).save(TAB);
    expect(deps.downloads.absolutePath).toHaveBeenCalledWith(12);
    expect(deps.openExternal).toHaveBeenCalledWith(7, 'vscode://file/C:/Users/me/Downloads/WebClips/2026-09-30%20T/T.md');
  });

  it('shows the folder', async () => {
    const deps = makeDeps({ toastAnswers: ['folder'] });
    await createSaveFlow(deps).save(TAB);
    expect(deps.downloads.show).toHaveBeenCalledWith(12);
  });

  it('hides Open when Chrome does not report where the file went', async () => {
    const deps = makeDeps();
    deps.downloads.absolutePath = vi.fn(async () => null);
    await createSaveFlow(deps).save(TAB);
    expect(lastToast(deps).actions.map((a) => a.id)).toEqual(['folder', 'undo']);
  });

  it('uses the remembered mode for the site', async () => {
    const deps = makeDeps({ settings: { siteModes: { 'blog.ex.com': 'full' } } });
    await createSaveFlow(deps).save(TAB);
    expect(deps.page.capture).toHaveBeenCalledWith(7, expect.objectContaining({ mode: 'full' }));
  });

  it('never asks for a folder or folder permission', async () => {
    const deps = makeDeps();
    await createSaveFlow(deps).save(TAB);
    expect(deps.folders).toBeUndefined();
    expect(deps.page.toast).toHaveBeenCalledTimes(1);
  });

  it('offers update or new copy for a page saved before', async () => {
    const deps = makeDeps({ settings: { saved: { [KEY]: previousSave() } }, toastAnswers: ['update'] });
    await createSaveFlow(deps).save(TAB);
    expect(deps.page.toast.mock.calls[0][1].text).toBe('You saved this page on 2026-09-01.');
    expect(deps.downloads.remove).toHaveBeenCalledWith([1, 2]);
    expect(deps.downloads.write).toHaveBeenCalledWith('2026-09-01 T', expect.any(Array));
    expect(deps.downloads.freeFolderName).not.toHaveBeenCalled();
  });

  it('does nothing if the duplicate prompt is dismissed', async () => {
    const deps = makeDeps({ settings: { saved: { [KEY]: previousSave() } } });
    expect((await createSaveFlow(deps).save(TAB)).status).toBe('cancelled');
    expect(deps.offscreen.write).not.toHaveBeenCalled();
  });

  it('shows the previous save date in local time, like the folder names', async () => {
    const savedAt = '2026-09-02T02:30:00.000Z'; // a different calendar day in UTC than in most local zones
    const deps = makeDeps({ settings: { saved: { [KEY]: previousSave({ savedAt }) } } });
    await createSaveFlow(deps).save(TAB);
    expect(deps.page.toast.mock.calls[0][1].text).toBe(`You saved this page on ${datePrefix(new Date(savedAt))}.`);
  });

  it('retries failed images from inside the page', async () => {
    const deps = makeDeps({ failedUrls: ['https://blog.ex.com/a.png'] });
    await createSaveFlow(deps).save(TAB);
    expect(deps.page.fetchInPage).toHaveBeenCalledWith(7, ['https://blog.ex.com/a.png']);
    expect(deps.offscreen.write).toHaveBeenCalledWith(expect.objectContaining({ pageData: { 'https://blog.ex.com/a.png': 'data:image/png;base64,AAA' } }));
  });

  it('warns when images could not be saved', async () => {
    const deps = makeDeps({ stats: { saved: 1, failed: 1, total: 2 } });
    await createSaveFlow(deps).save(TAB);
    expect(lastToast(deps)).toMatchObject({ tone: 'warn', text: 'Saved with warnings · 1 image not saved (linked to original)' });
  });

  it('mentions when it fell back to the full page', async () => {
    const deps = makeDeps({ captureExtra: { modeUsed: 'full' } });
    await createSaveFlow(deps).save(TAB);
    expect(lastToast(deps).text).toBe('Saved · 1,234 words · 2/2 images · full page');
  });

  it('undoes a save and says the empty folder stays', async () => {
    const deps = makeDeps({ toastAnswers: ['undo'] });
    await createSaveFlow(deps).save(TAB);
    expect(deps.downloads.remove).toHaveBeenCalledWith([11, 12]);
    expect(deps.settingsState.saved[KEY]).toBeUndefined();
    expect(lastToast(deps).text).toBe('Removed. Chrome leaves the empty folder in Downloads\\WebClips.');
  });

  it('labels Undo as Delete after updating an existing save', async () => {
    const deps = makeDeps({ settings: { saved: { [KEY]: previousSave() } }, toastAnswers: ['update', 'undo'] });
    await createSaveFlow(deps).save(TAB);
    const saved = deps.page.toast.mock.calls[1][1];
    expect(saved.actions.find((a) => a.id === 'undo').label).toBe('Delete');
    expect(lastToast(deps).text).toBe('Deleted. Chrome leaves the empty folder in Downloads\\WebClips.');
  });

  it('copies Markdown with remote images', async () => {
    const deps = makeDeps();
    expect((await createSaveFlow(deps).save(TAB, { dest: 'clipboard' })).status).toBe('copied');
    expect(deps.offscreen.copy.mock.calls[0][0]).toContain('![a](https://blog.ex.com/a.png)');
    expect(deps.offscreen.write).not.toHaveBeenCalled();
    expect(lastToast(deps).text).toBe('Copied as Markdown · 1,234 words');
  });

  it('reports a capture error', async () => {
    const deps = makeDeps({ capture: vi.fn(async () => ({ error: 'Nothing is selected.' })) });
    await createSaveFlow(deps).save(TAB, { scope: 'selection' });
    expect(lastToast(deps)).toMatchObject({ tone: 'error', text: "Couldn't save: Nothing is selected." });
  });

  it('badges pages the browser protects instead of failing silently', async () => {
    const probe = vi.fn(async () => { throw new Error('Cannot access contents of url "chrome://settings/".'); });
    const deps = makeDeps({ probe });
    expect((await createSaveFlow(deps).save({ id: 7, url: 'chrome://settings/' })).status).toBe('error');
    expect(deps.badge).toHaveBeenCalledWith(7, "This page can't be saved: the browser doesn't allow extensions on it.");
    expect(deps.page.toast).not.toHaveBeenCalled();
  });

  it('explains how to enable local files', async () => {
    const probe = vi.fn(async () => { throw new Error('Cannot access contents of url "file:///C:/notes/a.html". Extension manifest must request permission to access this host.'); });
    const deps = makeDeps({ probe });
    await createSaveFlow(deps).save({ id: 7, url: 'file:///C:/notes/a.html' });
    expect(deps.badge).toHaveBeenCalledWith(7, 'To save local files, turn on "Allow access to file URLs" for SaveMD in chrome://extensions.');
  });

  it('badges PDF tabs instead of suggesting Pick an area', async () => {
    const deps = makeDeps({ capture: vi.fn(async () => ({ protectedPage: true })) });
    expect((await createSaveFlow(deps).save(TAB)).status).toBe('error');
    expect(deps.badge).toHaveBeenCalledWith(7, "This page can't be saved: the browser doesn't allow extensions on it.");
    expect(deps.offscreen.write).not.toHaveBeenCalled();
  });

  it('keeps a same-day "new copy" separate', async () => {
    const deps = makeDeps({ settings: { saved: { [KEY]: previousSave({ folderName: '2026-09-30 T' }) } }, toastAnswers: ['new'], takenFolders: ['2026-09-30 T'] });
    await createSaveFlow(deps).save(TAB);
    expect(deps.downloads.write).toHaveBeenCalledWith('2026-09-30 T (2)', expect.any(Array));
    expect(deps.downloads.remove).not.toHaveBeenCalled();
  });

  it('never overwrites an existing folder, even for selections', async () => {
    const deps = makeDeps({ takenFolders: ['2026-09-30 T'] });
    await createSaveFlow(deps).save(TAB, { scope: 'selection' });
    expect(deps.downloads.write).toHaveBeenCalledWith('2026-09-30 T (2)', expect.any(Array));
  });

  it('refuses to write an empty page and points to Pick an area', async () => {
    const deps = makeDeps({ captureExtra: { wordCount: 0, images: [] } });
    expect((await createSaveFlow(deps).save(TAB)).status).toBe('empty');
    expect(deps.offscreen.write).not.toHaveBeenCalled();
    expect(lastToast(deps).text).toBe("Couldn't find anything to save here. Right-click the SaveMD button → Pick an area to save…");
  });

  it('does not write when no words and no usable images remain', async () => {
    const deps = makeDeps({ captureExtra: { wordCount: 2 }, usable: 0 });
    expect((await createSaveFlow(deps).save(TAB)).status).toBe('empty');
    expect(deps.offscreen.write).not.toHaveBeenCalled();
  });

  it('still saves an image-only page', async () => {
    const deps = makeDeps({ captureExtra: { wordCount: 0 }, usable: 1 });
    expect((await createSaveFlow(deps).save(TAB)).status).toBe('saved');
  });

  it('still reports success when the page goes away before the notice is answered', async () => {
    const deps = makeDeps();
    deps.page.toast = vi.fn(async () => { throw new Error('The message port closed before a response was received.'); });
    expect((await createSaveFlow(deps).save(TAB)).status).toBe('saved');
    expect(deps.badge).not.toHaveBeenCalled();
  });

  it('treats a closed duplicate prompt as a cancel, not an error', async () => {
    const deps = makeDeps({ settings: { saved: { [KEY]: previousSave() } } });
    deps.page.toast = vi.fn(async () => { throw new Error('The message port closed before a response was received.'); });
    expect((await createSaveFlow(deps).save(TAB)).status).toBe('cancelled');
    expect(deps.badge).not.toHaveBeenCalled();
  });
});
