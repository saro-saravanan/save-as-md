# Manual end-to-end check (run after any change to src/background, src/offscreen or src/content)

Rebuild with `npm run build`, then click reload on the SaveMD card in chrome://extensions.

| # | Do | Expect |
|---|---|---|
| 1 | Long article with lazy images, before scrolling | All images in assets/, none are grey placeholders |
| 2 | Reddit thread, default mode | Post + ≤20 top-level threads, nested quotes, images local |
| 3 | Same thread, right-click → Reddit comments → Post only | No comments section |
| 4 | Docs page with code blocks | Fenced blocks with the right language |
| 5 | Page with a data table | Pipe table (or HTML table if headerless) |
| 6 | A "misc" page (forum, product page) | If the article extraction fell back, notice ends with "· full page"; content readable |
| 7 | Same misc page, right-click → On this site, save → Full page; save again | Update/new-copy prompt; mode remembered on next visit |
| 8 | Right-click → Pick an area to save…, click a region | Only that region saved |
| 9 | Select text → right-click page → Save selection as Markdown | Only the selection saved |
| 10 | Right-click → Copy page as Markdown, paste into Claude | Clean Markdown, remote image links |
| 11 | After `npm run link -- "<your folder>"`, save a page | Page folder appears in your folder; Show folder opens it |
| 12 | Save, then Undo | Folder removed, "Removed." |
| 13 | Restart Chrome, save | Saves with no prompts at all |
| 14 | chrome://extensions, click the button | Red "!" badge with explanation |
| 15 | Site with strict CSP (e.g. github.com) | Notice still styled and clickable |
| 16 | Alt+Shift+S | Same as clicking the button |
| 17 | Open a PDF in Chrome, click the button | Red "!" badge, not "Pick an area" |
| 18 | First ever save | No folder picker or permission prompt; saves straight away |
| 19 | Pick an area, wait 40 s before clicking; save, hover the notice 40 s, then Undo | Both still work |
| 20 | Save, then immediately follow a link | No "Couldn't save" error on the next page |
| 21 | Save two different selections of the same page | Two folders ("… (2)"), nothing overwritten |
| 22 | Open a local .html file (file://), click the button | Badge explains "Allow access to file URLs" |
| 23 | Save a page twice, choose Update existing | Notice button says Delete, not Undo |
| 24 | Reload SaveMD in chrome://extensions, then save on an already-open tab | Saves normally (no stale content script) |
| 25 | Two windows on different sites with different "On this site" modes; switch windows, right-click the button | Radio shows the focused window's site |
| 26 | Save a Reddit thread (Reddit draws its own UI in the browser's top layer) | Notice visible above Reddit's UI |
| 27 | Click Open in the notice | The .md opens in your default Markdown app; the notice closes |
