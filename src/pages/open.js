// Opens a saved page's .md file with the default app for .md files (MarkText, Typora, VS Code…).
// The download id comes in the URL hash; the notice that embeds this page closes when told it's done.
const downloadId = Number(location.hash.slice(1));
const button = document.getElementById('open');

button.addEventListener('click', async () => {
  try {
    await chrome.downloads.open(downloadId);
    parent.postMessage({ savemd: 'action-done' }, '*');
  } catch (err) {
    button.textContent = 'Error';
    button.title = `Couldn't open the file: ${err.message}`;
  }
});
