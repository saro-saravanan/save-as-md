chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'vscode', contexts: ['action'], title: 'Open win.ini in VS Code' });
  chrome.contextMenus.create({ id: 'dl', contexts: ['action'], title: 'Download 3 files silently' });
});

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({ url: 'off.html', reasons: ['BLOBS'], justification: 'spike' });
}

chrome.action.onClicked.addListener(async () => {
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({ target: 'off', type: 'probe' });
  console.log('probe result', res);
  if (res.state !== 'granted') {
    chrome.windows.create({ url: `pick.html?state=${res.state}`, type: 'popup', width: 420, height: 240 });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'vscode') {
    await chrome.tabs.update(tab.id, { url: 'vscode://file/C:/Windows/win.ini' });
  }
  if (info.menuItemId === 'dl') {
    await chrome.downloads.setUiOptions({ enabled: false });
    for (const n of [1, 2, 3]) {
      await chrome.downloads.download({ url: `data:text/plain,file ${n}`, filename: `SaveMD-spike/file-${n}.txt`, conflictAction: 'overwrite' });
    }
    setTimeout(() => chrome.downloads.setUiOptions({ enabled: true }), 3000);
  }
});
