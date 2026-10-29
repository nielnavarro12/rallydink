import { newId } from './ids.js';

/* Local database (used when Firebase is not configured): the same interface as the Firestore adapter,
   stored in this browser's localStorage. No login is needed in this mode. */
const KEY = 'court-queue-localdb-v1';
const OPS = { '==': (a, b) => a === b, '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '<': (a, b) => a < b };

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};
let db = load();
const subs = new Set();
const emit = () => subs.forEach((fn) => fn());
let channel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('court-queue-localdb');
    channel.onmessage = () => { db = load(); emit(); };
  }
} catch { /* single-tab only */ }
const commit = () => {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full or blocked */ }
  emit();
  channel?.postMessage(1);
};

const rows = (name, opts) => {
  let items = Object.entries(db[name] || {}).map(([id, v]) => ({ id, ...v }));
  if (opts?.where) {
    const [f, op, v] = opts.where;
    items = items.filter((x) => OPS[op](x[f], v));
  }
  return items;
};
const put = (n, i, d) => { db[n] = { ...(db[n] || {}), [i]: d }; };
const drop = (n, i) => { if (db[n]) { const { [i]: _gone, ...rest } = db[n]; db[n] = rest; } };

export const local = {
  mode: 'local',
  newId,
  watchCollection(name, cb, opts) {
    const run = () => cb(rows(name, opts));
    subs.add(run);
    run();
    return () => subs.delete(run);
  },
  watchDoc(name, id, cb) {
    const run = () => cb(db[name] && db[name][id] ? { id, ...db[name][id] } : null);
    subs.add(run);
    run();
    return () => subs.delete(run);
  },
  async getCollection(name, opts) { return rows(name, opts); },
  async getDoc(name, id) { return db[name] && db[name][id] ? { id, ...db[name][id] } : null; },
  async setDoc(name, id, d, opts) { put(name, id, opts?.merge ? { ...((db[name] || {})[id] || {}), ...d } : d); commit(); },
  async deleteDoc(name, id) { drop(name, id); commit(); },
  // all reads see the current data; the writes are applied together at the end
  async transaction(fn) {
    const writes = [];
    await fn({
      get: async (n, i) => (db[n] && db[n][i] ? { ...db[n][i] } : null),
      set: (n, i, d) => writes.push(['set', n, i, d]),
      delete: (n, i) => writes.push(['del', n, i]),
    });
    writes.forEach(([op, n, i, d]) => (op === 'set' ? put(n, i, d) : drop(n, i)));
    commit();
  },
  auth: {
    onChange(cb) { cb({ uid: 'local', email: '', name: 'Local admin' }); return () => {}; },
    async signIn() {}, async signUp() { return newId(); }, async signInGoogle() {}, async signOut() {}, async resetPassword() {},
    async createUser() { return newId(); },
  },
};
