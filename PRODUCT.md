# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS in `site/`, deployed with GitHub Pages from this repository (user-approved). The product itself is a Chrome (Manifest V3) extension built with esbuild.

## Users

People who save web pages to keep or reuse them:
- people who print pages to PDF today and want a clean, complete copy
- people who feed pages to AI chats and want clean text without menus and ads
- people who archive Reddit threads, including the comments
- people who keep Markdown notes (Obsidian, Typora, MarkText, VS Code)

## Product Purpose

SaveMD is a free, open-source Chrome extension that saves any web page as clean Markdown, with every image saved locally, in one click. Success is adoption: people who keep using it instead of print-to-PDF. Revenue is not a goal.

## Positioning

What you save is complete, and you know it. Reddit threads come with their comments and the images embedded in them; lazy-loaded images are saved; a notice after every save counts the words and images and flags anything that couldn't be saved. Free competitors (MarkDownload, Obsidian Web Clipper) exist; the difference is completeness and confirmation, not the basic feature.

## Operating Context

- One click on the toolbar button or Alt+Shift+S saves the page into `Downloads\WebClips`, one folder per page: a `.md` file, an `assets` folder of images, and the page source.
- After saving, a notice offers Open (default Markdown app), Show folder and Undo.
- Right-click menus: Pick an area, Copy as Markdown, per-site mode, Reddit comment depth, save selection.
- On Windows, Options gives a one-line command to link `WebClips` to any folder.
- Distribution: Chrome Web Store (listing pending); install from source until then.

## Capabilities and Constraints

- Chrome only. Windows is the primary platform; on Mac, folder linking isn't available yet.
- Runs entirely in the browser: no account, no server, no analytics; nothing leaves the device.
- Chrome won't let an extension keep access to a folder you pick, so saves always go through Chrome's downloads.
- Open source under the MIT license.

## Brand Commitments

- Name: SaveMD.
- Icon: green rounded square with a white arrow into a tray (`icons/`).
- Voice: plain, specific, honest. No hype, no jokes that undercut trust, not developer-only, not a generic SaaS page.

## Evidence on Hand

- Real screenshots can be captured from the extension itself (a page before and after, the save notice, a saved folder).
- No users, reviews, testimonials, press or usage numbers yet. Do not invent any.

## Product Principles

1. Complete or clearly flagged: never silently drop content.
2. One click, no setup: nothing to configure before the first save.
3. Plain files the person owns, readable by any app.
4. Private by default: nothing leaves the device.
