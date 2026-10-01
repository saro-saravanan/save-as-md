import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPageClient } from '../src/background/page-client.js';
import { createOffscreenClient } from '../src/background/offscreen-client.js';
import { createDownloadsWriter } from '../src/background/downloads.js';
import { syncMenus } from '../src/background/menus.js';

describe('page client', () => {
  const fakeApi = (pingWorks) => ({
    tabs: {
      sendMessage: vi.fn(async (_tab, msg) => {
        if (msg.type === 'ping') {
          if (!pingWorks) throw new Error('Could not establish connection. Receiving end does not exist.');
          return 'pong';
        }
        return { ok: msg.type };
      }),
    },
    scripting: { executeScript: vi.fn(async () => {}) },
  });

  it('does not re-inject the content script when it already answers', async () => {
    const api = fakeApi(true);
    await createPageClient(api).capture(3, { scope: 'page' });
    expect(api.scripting.executeScript).not.toHaveBeenCalled();
  });

  it('injects the content script when nothing answers', async () => {
    const api = fakeApi(false);
    expect(await createPageClient(api).capture(3, { scope: 'page' })).toEqual({ ok: 'capture' });
    expect(api.scripting.executeScript).toHaveBeenCalledWith({ target: { tabId: 3 }, files: ['content.js'] });
  });

  it('probe surfaces injection errors on protected pages', async () => {
    const api = fakeApi(false);
    api.scripting.executeScript = vi.fn(async () => { throw new Error('Cannot access contents of url "chrome://settings/".'); });
    await expect(createPageClient(api).probe(3)).rejects.toThrow('Cannot access');
  });
});

describe('offscreen client', () => {
  it('survives two saves racing to create the offscreen document', async () => {
    let exists = false;
    const api = {
      offscreen: {
        hasDocument: vi.fn(async () => false), // both callers see "no document yet"
        createDocument: vi.fn(async () => {
          if (exists) throw new Error('Only a single offscreen document may be created.');
          exists = true;
        }),
      },
      runtime: { sendMessage: vi.fn(async () => ({ state: 'granted' })) },
    };
    const client = createOffscreenClient(api);
    await client.checkPermission('default');
    await expect(client.checkPermission('default')).resolves.toBe('granted');
    expect(api.offscreen.createDocument).toHaveBeenCalledTimes(2);
  });
});

describe('offscreen client messages', () => {
  const api = () => ({
    offscreen: { hasDocument: vi.fn(async () => true), createDocument: vi.fn() },
    runtime: { sendMessage: vi.fn(async () => ({ ok: true })) },
  });

  it('keeps the routing field even when the payload has its own "target"', async () => {
    const a = api();
    await createOffscreenClient(a).write({ jobId: 'j', target: { kind: 'downloads' }, folderName: 'F' });
    const msg = a.runtime.sendMessage.mock.calls[0][0];
    expect(msg.target).toBe('offscreen');
    expect(msg.type).toBe('write');
    expect(msg.payload).toEqual({ jobId: 'j', target: { kind: 'downloads' }, folderName: 'F' });
  });

  it('fails loudly when the offscreen document does not answer', async () => {
    const a = api();
    a.runtime.sendMessage = vi.fn(async () => undefined);
    await expect(createOffscreenClient(a).write({ jobId: 'j' })).rejects.toThrow('did not answer');
  });
});

describe('downloads writer', () => {
  function fakeDownloads() {
    const listeners = new Set();
    let nextId = 1;
    const api = {
      downloads: {
        setUiOptions: vi.fn(async () => {}),
        download: vi.fn(async () => nextId++),
        search: vi.fn(async () => [{ state: 'in_progress' }]),
        onChanged: { addListener: (l) => listeners.add(l), removeListener: (l) => listeners.delete(l) },
      },
    };
    const emit = (id, state) => [...listeners].forEach((l) => l({ id, state: { current: state } }));
    return { api, emit, listeners };
  }
  const files = [{ path: 'assets/img-01.png', url: 'blob:a' }, { path: 'T.md', url: 'blob:b' }];

  afterEach(() => vi.useRealTimers());

  it('waits for every download before revoking blob URLs, then reports the failure', async () => {
    const { api, emit } = fakeDownloads();
    const offscreen = { revoke: vi.fn(async () => {}) };
    const writing = createDownloadsWriter(api, offscreen).write('F', files);
    await vi.waitFor(() => expect(api.downloads.download).toHaveBeenCalledTimes(2));
    emit(1, 'interrupted');
    await new Promise((r) => setTimeout(r, 0));
    expect(offscreen.revoke).not.toHaveBeenCalled(); // download 2 is still reading its blob
    emit(2, 'complete');
    await expect(writing).rejects.toThrow('could not be written');
    expect(offscreen.revoke).toHaveBeenCalledWith(['blob:a', 'blob:b']);
  });

  it('gives up on a download that never finishes', async () => {
    vi.useFakeTimers();
    const { api, listeners } = fakeDownloads();
    const writing = createDownloadsWriter(api, { revoke: async () => {} }, { timeoutMs: 1000 }).write('F', files);
    const caught = writing.catch((e) => e);
    await vi.advanceTimersByTimeAsync(1000);
    expect((await caught).message).toMatch('did not finish');
    expect(listeners.size).toBe(0);
  });

  it('picks a free folder name', async () => {
    const { api } = fakeDownloads();
    api.downloads.search = vi.fn(async ({ filenameRegex }) => (filenameRegex.includes('\\(2\\)') ? [] : [{ id: 9 }]));
    expect(await createDownloadsWriter(api, {}).freeFolderName('2026-09-30 T')).toBe('2026-09-30 T (2)');
  });
});

describe('syncMenus', () => {
  afterEach(() => { delete globalThis.chrome; });

  it('never rejects when menu items are missing or the tab has no URL', async () => {
    globalThis.chrome = {
      storage: { local: { get: vi.fn(async (d) => d) } },
      // A plain function: vi.fn would attach its own handlers to the promise and hide the rejection.
      contextMenus: { update: async () => { throw new Error('Cannot find menu item with id mode:auto'); } },
    };
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      await expect(syncMenus('https://example.com/')).resolves.toBeUndefined();
      await expect(syncMenus(undefined)).resolves.toBeUndefined();
      await new Promise((r) => setTimeout(r, 20));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });
});
