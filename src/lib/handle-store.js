const DB = 'savemd';
const STORE = 'handles';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export const getHandle = (key) => run('readonly', (s) => s.get(key));
export const setHandle = (key, handle) => run('readwrite', (s) => s.put(handle, key));
export const deleteHandle = (key) => run('readwrite', (s) => s.delete(key));
