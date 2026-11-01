import { firebaseConfig } from '../sync/firebaseConfig.js';
import { createFirebase } from './firestore.js';
import { local } from './local.js';

/* With a Firebase config the app uses Firestore + login; without one it runs on this browser only (no login). */
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
const base = firebaseConfigured ? createFirebase(firebaseConfig) : local;

// Flip to true to see which project the app talks to and which paths it reads.
const DEBUG = false;
if (DEBUG) console.info('[data] mode:', base.mode, 'project:', firebaseConfig.projectId);

/* ---------- path scoping ----------
   Every hub (venue) keeps its data under hubs/{hubId}/...; hubs cannot see each other.
   These collections are platform-wide instead: the list of hubs, the super admins, the account directory. */
const GLOBAL = new Set(['hubs', 'platformAdmins', 'users']);

// A name is used as-is when it is a global collection or already a full path ("hubs/{id}/admins").
// Everything else is a hub collection and gets the hub prefix.
const isAbsolute = (name) => GLOBAL.has(name) || name.startsWith('hubs/');
const scope = (name, hubId) => (isAbsolute(name) ? name : `hubs/${hubId}/${name}`);

/* ---------- current hub ---------- */
let currentHub = '';
export const setHub = (id) => { currentHub = id || ''; };
export const getHub = () => currentHub || 'default';

/* ---------- data API ----------
   makeApi(hubOf) returns the full data API scoped to whichever hub hubOf() returns. */
function makeApi(hubOf) {
  const p = (name) => {
    const path = scope(name, hubOf());
    if (DEBUG) console.debug('[data]', name, '->', path);
    return path;
  };

  return {
    mode: base.mode,
    newId: base.newId,
    auth: base.auth,

    watchCollection: (name, cb, opts, onError) => base.watchCollection(p(name), cb, opts, onError),
    watchDoc: (name, id, cb, onError) => base.watchDoc(p(name), id, cb, onError),
    getCollection: (name, opts) => base.getCollection(p(name), opts),
    getDoc: (name, id) => base.getDoc(p(name), id),
    setDoc: (name, id, d, opts) => base.setDoc(p(name), id, d, opts),
    deleteDoc: (name, id) => base.deleteDoc(p(name), id),

    // fn(tx): tx.get(name, id) -> data | null, tx.set(name, id, data), tx.delete(name, id). Do all reads first.
    transaction: (fn) =>
      base.transaction((tx) =>
        fn({
          get: (name, id) => tx.get(p(name), id),
          set: (name, id, d) => tx.set(p(name), id, d),
          delete: (name, id) => tx.delete(p(name), id),
        }),
      ),
  };
}

/* `data` works inside the current hub.
   data.forHub(id) reaches into a specific hub (platform console, hub creation).
   data.createHub(...) creates a hub and its first owner in ONE transaction, which the Firestore rules require. */
export const data = {
  ...makeApi(getHub),

  forHub: (id) => makeApi(() => id),

  async createHub(hubId, hubData, ownerUid) {
    await base.transaction((tx) => {
      tx.set('hubs', hubId, hubData);
      if (ownerUid) tx.set(`hubs/${hubId}/admins`, ownerUid, { role: 'owner' });
    });
  },
};