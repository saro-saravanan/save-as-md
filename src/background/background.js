import { createSaveFlow } from './save-flow.js';
import { createMenus, syncMenus, interpretMenuClick } from './menus.js';
import { offscreenApi } from './offscreen-client.js';
import { downloadsWriter } from './downloads.js';
import { pickFolder, resolveFolderRequest } from './folders.js';
import { getSettings, patchSettings, setSiteMode } from './settings.js';
import { pageClient } from './page-client.js';

const flow = createSaveFlow({
  page: pageClient,
  offscreen: offscreenApi,
  downloads: downloadsWriter,
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

chrome.runtime.onInstalled.addListener(() => createMenus());
chrome.action.onClicked.addListener((tab) => flow.save(tab));

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const choice = interpretMenuClick(info.menuItemId);
  if (!choice || !tab) return;
  if (choice.action === 'save') return flow.save(tab, choice.opts);
  if (choice.action === 'site-mode') await setSiteMode(new URL(tab.url).hostname, choice.mode);
  if (choice.action === 'reddit-mode') await patchSettings({ redditMode: choice.mode });
  await syncMenus(tab.url);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'folder-ready') resolveFolderRequest(msg.requestId, msg.ok);
  // 'keepalive' needs no handling: receiving it is enough to keep the worker alive.
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => syncMenus((await chrome.tabs.get(tabId)).url));
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (tab.active && (change.url || change.status === 'complete')) syncMenus(tab.url);
});
