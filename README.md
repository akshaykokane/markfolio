# Markfolio

A minimal, browser-based markdown editor with image paste support and GitHub-ready export.

**[Try it live →](https://akshaykokane.github.io/notion-local)**

## Features

- Write markdown with live preview
- Paste images (`Cmd+V` / `Ctrl+V`) directly into the editor
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

- Content is not persisted — refreshing clears everything. Export before closing.

## License

MIT
