# Spike results (2026-09-30, Chrome 154.0.8037.58)

The spike wasn't run before the first build; the first real use in Chrome answered checks A and B.

| Check | Observed | Decision |
|---|---|---|
| A. First pick + background write | Folder picked in the popup, but the offscreen document's write was refused. Chrome keeps File System Access permission only while a tab of the origin is open; the popup closed straight after picking, and an offscreen document doesn't count as a tab. | Folder picker removed. |
| B. Re-allow / "Allow on every visit" | The three-way prompt appeared as documented; choosing "Allow on every visit" crashed Chrome (crash report 2026-09-30 20:40). | Not usable. Saves go through `chrome.downloads` into `Downloads\WebClips`; The Options page gives a one-line PowerShell command that junctions that to any folder. The e2e suite saves through a junction to prove it. |
| C. vscode:// via chrome.tabs.update | Superseded. | "Open" now uses `chrome.downloads.open` with the default `.md` app. Chrome requires a click in extension UI ("User gesture required" from the service worker), so the button is `open.html` embedded in the notice; the e2e suite proves the click is accepted. |
| D. downloads.setUiOptions | Calls succeed in Chrome for Testing (e2e). Whether the bubble is hidden in branded Chrome is not yet checked. | Keep the calls (harmless). |
