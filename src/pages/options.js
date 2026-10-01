import { checkTarget, linkCommand } from '../lib/link-command.js';

const $ = (id) => document.getElementById(id);
let downloadsDir = null; // Chrome's real download folder, once a save has shown it

// Show where the most recent save actually landed (Chrome reports the real path, link or not).
async function showLastSave() {
  const [item] = await chrome.downloads.search({ filenameRegex: 'WebClips[\\\\/]', orderBy: ['-startTime'], limit: 1, exists: true });
  if (!item) return;
  downloadsDir = /^(.*)[\\/]WebClips[\\/]/i.exec(item.filename)?.[1] ?? null;
  $('last-save').textContent = `Your last save: ${item.filename.replace(/[\\/][^\\/]+$/, '')}`;
  $('last-save').hidden = false;
}

async function setUpLinking() {
  const { os } = await chrome.runtime.getPlatformInfo();
  if (os !== 'win') {
    $('link-windows').hidden = true;
    $('link-other').hidden = false;
    return;
  }
  const { linkTarget = '' } = await chrome.storage.local.get('linkTarget');
  $('target').value = linkTarget;
  $('copy').addEventListener('click', async () => {
    const target = $('target').value.trim();
    const problem = checkTarget(target);
    $('target-error').textContent = problem ?? '';
    $('target-error').hidden = !problem;
    if (problem) return;
    await navigator.clipboard.writeText(linkCommand({ target, downloadsDir }));
    await chrome.storage.local.set({ linkTarget: target });
    $('copy').textContent = 'Copied';
    $('steps').hidden = false;
    setTimeout(() => { $('copy').textContent = 'Copy command'; }, 2000);
  });
}

$('shortcuts').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
showLastSave().catch(() => {}).finally(() => setUpLinking());
