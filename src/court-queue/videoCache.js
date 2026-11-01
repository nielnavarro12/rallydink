const DB_NAME = 'default';
const STORE_NAME = 'videos';

let dbPromise = null;
const activeDownloads = new Map();
const objectUrlMap = new Map();

/**
 * Singleton database connection helper
 */
function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

/**
 * Downloads and caches video files as Blobs in IndexedDB
 * @param {string} url - The video URL to fetch and cache
 * @returns {Promise<string>} Local blob URL or original network URL fallback
 */
export async function getCachedVideoUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return url; // Non-HTTP or inline assets return as-is
  }

  // Reuse existing memory URL if already created in current session
  if (objectUrlMap.has(url)) {
    return objectUrlMap.get(url);
  }

  // Deduplicate inflight network requests for the same URL
  if (activeDownloads.has(url)) {
    return activeDownloads.get(url);
  }

  const fetchAndCachePromise = (async () => {
    try {
      const db = await openDB();

      // 1. Read existing Blob from IndexedDB
      const cachedBlob = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(url);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });

      if (cachedBlob) {
        const objectUrl = URL.createObjectURL(cachedBlob);
        objectUrlMap.set(url, objectUrl);
        return objectUrl;
      }

      // 2. Fetch video from network
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const blob = await response.blob();

      // 3. Save Blob into IndexedDB
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(blob, url);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      const objectUrl = URL.createObjectURL(blob);
      objectUrlMap.set(url, objectUrl);
      return objectUrl;
    } catch (err) {
      console.warn('Video local caching failed, streaming directly:', err);
      return url; // Stream directly from source URL on failure
    } finally {
      activeDownloads.delete(url);
    }
  })();

  activeDownloads.set(url, fetchAndCachePromise);
  return fetchAndCachePromise;
}

/**
 * Revokes memory URLs and clears local IndexedDB storage
 */
export async function clearVideoCache() {
  // Revoke active Object URLs to free browser RAM
  for (const objectUrl of objectUrlMap.values()) {
    URL.revokeObjectURL(objectUrl);
  }
  objectUrlMap.clear();

  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to clear video cache:', err);
  }
}