# SaveMD

Save any web page as clean Markdown, with every image, in one click. Built to replace print-to-PDF. See it in action at **[saro-saravanan.github.io/save-as-md](https://saro-saravanan.github.io/save-as-md/)**.

- **Clean text:** the article, not the menus, ads and cookie banners. Falls back to the full page when there is no article, or pick the exact area to save.
- **Every image, saved locally:** including lazy-loaded images, and images embedded in Reddit posts and comments. Image links point at the local copies, so the page reads offline.
- **Reddit threads:** the post plus its comment threads, nested, with authors and scores.
- **You know it worked:** a notice after each save counts the words and images and flags anything that couldn't be saved, with **Open**, **Show folder** and **Undo**.
- **Plain files:** one folder per page with a `.md` file and an `assets` folder. They open in any Markdown app (Obsidian, Typora, MarkText, VS Code) or go straight into an AI chat.

**Private by design:** SaveMD runs entirely in your browser. It sends nothing anywhere, has no account, no analytics and no server. Pages are written to your own disk through Chrome's downloads. See the [privacy policy](https://saro-saravanan.github.io/save-as-md/privacy.html).

## Install
The Chrome Web Store listing is coming. Until then, install from source:

1. `npm install`
2. `npm run build`
3. Open `chrome://extensions`, turn on Developer mode, choose **Load unpacked**, and select `dist/`. Pin SaveMD.

## Use
- **Click the toolbar button, or press Alt+Shift+S:** save the page into `Downloads\WebClips`.
- **Right-click the toolbar button** for:
  - Pick an area
  - Copy as Markdown
  - how to save this site (per-site mode)
  - Reddit comment depth
- **Right-click the page:** Save page, or Save selection.

### Choosing the app that opens saved pages
**Open** in the notice uses whatever your computer opens `.md` files with. To change it on Windows, right-click any `.md` file → **Open with** → **Choose another app**, pick the editor, and tick **Always use this app to open .md files**.

### Saving into your own folder (Windows)
Chrome doesn't let extensions keep access to a folder you pick, so SaveMD always saves through Chrome's downloads. To have pages land somewhere else, link `Downloads\WebClips` to that folder:

1. Open SaveMD's **Options** (right-click the toolbar button → Options).
2. Type the folder, click **Copy command**.
3. Press Windows+X → **Terminal**, paste, press Enter.

The command moves anything already in `WebClips` into your folder (it stops before moving anything if a name clashes), replaces an old link, and creates the new one. On Mac, pages stay in `Downloads/WebClips` for now.

## Report a page that saves badly
[Open an issue](https://github.com/saro-saravanan/save-as-md/issues) with the page's address and what went wrong. Each saved folder also contains `_source.html`, the page exactly as SaveMD saw it. Attach it if the page isn't public.

## Contribute
Contributions are welcome, especially support for more sites (the Reddit support in `src/lib/reddit.js` is the model).

- `npm test` runs the unit tests and a regression set of saved pages.
- `npm run e2e` launches a throwaway Chrome for Testing with the extension loaded and saves real pages end to end.
- `npm run watch` rebuilds on change. Reload the extension after each rebuild.
- `docs/manual-test.md` is the hands-on checklist for what automation can't cover.

To add a page that converts badly to the regression set, run `npm run add-fixture -- "<folder>\_source.html" short-name`, then `npm test`. Fix the conversion until `test/fixtures/expected/short-name.md` looks right, and save it with `npx vitest run -u`.

## License
[MIT](LICENSE)
