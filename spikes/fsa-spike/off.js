function idb(mode, fn) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('spike', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('h');
    req.onsuccess = () => {
      const tx = req.result.transaction('h', mode);
      const r = fn(tx.objectStore('h'));
      tx.oncomplete = () => resolve(r?.result);
      tx.onerror = () => reject(tx.error);
    };
  });
}

chrome.runtime.onMessage.addListener((msg, _s, send) => {
  if (msg.target !== 'off') return false;
  probe().then(send, (e) => send({ state: 'error', error: String(e) }));
  return true;
});

async function probe() {
  const handle = await idb('readonly', (s) => s.get('dir'));
  if (!handle) return { state: 'missing' };
  const state = await handle.queryPermission({ mode: 'readwrite' });
  if (state !== 'granted') return { state };
  const fh = await handle.getFileHandle(`probe-${Date.now()}.txt`, { create: true });
  const w = await fh.createWritable();
  await w.write('ok');
  await w.close();
  return { state, wrote: true };
}
