import { firebaseConfig } from '../sync/firebaseConfig.js';
import { createFirebase } from './firestore.js';
import { local } from './local.js';

// With a Firebase config the app uses Firestore + login; without one it runs on this browser only (no login).
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
const base = firebaseConfigured ? createFirebase(firebaseConfig) : local;

/* Every hub (venue) has its own data under hubs/{hubId}/...; hubs cannot see each other. These collections are
   platform-wide instead: the list of hubs, the super admins, and the directory of accounts. */
const GLOBAL = new Set(['hubs', 'platformAdmins', 'users']);

let currentHub = '';
export const setHub = (id) => { currentHub = id || ''; };
export const getHub = () => currentHub || 'default';

const make = (hubOf) => {
  const p = (n) => (GLOBAL.has(n) ? n : `hubs/${hubOf()}/${n}`);
  return {
    mode: base.mode,
    newId: base.newId,
    auth: base.auth,
    watchCollection: (n, cb, opts, onError) => base.watchCollection(p(n), cb, opts, onError),
    watchDoc: (n, id, cb, onError) => base.watchDoc(p(n), id, cb, onError),
    getDoc: (n, id) => base.getDoc(p(n), id),
    getCollection: (n, opts) => base.getCollection(p(n), opts),
    setDoc: (n, id, d, opts) => base.setDoc(p(n), id, d, opts),
    deleteDoc: (n, id) => base.deleteDoc(p(n), id),
    transaction: (fn) => base.transaction((tx) => fn({
      get: (n, i) => tx.get(p(n), i),
      set: (n, i, d) => tx.set(p(n), i, d),
      delete: (n, i) => tx.delete(p(n), i),
    })),
  };
};

// `data` works inside the current hub; data.forHub(id) is for the platform console, which reaches into a given hub
export const data = { ...make(getHub), forHub: (id) => make(() => id) };
