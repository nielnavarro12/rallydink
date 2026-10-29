import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a local file to Firebase Storage scoped by hubId
 * @param {File} file 
 * @param {string} hubId 
 * @param {function} onProgress - Callback with percentage (0-100)
 * @returns {Promise<string>} Download URL
 */
export async function uploadHubMedia(file, hubId, onProgress) {
  if (!file || !hubId) throw new Error('Missing file or hub ID');

  const storage = getStorage();
  const fileExt = file.name.split('.').pop();
  const storagePath = `hubs/${hubId}/ads/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}