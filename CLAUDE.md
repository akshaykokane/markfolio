# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A zero-dependency (no build step) markdown editor that runs directly in the browser. Hosted as a GitHub Pages site.

## Running

Open `index.html` directly in a browser — no server or build process required:

```bash
open index.html
```

## File structure

- `index.html` — markup and CSS only; loads CDN libraries, `imageStore.js`, and `app.js`
- `app.js` — all application logic (vanilla JS, no framework)
- `imageStore.js` — IndexedDB helpers for image persistence (`saveImage`, `loadImages`, `deleteNoteImages`)
- `docs.html` — user-facing documentation page
- CDN libraries: `marked.js` (v9) for markdown rendering, `jszip` (v3) for zip export

## Architecture

`index.html` has two sections:

- **CSS** — full-height flexbox column: toolbar → split main area (sidebar + editor + preview) → status bar
- **HTML** — three-pane layout: sidebar note list on the left, raw markdown textarea in the middle, rendered preview `div` on the right

All logic lives in `app.js`:

### Key data flow

1. **Multi-note persistence** — all notes are stored as a JSON array in `localStorage` under `markfolio_notes`. The active note ID is stored under `markfolio_current`. On load, if the old single-note keys (`markfolio_title`, `markfolio_content`) exist and there are no notes yet, they are migrated into a new note automatically.

2. **Note switching** (`selectNote`, `newNote`, `deleteNote`) — switching notes calls `saveNotes()` first, then updates `currentNoteId`, resets the in-memory `images` object and `imageCounter`, loads the new note's text, restores its images from IndexedDB via `loadImages()`, and re-renders preview and sidebar. `selectNote` is async for this reason.

3. **Image insertion** (`insertImage`) — shared helper used by both paste and drag & drop. Stores the `Blob` in the in-memory `images` object (`filename → Blob`), persists it to IndexedDB via `saveImage(currentNoteId, filename, blob)`, and inserts `![name](assets/images/name.png)` at the cursor.

4. **Image persistence** (`imageStore.js`) — all IndexedDB logic is isolated here. Keys are `{noteId}/{filename}`; values are raw `Blob`s. `loadImages(noteId)` returns `{ filename: Blob }`. `deleteNoteImages(noteId)` is called when a note is deleted to avoid orphaned blobs.

5. **Preview rendering** (`renderPreview`) — before passing text to `marked.parse()`, replaces `assets/images/…` paths with temporary `URL.createObjectURL(blob)` URLs sourced from the in-memory `images` object (which is populated from IndexedDB on load). Also updates word/char count and calls `saveNotes()`.

6. **Export** (`exportZip`) — iterates `images`, adds each blob to `assets/images/` in a JSZip instance alongside the markdown as `{title}.md`, then triggers a browser download of the `.zip`.

### Constraints to keep in mind

- Note text is persisted in `localStorage`; images are persisted in `IndexedDB` — both survive page refresh.
- The in-memory `images` object is always repopulated from IndexedDB when switching notes or on initial load.
- Image filenames are sequential per note (`image-1.png`, `image-2.png`, …); counter is restored from the number of saved images on load.
- The exported zip is intentionally flat: `{title}.md` at root, images under `assets/images/`, ready to push to GitHub as-is.
- Deleting the last remaining note clears it instead of removing it (always at least one note exists).
