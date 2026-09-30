import { getHandle, setHandle } from '../lib/handle-store.js';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') || 'default';
const requestId = params.get('request');
const COPY = {
  default: { title: 'Where should saved pages go?', detail: 'SaveMD puts every saved page in this folder. You can change it later in Options.', button: 'Choose folder' },
  oneoff: { title: 'Save this page to…', detail: 'Pick a folder for this page only.', button: 'Choose folder' },
  regrant: { title: 'Allow SaveMD to use your save folder', detail: 'Chrome asks again after it restarts. One click and saving continues.', button: 'Allow access' },
};
const $ = (id) => document.getElementById(id);
$('title').textContent = COPY[mode].title;
$('detail').textContent = COPY[mode].detail;
$('go').textContent = COPY[mode].button;

// Keep the service worker alive while the person decides.
setInterval(() => chrome.runtime.sendMessage({ type: 'keepalive' }).catch(() => {}), 20000);

$('go').addEventListener('click', async () => {
  try {
    let ok = false;
    const existing = mode === 'regrant' ? await getHandle('default') : null;
    if (existing) {
      ok = (await existing.requestPermission({ mode: 'readwrite' })) === 'granted';
    } else {
      const handle = await showDirectoryPicker({ id: 'savemd', mode: 'readwrite' });
      await setHandle(mode === 'oneoff' ? 'oneoff' : 'default', handle);
      ok = true;
    }
    if (!ok) {
      $('status').textContent = 'Access was not allowed.';
      return;
    }
    await chrome.runtime.sendMessage({ type: 'folder-ready', requestId, ok: true }).catch(() => {});
    window.close();
  } catch (err) {
    $('status').textContent = err.name === 'AbortError' ? 'No folder chosen.' : err.message;
  }
});
