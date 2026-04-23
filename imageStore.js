// imageStore.js — IndexedDB persistence for note images
// Each image is stored with key `{noteId}/{filename}` and value Blob.

const DB_NAME    = 'markfolio_images';
const DB_VERSION = 1;
const STORE      = 'images';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function saveImage(noteId, filename, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, `${noteId}/${filename}`);
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
}

// Returns { filename: Blob, … } for the given note
async function loadImages(noteId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE, 'readonly');
    const store   = tx.objectStore(STORE);
    const prefix  = `${noteId}/`;
    const range   = IDBKeyRange.bound(prefix, prefix + '\uffff');
    const results = {};

    const req = store.openCursor(range);
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        results[cursor.key.slice(prefix.length)] = cursor.value;
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

// Removes all images belonging to a deleted note
async function deleteNoteImages(noteId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const range = IDBKeyRange.bound(`${noteId}/`, `${noteId}/\uffff`);

    const req = store.openCursor(range);
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
      else         { resolve(); }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}
