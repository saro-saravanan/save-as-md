import { isRedditThread } from '../lib/reddit.js';
import { getSettings } from './settings.js';

const ACTION = ['action'];

// Chrome allows 6 top-level items on the toolbar-button menu; this uses exactly 6.
export function createMenus() {
  chrome.contextMenus.removeAll(() => {
    const add = (props) => chrome.contextMenus.create(props);
    add({ id: 'pick', contexts: ACTION, title: 'Pick an area to save…' });
    add({ id: 'copy', contexts: ACTION, title: 'Copy page as Markdown' });
    add({ id: 'save-to', contexts: ACTION, title: 'Save to…' });
    add({ id: 'downloads', contexts: ACTION, title: 'Save to Downloads' });
    add({ id: 'mode', contexts: ACTION, title: 'On this site, save' });
    add({ id: 'mode:auto', parentId: 'mode', contexts: ACTION, type: 'radio', checked: true, title: 'Automatically (article, else full page)' });
    add({ id: 'mode:article', parentId: 'mode', contexts: ACTION, type: 'radio', title: 'Article only' });
    add({ id: 'mode:full', parentId: 'mode', contexts: ACTION, type: 'radio', title: 'Full page' });
    add({ id: 'reddit', contexts: ACTION, title: 'Reddit comments', visible: false });
    add({ id: 'reddit:post', parentId: 'reddit', contexts: ACTION, type: 'radio', title: 'Post only' });
    add({ id: 'reddit:top', parentId: 'reddit', contexts: ACTION, type: 'radio', checked: true, title: 'Post + top 20 threads' });
    add({ id: 'reddit:all', parentId: 'reddit', contexts: ACTION, type: 'radio', title: 'Everything loaded' });
    add({ id: 'page:save', contexts: ['page'], title: 'Save page as Markdown' });
    add({ id: 'page:selection', contexts: ['selection'], title: 'Save selection as Markdown' });
  });
}

const SAVE_ITEMS = {
  pick: { scope: 'pick' },
  copy: { dest: 'clipboard' },
  'save-to': { dest: 'oneoff' },
  downloads: { dest: 'downloads' },
  'page:save': {},
  'page:selection': { scope: 'selection' },
};

export function interpretMenuClick(id) {
  if (id in SAVE_ITEMS) return { action: 'save', opts: SAVE_ITEMS[id] };
  const [group, mode] = String(id).split(':');
  if (group === 'mode' && mode) return { action: 'site-mode', mode };
  if (group === 'reddit' && mode) return { action: 'reddit-mode', mode };
  return null;
}

// Called from tab and window events; must never throw (menus may not exist yet on first install).
export async function syncMenus(url) {
  if (!url?.startsWith('http')) return;
  try {
    const { siteModes, redditMode } = await getSettings();
    const update = (id, props) => Promise.resolve(chrome.contextMenus.update(id, props)).catch(() => {});
    await Promise.all([
      update(`mode:${siteModes[new URL(url).hostname] || 'auto'}`, { checked: true }),
      update('reddit', { visible: isRedditThread(url) }),
      update(`reddit:${redditMode}`, { checked: true }),
    ]);
  } catch {
    // Settings unavailable or a malformed URL: leave the menus as they are.
  }
}
