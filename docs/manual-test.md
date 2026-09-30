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
| 11 | Right-click → Save to Downloads | Downloads\WebClips\<folder>, notice has Show folder |
| 12 | Save, then Undo | Folder removed, "Removed." |
| 13 | Restart Chrome, save | At most one "Allow access" click, then saves |
| 14 | chrome://extensions, click the button | Red "!" badge with explanation |
| 15 | Site with strict CSP (e.g. github.com) | Notice still styled and clickable |
| 16 | Alt+Shift+S | Same as clicking the button |
