const editor     = document.getElementById('editor');
const preview    = document.getElementById('preview');
const statusMsg  = document.getElementById('statusMsg');
const wordCount  = document.getElementById('wordCount');
const editorPane = document.getElementById('editorPane');
const titleInput = document.getElementById('title');

// In-memory image store: filename -> Blob
const images = {};
let imageCounter = 0;

// ─── Persistence ────────────────────────────────────────────────────────────

function save() {
  localStorage.setItem('markfolio_title',   titleInput.value);
  localStorage.setItem('markfolio_content', editor.value);
}

function load() {
  const savedTitle   = localStorage.getItem('markfolio_title');
  const savedContent = localStorage.getItem('markfolio_content');
  if (savedTitle)   titleInput.value = savedTitle;
  if (savedContent) editor.value     = savedContent;
}

titleInput.addEventListener('input', save);

// ─── Render ──────────────────────────────────────────────────────────────────

function renderPreview() {
  let text = editor.value;

  // Swap asset paths with blob URLs so preview shows actual images
  text = text.replace(/!\[([^\]]*)\]\(assets\/images\/([^)]+)\)/g, (_, alt, filename) => {
    if (images[filename]) {
      return `![${alt}](${URL.createObjectURL(images[filename])})`;
    }
    return `![${alt}](assets/images/${filename})`;
  });

  preview.innerHTML = marked.parse(text);
  updateWordCount();
  save();
}

function updateWordCount() {
  const text  = editor.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = editor.value.length;
  wordCount.textContent = `${words} word${words !== 1 ? 's' : ''} · ${chars} char${chars !== 1 ? 's' : ''}`;
}

editor.addEventListener('input', renderPreview);

// ─── Tab key → indent ────────────────────────────────────────────────────────

editor.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const pos    = editor.selectionStart;
  const before = editor.value.slice(0, pos);
  const after  = editor.value.slice(editor.selectionEnd);
  editor.value = before + '  ' + after;
  editor.selectionStart = editor.selectionEnd = pos + 2;
  renderPreview();
});

// ─── Image insertion helper ───────────────────────────────────────────────────

function insertImage(blob, mimeType) {
  const ext      = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  imageCounter++;
  const filename = `image-${imageCounter}.${ext}`;
  images[filename] = blob;

  const pos    = editor.selectionStart;
  const before = editor.value.slice(0, pos);
  const after  = editor.value.slice(editor.selectionEnd);
  const md     = `![${filename}](assets/images/${filename})`;

  editor.value = before + md + after;
  editor.selectionStart = editor.selectionEnd = pos + md.length;

  renderPreview();
  setStatus(`Image added: ${filename}`);
}

// ─── Paste ───────────────────────────────────────────────────────────────────

editor.addEventListener('paste', (e) => {
  const items     = Array.from(e.clipboardData?.items || []);
  const imageItem = items.find(i => i.type.startsWith('image/'));
  if (!imageItem) return;

  e.preventDefault();
  insertImage(imageItem.getAsFile(), imageItem.type);
});

// ─── Drag & drop ─────────────────────────────────────────────────────────────

editorPane.addEventListener('dragover', (e) => {
  e.preventDefault();
  editorPane.classList.add('drag-over');
});

editorPane.addEventListener('dragleave', () => {
  editorPane.classList.remove('drag-over');
});

editorPane.addEventListener('drop', (e) => {
  e.preventDefault();
  editorPane.classList.remove('drag-over');

  const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
  if (!file) return;

  editor.focus();
  insertImage(file, file.type);
});

// ─── Export ──────────────────────────────────────────────────────────────────

async function exportZip() {
  const title = titleInput.value.trim() || 'Untitled';
  const zip   = new JSZip();

  zip.file(`${title}.md`, editor.value);

  const imgFolder = zip.folder('assets/images');
  for (const [filename, blob] of Object.entries(images)) {
    imgFolder.file(filename, await blob.arrayBuffer());
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `${title}.zip`;
  a.click();

  setStatus(`Exported: ${title}.zip`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setStatus(msg) {
  statusMsg.textContent = msg;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

load();
renderPreview();
