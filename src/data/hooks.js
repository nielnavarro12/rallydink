import { createContext, createElement, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { data, getHub } from './index.js';

/* ---------- collections: one shared live listener per query (and per hub) ---------- */
const stores = new Map();

export function resetStores() {
  stores.forEach((s) => s.off());
  stores.clear();
}
export function dropHubStores(hub) {
  for (const [k, s] of Array.from(stores)) {
    if (k.startsWith(`${hub}|`)) { s.off(); stores.delete(k); }
  }
}

function storeFor(name, opts, hub) {
  const h = hub || getHub();
  const key = `${h}|${name}|${JSON.stringify(opts || {})}`;
  let s = stores.get(key);
  if (!s) {
    s = { items: [], error: null, listeners: new Set(), off: () => {} };
    const notify = () => s.listeners.forEach((l) => l());
    const src = hub ? data.forHub(hub) : data;
    s.off = src.watchCollection(name, (items) => { s.items = items; notify(); }, opts, (e) => { s.error = e; notify(); });
    stores.set(key, s);
  }
  return s;
}

// hub: read another hub's collection (platform console only); by default the current hub
export function useCollection(name, opts, hub) {
  const s = storeFor(name, opts, hub);
  const subscribe = useCallback((cb) => { s.listeners.add(cb); return () => s.listeners.delete(cb); }, [s]);
  return useSyncExternalStore(subscribe, () => s.items, () => s.items);
}

const dayStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// public: the court rentals from today on (court, date, start, end, name)
export const useRentals = () => useCollection('rentalsPublic', { where: ['date', '>=', dayStart()] });
// public: the open play sessions
export const useSessions = () => useCollection('sessions');

/* one document, e.g. a player profile */
export function useDocument(name, id, hub) {
  const [doc, setDoc] = useState(null);
  const h = hub || getHub();
  useEffect(() => {
    if (!id) { setDoc(null); return undefined; }
    const src = hub ? data.forHub(hub) : data;
    return src.watchDoc(name, id, setDoc, () => setDoc(null));
  }, [name, id, h]); // eslint-disable-line react-hooks/exhaustive-deps
  return doc;
}

/* ---------- login state ----------
   AuthProvider (the whole app): who is signed in, and whether they are a platform super admin.
   HubProvider (inside a hub) replaces isAdmin / role / can with the person's role in THAT hub. */
export const AuthContext = createContext({
  loading: false, user: null, isSuper: false, isAdmin: false, role: '', can: () => false, hub: null, mode: data.mode,
});
export const useAuth = () => useContext(AuthContext);

async function ensureUserDoc(u) {
  try {
    await data.setDoc('users', u.uid, { uid: u.uid, email: u.email, name: u.name || '', updatedAt: Date.now() }, { merge: true });
  } catch { /* the directory entry can be written later */ }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, isSuper: false });

  useEffect(() => {
    let offSuper = () => {};
    const off = data.auth.onChange((u) => {
      offSuper();
      resetStores();
      if (!u) { setState({ loading: false, user: null, isSuper: false }); return; }
      if (data.mode === 'local') { setState({ loading: false, user: u, isSuper: true }); return; }
      setState({ loading: true, user: u, isSuper: false });
      ensureUserDoc(u);
      // super admin = a document in platformAdmins with the user's id
      offSuper = data.watchDoc('platformAdmins', u.uid, (doc) => setState({ loading: false, user: u, isSuper: !!doc }), () => setState({ loading: false, user: u, isSuper: false }));
    });
    return () => { off(); offSuper(); };
  }, []);

  return createElement(AuthContext.Provider, { value: { ...state, isAdmin: false, role: '', can: () => false, hub: null, mode: data.mode } }, children);
}
