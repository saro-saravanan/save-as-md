# SaveMD — design spec (minimum lovable product)

**Date:** 2026-09-30
**Owner:** Saro (building it for their own use first)

## Job to be done
One click on an article, Reddit thread or miscellaneous page produces a clean Markdown file with local images. The file should read well when reopened in VS Code and be clean enough to drop straight into Claude or a notes tool. It replaces the habit of saving pages with print-to-PDF.

## Target reader and format
- **Reading app:** VS Code's Markdown preview. The files must also open cleanly in an Obsidian vault.
- **Markdown flavor:** plain GitHub-flavored Markdown (GFM). No `[[wikilinks]]` and no `> [!note]` callouts.
- **Image links:** relative, like `![alt](assets/img-01.jpg)`. Asset filenames never contain spaces.
- **Front-matter:** YAML, containing `title`, `source`, `site`, `author`, `published` and `saved`.

## What a save produces
```
<destination>/
  YYYY-MM-DD <Title>/
    <Title>.md
    assets/img-01.jpg …
    .source.html        (or .source.json for Reddit; used for debugging and re-converting)
```
- **Titles:** made safe for Windows filenames, emoji removed, capped at 80 characters.
- **Saving the same URL again:** the page shows a prompt with **Update existing** and **Save new copy**.

## How you trigger it
- **Clicking the toolbar button:** saves to the default destination. On the very first click, it asks you to choose the "Always save to" folder.
- **Alt+Shift+S:** the same as clicking the toolbar button.
- **Right-clicking the toolbar button** opens a menu:
  - Pick an area to save…
  - Copy page as Markdown
  - Save to… (one-off folder)
  - Save to Downloads
  - **On this site, save** (remembered per site):
    - Automatically
    - Article only
    - Full page
  - **Reddit comments** (shown only on Reddit threads):
    - Post only
    - Post + top 20 threads (the default, up to 4 levels deep)
    - Everything loaded
- **Right-clicking the page** offers **Save page as Markdown**, plus **Save selection as Markdown** when text is selected.

## Content rules
- **Extraction:**
  - Automatic mode uses Readability first.
  - If the article text is less than 30% of the cleaned page's text, it falls back to **Full page**.
  - Full page removes nav, header, footer, sidebars, forms, dialogs, and cookie, consent and ad blocks.
- **Lazy-loaded images:** the real address is taken from `srcset` (largest version), `<picture>` sources, or `data-src`-style attributes.
- **Images:**
  - Downloaded by the extension, and retried from inside the page if that fails.
  - Anything under 32 px is dropped. Small emoji images become their alt text.
  - Inline SVGs of at least 32 px are saved as `.svg` files.
  - Reddit URLs have HTML entities decoded.
  - An image that couldn't be downloaded stays as a remote link followed by `*(image not saved)*`. Images are never dropped silently.
- **Links:** made absolute, with `utm_*`, `fbclid`, `gclid` and similar tracking parameters removed.
- **Code blocks:** fenced, keeping the language.
- **Tables:** tables with a header row become pipe tables. Tables without one are kept as HTML.
- **Reddit:** read from the thread's `.json` endpoint, falling back to the rendered page if that fails. Comments are nested blockquotes, each with author, score and date.

## Feedback
A notice in the page after every save:
- **Success:** `Saved · 2,340 words · 8/8 images`, with the buttons **[Open in VS Code] [Show folder]** (Downloads only) **[Undo]**.
- **Partial success:** in amber, `Saved with warnings · 3 images not saved (linked to originals)`.
- **Fallback:** ` · full page` is appended when Automatic mode fell back to full page.
- **Errors:** shown in red. On pages the browser protects, a red `!` badge appears on the toolbar button.

## Out of scope
- adapters for other sites beyond Reddit
- search, sync, accounts and payments
- PDF output
- a preview or editing step
- a Chrome Web Store listing
- a settings page beyond the folder, its path and the default destination

## Success
For two weeks you don't reach for print-to-PDF. Every page that still made you do so goes into `docs/failures.md`.

## Known unknowns (tested on day 1)
1. **Folder access after a restart:** whether a remembered folder still works in the background after Chrome restarts, or needs a click to re-allow it.
2. **Opening VS Code:** whether `vscode://` links can be launched from the extension with a single "always allow" prompt.
3. **Download notifications:** whether `chrome.downloads.setUiOptions` hides the download bubble while a save to Downloads is running.
