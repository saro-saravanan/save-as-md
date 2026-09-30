# SaveMD

Save any page as clean Markdown with local images, one click. Built to replace print-to-PDF.

## Install (unpacked)
1. `npm install`
2. `npm run build`
3. Open `chrome://extensions`, turn on Developer mode, choose **Load unpacked**, and select `dist/`. Pin SaveMD.
4. Click the button once to choose your save folder. In **Options**, paste that folder's full path to enable **Open in VS Code**.

## Use
- **Click, or Alt+Shift+S:** save the page to your folder.
- **Right-click the button** for:
  - Pick an area
  - Copy as Markdown
  - Save to…
  - Save to Downloads
  - how to save this site (per-site mode)
  - Reddit comment depth
- **Right-click the page:** Save page, or Save selection.

## If Chrome keeps asking to re-allow the folder
Set **Default destination → Downloads\WebClips** in Options, then point that folder at your real one with a directory junction. Run this in Command Prompt:

    rmdir "%USERPROFILE%\Downloads\WebClips"
    mklink /J "%USERPROFILE%\Downloads\WebClips" "C:\path\to\your\Clips"

## When a page converts badly
1. Add it to `docs/failures.md`.
2. Add its saved copy to the test set: `npm run add-fixture -- "<folder>\.source.html" short-name`
3. Run `npm test` to create `test/fixtures/expected/short-name.md`. Edit the conversion code until that file looks right, then run `npx vitest run -u` to save the new expected output.

## Develop
- `npm test` runs the unit tests and the regression set of saved pages.
- `npm run watch` rebuilds on change. Reload the extension after each rebuild.
- `docs/manual-test.md` is the end-to-end checklist.
