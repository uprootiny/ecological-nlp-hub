// IndexedDB corpus store + in-memory analysis cache

const DB_NAME = "ecological-nlp-hub";
const DB_VERSION = 1;

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("corpora")) {
        const store = db.createObjectStore("corpora", { keyPath: "id", autoIncrement: true });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("importedAt", "importedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("analyses")) {
        db.createObjectStore("analyses", { keyPath: ["corpusId", "type"] });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveCorpus(corpus) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("corpora", "readwrite");
    const store = tx.objectStore("corpora");
    const request = store.add({
      ...corpus,
      importedAt: new Date().toISOString(),
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listCorpora() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("corpora", "readonly");
    const store = tx.objectStore("corpora");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCorpus(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("corpora", "readonly");
    const store = tx.objectStore("corpora");
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCorpus(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("corpora", "readwrite");
    const store = tx.objectStore("corpora");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// In-memory analysis cache keyed by corpusId
const analysisCache = new Map();

export function getCachedAnalysis(corpusId, type) {
  const key = `${corpusId}:${type}`;
  return analysisCache.get(key) || null;
}

export function setCachedAnalysis(corpusId, type, result) {
  const key = `${corpusId}:${type}`;
  analysisCache.set(key, result);
  // LRU eviction at 50 entries
  if (analysisCache.size > 50) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
}
