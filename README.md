# SaveMD

Save any page as clean Markdown with local images, one click. Built to replace print-to-PDF.

## Install (unpacked)
1. `npm install`
2. `npm run build`
3. Open `chrome://extensions`, turn on Developer mode, choose **Load unpacked**, and select `dist/`. Pin SaveMD.
4. Optional: have pages land in your own folder instead of `Downloads\WebClips` (see below).

## Use
- **Click, or Alt+Shift+S:** save the page into `Downloads\WebClips`, one folder per page.
- **Right-click the button** for:
  - Pick an area
  - Copy as Markdown
  - how to save this site (per-site mode)
  - Reddit comment depth
- **Right-click the page:** Save page, or Save selection.

## Saving into your own folder
Chrome doesn't let extensions keep access to a folder you pick (access ends as soon as the extension's own tab closes), so SaveMD always saves through Chrome's downloads. To have pages land somewhere else, link `Downloads\WebClips` to that folder with a Windows directory junction:

    npm run link -- "C:\Users\you\OneDrive\Clips"

It finds your real Downloads folder (even if Windows moved it), moves anything already in `WebClips` into your folder, and creates the link. Run it again with another folder to change it. If you changed Chrome's download location, pass it too: `--downloads "D:\Downloads"`.

## When a page converts badly
1. Add it to `docs/failures.md`.
2. Add its saved copy to the test set: `npm run add-fixture -- "<folder>\_source.html" short-name`
3. Run `npm test` to create `test/fixtures/expected/short-name.md`. Edit the conversion code until that file looks right, then run `npx vitest run -u` to save the new expected output.

## Develop
- `npm test` runs the unit tests and the regression set of saved pages.
- `npm run e2e` launches a throwaway Chrome for Testing with the extension loaded and saves real pages end to end (articles, tricky images, duplicates, Undo, empty pages, Pick an area, Copy as Markdown, protected pages). Its `WebClips` folder is a link to another folder, so it also proves saving through the link works.
- `npm run watch` rebuilds on change. Reload the extension after each rebuild.
- `npm run icons` redraws the toolbar icons.
- `docs/manual-test.md` is the end-to-end checklist.
