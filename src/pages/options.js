const $ = (id) => document.getElementById(id);

// Show where the most recent save actually landed (Chrome reports the real path, link or not).
async function showLastSave() {
  const [item] = await chrome.downloads.search({ filenameRegex: 'WebClips[\\\\/]', orderBy: ['-startTime'], limit: 1, exists: true });
  if (!item) return;
  const folder = item.filename.replace(/[\\/][^\\/]+$/, '');
  $('last-save').textContent = `Your last save: ${folder}`;
  $('last-save').hidden = false;
}

$('shortcuts').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
showLastSave().catch(() => {});
