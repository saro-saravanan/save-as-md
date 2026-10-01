export function createPageClient(api) {
  // Inject the (large) content bundle only when no live copy answers in the tab.
  async function ensureContent(tabId) {
    try {
      if ((await api.tabs.sendMessage(tabId, { type: 'ping' })) === 'pong') return;
    } catch {
      // No receiver yet (or an orphaned one after an extension reload): inject below.
    }
    await api.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  }

  return {
    probe: ensureContent,
    async capture(tabId, opts) {
      await ensureContent(tabId);
      return api.tabs.sendMessage(tabId, { type: 'capture', ...opts });
    },
    async toast(tabId, toast) {
      await ensureContent(tabId);
      return api.tabs.sendMessage(tabId, { type: 'toast', toast });
    },
    fetchInPage(tabId, urls) {
      return api.tabs.sendMessage(tabId, { type: 'fetch-in-page', urls });
    },
  };
}
