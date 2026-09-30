import { getHandle, setHandle } from '../lib/handle-store.js';
import { pathEndsWithFolder } from '../lib/paths.js';

const $ = (id) => document.getElementById(id);

async function render() {
  const handle = await getHandle('default');
  const { folderPath, destination } = await chrome.storage.local.get({ folderPath: '', destination: 'folder' });
  $('folder-name').textContent = handle ? handle.name : 'No folder chosen yet';
  $('path').value = folderPath;
  $(destination === 'downloads' ? 'dest-downloads' : 'dest-folder').checked = true;
  checkPath(handle);
}

function checkPath(handle) {
  const p = $('path').value.trim();
  $('path-warning').hidden = !p || !handle || pathEndsWithFolder(p, handle.name);
}

$('change').addEventListener('click', async () => {
  try {
    await setHandle('default', await showDirectoryPicker({ id: 'savemd', mode: 'readwrite' }));
    await render();
  } catch (err) {
    if (err.name !== 'AbortError') alert(err.message);
  }
});
$('path').addEventListener('change', async () => {
  await chrome.storage.local.set({ folderPath: $('path').value.trim() });
  checkPath(await getHandle('default'));
});
for (const radio of document.querySelectorAll('input[name="dest"]')) {
  radio.addEventListener('change', () => chrome.storage.local.set({ destination: radio.value }));
}
$('shortcuts').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
render();
