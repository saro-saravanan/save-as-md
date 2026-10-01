import { createSaveFlow } from './save-flow.js';
import { createMenus, syncMenus, interpretMenuClick } from './menus.js';
import { createOffscreenClient } from './offscreen-client.js';
import { createDownloadsWriter } from './downloads.js';
import { getSettings, patchSettings, setSiteMode } from './settings.js';
import { createPageClient } from './page-client.js';

const offscreen = createOffscreenClient(chrome);

const flow = createSaveFlow({
  page: createPageClient(chrome),
  offscreen,
  downloads: createDownloadsWriter(chrome, offscreen),
  settings: { get: getSettings, patch: patchSettings },
  badge: async (tabId, text) => {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#d1242f' });
    await chrome.action.setBadgeText({ tabId, text: '!' });
    await chrome.action.setTitle({ tabId, title: text });
  },
  clearBadge: async (tabId) => {
    await chrome.action.setBadgeText({ tabId, text: '' });
    await chrome.action.setTitle({ tabId, title: 'Save page as Markdown (right-click for more)' });
  },
  now: () => new Date(),
  newId: () => crypto.randomUUID(),
});

// End-to-end tests drive menu-only actions (pick, copy) through this; `npm run build` compiles it out.
if (__E2E__) {
  globalThis.__savemdTest = { save: async (tabId, opts) => flow.save(await chrome.tabs.get(tabId), opts) };
}

const hostOf = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

chrome.runtime.onInstalled.addListener(() => createMenus());
chrome.action.onClicked.addListener((tab) => flow.save(tab));

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const choice = interpretMenuClick(info.menuItemId);
  if (!choice || !tab) return;
  if (choice.action === 'save') return flow.save(tab, choice.opts);
  // tab.url is undefined on pages the extension can't see (chrome://, other extensions).
  const host = hostOf(tab.url);
  if (choice.action === 'site-mode' && host) await setSiteMode(host, choice.mode);
  if (choice.action === 'reddit-mode') await patchSettings({ redditMode: choice.mode });
  await syncMenus(tab.url);
});

// The content script pings 'keepalive' while a pick or notice is pending; receiving the message is
// what keeps the worker alive, so the listener has nothing else to do.
chrome.runtime.onMessage.addListener(() => {});

// Menu radio state is global, so refresh it whenever the visible tab changes: tab switch,
// navigation, or focusing a different window.
async function syncActiveTab(query) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, ...query });
    await syncMenus(tab?.url);
  } catch {
    // Tab closed mid-query; the next event will resync.
  }
}
chrome.tabs.onActivated.addListener(({ windowId }) => syncActiveTab({ windowId }));
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (tab.active && (change.url || change.status === 'complete')) syncMenus(tab.url);
});
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) syncActiveTab({ windowId });
});
