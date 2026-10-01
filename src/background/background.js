import { createSaveFlow } from './save-flow.js';
import { createMenus, syncMenus, interpretMenuClick } from './menus.js';
import { createOffscreenClient } from './offscreen-client.js';
import { createDownloadsWriter } from './downloads.js';
import { pickFolder, resolveFolderRequest } from './folders.js';
import { getSettings, patchSettings, setSiteMode } from './settings.js';
import { createPageClient } from './page-client.js';

const offscreen = createOffscreenClient(chrome);

const flow = createSaveFlow({
  page: createPageClient(chrome),
  offscreen,
  downloads: createDownloadsWriter(chrome, offscreen),
  folders: { pick: pickFolder },
  settings: { get: getSettings, patch: patchSettings },
  // Decided in Task 0, Check C. If the spike showed this navigates or prompts per site, use Step 6's fallback.
  openExternal: (tabId, url) => chrome.tabs.update(tabId, { url }),
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

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'folder-ready') {
    resolveFolderRequest(msg.requestId, msg.ok);
    sendResponse({ ok: true }); // lets the folder page's await settle so it can close itself
  }
  // 'keepalive' needs no handling: receiving it is enough to keep the worker alive.
});

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
