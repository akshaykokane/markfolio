# Markfolio

A minimal, browser-based markdown editor with image paste support and GitHub-ready export.

**[Try it live →](https://akshaykokane.github.io/markfolio)**

## Features

- Write markdown with live preview
- Paste or drag & drop images directly into the editor
- Auto-saves title and content to localStorage — survives page refresh
- Tab key indents instead of jumping out of the editor
- Live word and character count
- Export as a `.zip` with your `.md` file and images — ready to push to GitHub

## Usage

Open `index.html` in your browser, or visit the GitHub Pages link above. No install, no server, no build step.

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

- Text is auto-saved to localStorage, but pasted images are memory-only — export before closing to keep images.

## License

MIT
