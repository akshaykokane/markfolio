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

- **CSS** — full-height flexbox column: toolbar → split main area (sidebar + editor + preview) → status bar
- **HTML** — three-pane layout: sidebar note list on the left, raw markdown textarea in the middle, rendered preview `div` on the right

All logic lives in `app.js`:

### Key data flow

1. **Multi-note persistence** — all notes are stored as a JSON array in `localStorage` under `markfolio_notes`. The active note ID is stored under `markfolio_current`. On load, if the old single-note keys (`markfolio_title`, `markfolio_content`) exist and there are no notes yet, they are migrated into a new note automatically.

2. **Note switching** (`selectNote`, `newNote`, `deleteNote`) — switching notes calls `saveNotes()` first, then updates `currentNoteId`, resets the in-memory `images` object and `imageCounter` to zero, loads the new note's text, and re-renders preview and sidebar.

3. **Image insertion** (`insertImage`) — shared helper used by both paste and drag & drop. Stores the `Blob` in the in-memory `images` object (`filename → Blob`) and inserts `![name](assets/images/name.png)` at the cursor. Images belong to the current editing session only.

4. **Preview rendering** (`renderPreview`) — before passing text to `marked.parse()`, replaces `assets/images/…` paths with temporary `URL.createObjectURL(blob)` URLs so pasted images display without writing to disk. Also updates word/char count and calls `saveNotes()`.

5. **Export** (`exportZip`) — iterates `images`, adds each blob to `assets/images/` in a JSZip instance alongside the markdown as `{title}.md`, then triggers a browser download of the `.zip`.

### Constraints to keep in mind

- Images exist only in the in-memory `images` object and are reset when switching notes or refreshing — text is restored from localStorage but images are not.
- Image filenames are sequential per session (`image-1.png`, `image-2.png`, …); no deduplication.
- The exported zip is intentionally flat: `{title}.md` at root, images under `assets/images/`, ready to push to GitHub as-is.
- Deleting the last remaining note clears it instead of removing it (always at least one note exists).
