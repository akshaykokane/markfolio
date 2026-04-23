# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-file, zero-dependency (no build step) markdown editor that runs directly in the browser. The entire app lives in `index.html`. Hosted as a GitHub Pages site.

## Running

Open `index.html` directly in a browser — no server or build process required:

```bash
open index.html
```

## Architecture

Everything is in one file (`index.html`) with three sections:

- **CSS** — layout uses a full-height flexbox column: toolbar → split main area (editor + preview) → status bar
- **HTML** — two-pane layout: raw markdown textarea on the left, rendered preview `div` on the right
- **JavaScript** — no framework; vanilla JS with two CDN libraries:
  - `marked.js` (v9) — converts markdown text to HTML for the preview pane
  - `jszip` (v3) — packages the `.md` file and images into a downloadable `.zip` on export

### Key data flow

1. **Image paste** — the `paste` event on the textarea intercepts clipboard image items, stores the `Blob` in the in-memory `images` object (`filename → Blob`), and inserts a standard markdown image reference (`![name](assets/images/name.png)`) at the cursor.

2. **Preview rendering** (`renderPreview`) — before passing text to `marked.parse()`, replaces `assets/images/…` paths with temporary `URL.createObjectURL(blob)` URLs so the preview displays the actual pasted images without writing to disk.

3. **Export** (`exportZip`) — iterates `images`, adds each blob to a `assets/images/` folder in a JSZip instance alongside the markdown text as `{title}.md`, then triggers a browser download of the resulting `.zip`.

### Constraints to keep in mind

- Images exist only in memory (`images` object) for the lifetime of the page — refreshing loses all content and images.
- Image filenames are sequential (`image-1.png`, `image-2.png`, …) based on `imageCounter`; there is no deduplication.
- The exported zip structure is intentionally flat: `{title}.md` at root, images under `assets/images/`, ready to push to GitHub as-is.
