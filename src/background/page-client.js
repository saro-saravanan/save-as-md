async function ensureContent(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
}

export const pageClient = {
  async capture(tabId, opts) {
    await ensureContent(tabId);
    return chrome.tabs.sendMessage(tabId, { type: 'capture', ...opts });
  },
  async toast(tabId, toast) {
    await ensureContent(tabId);
    return chrome.tabs.sendMessage(tabId, { type: 'toast', toast });
  },
  fetchInPage(tabId, urls) {
    return chrome.tabs.sendMessage(tabId, { type: 'fetch-in-page', urls });
  },
};
