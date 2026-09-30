const waiting = new Map();

export async function pickFolder(mode) {
  const requestId = crypto.randomUUID();
  const done = new Promise((resolve) => waiting.set(requestId, resolve));
  const win = await chrome.windows.create({
    url: chrome.runtime.getURL(`folder.html?mode=${mode}&request=${requestId}`),
    type: 'popup', width: 480, height: 320,
  });
  const onRemoved = (windowId) => {
    if (windowId !== win.id) return;
    chrome.windows.onRemoved.removeListener(onRemoved);
    resolveFolderRequest(requestId, false); // no-op if the page already answered
  };
  chrome.windows.onRemoved.addListener(onRemoved);
  return done;
}

export function resolveFolderRequest(requestId, ok) {
  const resolve = waiting.get(requestId);
  if (!resolve) return;
  waiting.delete(requestId);
  resolve(Boolean(ok));
}
