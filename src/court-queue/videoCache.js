const DB_NAME = 'CourtSyncVideoCache';
const STORE_NAME = 'videos';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Downloads and caches video file as a Blob locally
 */
export async function getCachedVideoUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return url; // Local or non-http assets return as-is
  }

  try {
    const db = await openDB();

    // 1. Check existing Blob in IndexedDB
    const cachedBlob = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (cachedBlob) {
      return URL.createObjectURL(cachedBlob);
    }

    // 2. Download video once if not found in cache
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const blob = await response.blob();

    // 3. Save Blob to IndexedDB
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, url);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Video local caching failed, streaming directly:', err);
    return url; // Fallback to direct network stream on download error
  }
}