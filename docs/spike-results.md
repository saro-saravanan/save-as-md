# Spike results (2026-09-30, Chrome 154.0.8037.58)

The spike wasn't run before the first build; the first real use in Chrome answered checks A and B.

| Check | Observed | Decision |
|---|---|---|
| A. First pick + background write | Folder picked in the popup, but the offscreen document's write was refused. Chrome keeps File System Access permission only while a tab of the origin is open; the popup closed straight after picking, and an offscreen document doesn't count as a tab. | Folder picker removed. |
| B. Re-allow / "Allow on every visit" | The three-way prompt appeared as documented; choosing "Allow on every visit" crashed Chrome (crash report 2026-09-30 20:40). | Not usable. Saves go through `chrome.downloads` into `Downloads\WebClips`; `npm run link` junctions that to any folder. The e2e suite saves through a junction to prove it. |
| C. vscode:// via chrome.tabs.update | Not yet checked. | Keep `openExternal = chrome.tabs.update` until checked. |
| D. downloads.setUiOptions | Calls succeed in Chrome for Testing (e2e). Whether the bubble is hidden in branded Chrome is not yet checked. | Keep the calls (harmless). |
