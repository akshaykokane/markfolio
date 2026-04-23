# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-file, zero-dependency (no build step) markdown editor that runs directly in the browser. The entire app lives in `index.html`. Hosted as a GitHub Pages site.

## Running

Open `index.html` directly in a browser — no server or build process required:

```bash
open index.html
```

## File structure

- `index.html` — markup and CSS only; loads CDN libraries and `app.js`
- `app.js` — all application logic (vanilla JS, no framework)
- CDN libraries: `marked.js` (v9) for markdown rendering, `jszip` (v3) for zip export

## Architecture

`index.html` has two sections:

- **CSS** — full-height flexbox column: toolbar → split main area (editor + preview) → status bar
- **HTML** — two-pane layout: raw markdown textarea on the left, rendered preview `div` on the right

All logic lives in `app.js`:

### Key data flow

1. **Persistence** — title and content auto-save to `localStorage` on every keystroke (`markfolio_title`, `markfolio_content`) and are restored on load. Images are not persisted (memory only).

2. **Image insertion** (`insertImage`) — shared helper used by both paste and drag & drop. Stores the `Blob` in the in-memory `images` object (`filename → Blob`) and inserts `![name](assets/images/name.png)` at the cursor.

3. **Preview rendering** (`renderPreview`) — before passing text to `marked.parse()`, replaces `assets/images/…` paths with temporary `URL.createObjectURL(blob)` URLs so pasted images display without writing to disk. Also updates word/char count and triggers save.

4. **Export** (`exportZip`) — iterates `images`, adds each blob to `assets/images/` in a JSZip instance alongside the markdown as `{title}.md`, then triggers a browser download of the `.zip`.

### Constraints to keep in mind

- Images exist only in the in-memory `images` object — refreshing loses all images even though text is restored from localStorage.
- Image filenames are sequential (`image-1.png`, `image-2.png`, …); no deduplication.
- The exported zip is intentionally flat: `{title}.md` at root, images under `assets/images/`, ready to push to GitHub as-is.
