const state = new URLSearchParams(location.search).get('state');
document.getElementById('msg').textContent = `Probe said: ${state}`;

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

document.getElementById('go').addEventListener('click', async () => {
  const existing = await idb('readonly', (s) => s.get('dir'));
  let result;
  if (existing && state === 'prompt') {
    result = await existing.requestPermission({ mode: 'readwrite' });
  } else {
    const dir = await showDirectoryPicker({ mode: 'readwrite' });
    await idb('readwrite', (s) => s.put(dir, 'dir'));
    result = 'picked';
  }
  document.getElementById('out').textContent = `Result: ${result}. Close this window and click the toolbar button again.`;
});
