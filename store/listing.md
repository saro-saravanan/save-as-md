# Chrome Web Store listing

Everything the developer dashboard asks for, ready to paste. Upload `savemd.zip` from the
[latest release](https://github.com/saro-saravanan/save-as-md/releases/latest). The images in this
folder come from `node build.mjs --e2e && node scripts/store-assets.mjs`.

## Package tab
Upload `savemd.zip`. Name, summary and icon come from `manifest.json`:
- **Name:** SaveMD
- **Summary (132 characters max):** Save any web page as clean Markdown with every image, in one click. Free, open source, and nothing leaves your computer.

## Store listing tab
**Description:**

```
Save any web page as clean Markdown, with every image, in one click. Built to replace print-to-PDF.

Articles, recipes, docs, Reddit threads: SaveMD keeps the content and drops the menus, ads and cookie banners. Each page becomes a folder with a .md file and its images, saved through Chrome's downloads into Downloads/WebClips. The files open in any Markdown app (Obsidian, Typora, MarkText, VS Code) or go straight into an AI chat.

WHAT IT DOES
• Clean text: the article, not the clutter. Falls back to the full page when there is no article, or pick the exact area to save.
• Every image, saved locally: including lazy-loaded images, and images embedded in Reddit posts and comments. Image links point at the local copies, so pages read offline.
• Reddit threads: the post plus its comment threads, nested, with authors and scores.
• You know it worked: a notice after each save counts the words and images and flags anything that couldn't be saved, with Open, Show folder and Undo.
• Copy as Markdown, Save selection, per-site settings and a keyboard shortcut (Alt+Shift+S).

PRIVATE BY DESIGN
SaveMD runs entirely in your browser. No account, no analytics, no server: nothing you save, and nothing about you, is sent anywhere. It's open source under the MIT license, so you can read exactly what it does.

Website: https://saro-saravanan.github.io/save-as-md/
Source code: https://github.com/saro-saravanan/save-as-md
```

- **Category:** Tools
- **Language:** English
- **Store icon:** `icons/icon-128.png`
- **Screenshots (1280x800):** `screenshot-1-article.png`, `screenshot-2-docs.png`, `screenshot-3-options.png`
- **Small promo tile (440x280):** `promo-small.png`
- **Official URL:** leave as none (it needs a verified domain)
- **Homepage URL:** https://saro-saravanan.github.io/save-as-md/
- **Support URL:** https://github.com/saro-saravanan/save-as-md/issues

## Privacy practices tab
**Single purpose:**

```
SaveMD saves the web page the user chooses as a Markdown file, together with that page's images, into the user's Downloads folder.
```

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| scripting | Runs SaveMD's content script in the tab the user asks to save, to read that page and turn it into Markdown. |
| contextMenus | Adds the right-click items: Save page, Save selection, Pick an area, Copy as Markdown, per-site mode and Reddit comment depth. |
| storage | Keeps the user's settings and a local list of saved pages, so it can ask before saving the same page twice. Stored only on the user's computer. |
| offscreen | Creates blob URLs for the saved Markdown and images so Chrome's downloads can write them, and writes to the clipboard for Copy as Markdown. |
| downloads | Writes the saved page and its images into Downloads/WebClips, and removes them again when the user clicks Undo. |
| downloads.open | Opens the saved Markdown file when the user clicks Open in the notice. |
| downloads.ui | Hides Chrome's download bubble while a page's files are written, so a single save doesn't pop up a dozen downloads. |
| clipboardWrite | Copies the page as Markdown when the user chooses Copy as Markdown. |
| Host permission (all sites) | The user can save any page they visit, so SaveMD must read the page in that tab and download its images from whichever sites host them. It reads a page only when the user asks to save it. |

**Remote code:** No, I am not using remote code. All code is bundled in the package.

**Data usage:** tick none of the data types. Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://saro-saravanan.github.io/save-as-md/privacy.html

## Distribution tab
- **Payments:** Free of charge
- **Visibility:** Public
- **Regions:** All regions

## Test instructions tab
No account or login is needed. Suggested check for reviewers:

```
Open any article (for example https://en.wikipedia.org/wiki/Heirloom_tomato) and click the SaveMD toolbar button. A notice confirms the save, and Downloads/WebClips gets a folder holding the page as a .md file plus an assets folder with its images.
```
