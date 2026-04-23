# Markfolio

A minimal, browser-based markdown editor with image paste support and GitHub-ready export.

**[Try it live →](https://akshaykokane.github.io/markfolio)**

## Features

- Write markdown with live preview
- Paste or drag & drop images directly into the editor
- Auto-saves notes (text + images) — survives page refresh and note switching
- Tab key indents instead of jumping out of the editor
- Live word and character count
- Export as a `.zip` with your `.md` file and images — ready to push to GitHub

## Usage

Visit [akshaykokane.github.io/markfolio](https://akshaykokane.github.io/markfolio/index.html) or open `index.html` in your browser. No install, no server, no build step.

## Export structure

```
MyNote.zip
├── MyNote.md
└── assets/
    └── images/
        ├── image-1.png
        └── image-2.png
```

Image references in the markdown resolve correctly after unzipping.

## Notes

- Note text is saved to `localStorage`; images are saved to `IndexedDB` — both persist across refreshes.
- Images are stored per note and cleaned up automatically when a note is deleted.

## License

MIT
