const editor     = document.getElementById('editor');
const preview    = document.getElementById('preview');
const statusMsg  = document.getElementById('statusMsg');
const wordCount  = document.getElementById('wordCount');
const editorPane = document.getElementById('editorPane');
const titleInput = document.getElementById('title');
const noteList   = document.getElementById('noteList');

// In-memory image store for the current note: filename -> Blob
let images = {};
let imageCounter = 0;

// ─── Notes data model ────────────────────────────────────────────────────────

let notes = [];          // [{id, title, content}]
let currentNoteId = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Persistence ────────────────────────────────────────────────────────────

function saveNotes() {
  const note = notes.find(n => n.id === currentNoteId);
  if (note) {
    note.title   = titleInput.value;
    note.content = editor.value;
  }
  localStorage.setItem('markfolio_notes',   JSON.stringify(notes));
  localStorage.setItem('markfolio_current', currentNoteId);
}

function loadNotes() {
  const saved = localStorage.getItem('markfolio_notes');
  if (saved) {
    try { notes = JSON.parse(saved); } catch (e) { notes = []; }
  }

  // Migrate single-note format from the old storage keys
  if (notes.length === 0) {
    const oldTitle   = localStorage.getItem('markfolio_title')   || 'Untitled';
    const oldContent = localStorage.getItem('markfolio_content') || '';
    notes.push({ id: generateId(), title: oldTitle, content: oldContent });
  }

  const savedCurrent = localStorage.getItem('markfolio_current');
  currentNoteId = (savedCurrent && notes.find(n => n.id === savedCurrent))
    ? savedCurrent
    : notes[0].id;
}

function loadCurrentNote() {
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;
  titleInput.value = note.title;
  editor.value     = note.content;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function renderSidebar() {
  noteList.innerHTML = '';
  notes.forEach(note => {
    const item = document.createElement('div');
    item.className = 'note-item' + (note.id === currentNoteId ? ' active' : '');
    item.onclick = () => selectNote(note.id);

    const titleEl = document.createElement('span');
    titleEl.className   = 'note-item-title';
    titleEl.textContent = note.title.trim() || 'Untitled';

    const deleteBtn = document.createElement('button');
    deleteBtn.className   = 'delete-note-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title       = 'Delete note';
    deleteBtn.onclick = (e) => deleteNote(note.id, e);

    item.appendChild(titleEl);
    item.appendChild(deleteBtn);
    noteList.appendChild(item);
  });
}

// ─── Note CRUD ───────────────────────────────────────────────────────────────

function newNote() {
  saveNotes();
  const note = { id: generateId(), title: 'Untitled', content: '' };
  notes.unshift(note);
  currentNoteId = note.id;
  images = {};
  imageCounter = 0;
  titleInput.value = note.title;
  editor.value     = note.content;
  renderPreview();
  renderSidebar();
  editor.focus();
}

async function selectNote(id) {
  if (id === currentNoteId) return;
  saveNotes();
  currentNoteId = id;
  images = {};
  imageCounter = 0;
  loadCurrentNote();
  images = await loadImages(currentNoteId);
  imageCounter = Object.keys(images).length;
  renderPreview();
  renderSidebar();
  editor.focus();
}

function deleteNote(id, e) {
  e.stopPropagation();

  if (notes.length === 1) {
    // Clear the only note instead of deleting it
    notes[0].title   = 'Untitled';
    notes[0].content = '';
    titleInput.value = 'Untitled';
    editor.value     = '';
    images = {};
    imageCounter = 0;
    renderPreview();
    renderSidebar();
    saveNotes();
    return;
  }

  const idx = notes.findIndex(n => n.id === id);
  notes.splice(idx, 1);
  deleteNoteImages(id);

  if (currentNoteId === id) {
    currentNoteId = notes[Math.min(idx, notes.length - 1)].id;
    images = {};
    imageCounter = 0;
    loadCurrentNote();
    loadImages(currentNoteId).then(imgs => {
      images = imgs;
      imageCounter = Object.keys(imgs).length;
      renderPreview();
    });
  }

  saveNotes();
  renderSidebar();
}

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
  saveNotes();

  // Scroll preview to match cursor position in editor
  const editorScrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
  preview.scrollTop = editorScrollRatio * (preview.scrollHeight - preview.clientHeight);
}

function updateWordCount() {
  const text  = editor.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = editor.value.length;
  wordCount.textContent = `${words} word${words !== 1 ? 's' : ''} · ${chars} char${chars !== 1 ? 's' : ''}`;
}

editor.addEventListener('input', renderPreview);

titleInput.addEventListener('input', () => {
  saveNotes();
  renderSidebar();
});

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
  saveImage(currentNoteId, filename, blob);

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

document.getElementById('newNoteBtn').addEventListener('click', newNote);

loadNotes();
loadCurrentNote();
renderSidebar();
loadImages(currentNoteId).then(imgs => {
  images = imgs;
  imageCounter = Object.keys(imgs).length;
  renderPreview();
});
