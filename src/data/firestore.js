import { newId } from './ids.js';

/* Firebase adapter: Firestore for data, Firebase Auth for login.
   The Firebase libraries are loaded on demand, so local mode never downloads them. */
export function createFirebase(config) {
  let ready = null;
  const init = () => {
    ready ||= Promise.all([import('firebase/app'), import('firebase/firestore'), import('firebase/auth')]).then(([app, fs, au]) => {
      const a = app.getApps()[0] || app.initializeApp(config);
      return { app, a, fs, au, db: fs.getFirestore(a), auth: au.getAuth(a) };
    });
    return ready;
  };
  const plain = (d) => ({ id: d.id, ...d.data() });
  const watch = (build, handle, onError) => {
    let off = () => {};
    let dead = false;
    init()
      .then((f) => { if (!dead) off = f.fs.onSnapshot(build(f), handle, (e) => onError && onError(e)); })
      .catch((e) => onError && onError(e));
    return () => { dead = true; off(); };
  };

  return {
    mode: 'firebase',
    newId,

    watchCollection: (name, cb, opts, onError) =>
      watch(
        ({ fs, db }) => {
          const c = fs.collection(db, name);
          return opts && opts.where ? fs.query(c, fs.where(...opts.where)) : c;
        },
        (snap) => cb(snap.docs.map(plain)),
        onError,
      ),

    watchDoc: (name, id, cb, onError) =>
      watch(
        ({ fs, db }) => fs.doc(db, name, id),
        (snap) => {
          if (snap.metadata.hasPendingWrites) return; // the echo of our own write
          cb(snap.exists() ? plain(snap) : null);
        },
        onError,
      ),

    async getCollection(name, opts) {
      const { fs, db } = await init();
      const c = fs.collection(db, name);
      const snap = await fs.getDocs(opts && opts.where ? fs.query(c, fs.where(...opts.where)) : c);
      return snap.docs.map(plain);
    },
    async getDoc(name, id) {
      const { fs, db } = await init();
      const s = await fs.getDoc(fs.doc(db, name, id));
      return s.exists() ? plain(s) : null;
    },
    async setDoc(name, id, d, opts) {
      const { fs, db } = await init();
      const ref = fs.doc(db, name, id);
      if (opts && opts.merge) await fs.setDoc(ref, d, { merge: true });
      else await fs.setDoc(ref, d);
    },
    async deleteDoc(name, id) {
      const { fs, db } = await init();
      await fs.deleteDoc(fs.doc(db, name, id));
    },
    // fn(tx): tx.get(name, id) -> data | null, tx.set(name, id, data), tx.delete(name, id). Do all reads first.
    async transaction(fn) {
      const { fs, db } = await init();
      await fs.runTransaction(db, (t) =>
        fn({
          get: async (n, i) => {
            const s = await t.get(fs.doc(db, n, i));
            return s.exists() ? s.data() : null;
          },
          set: (n, i, d) => t.set(fs.doc(db, n, i), d),
          delete: (n, i) => t.delete(fs.doc(db, n, i)),
        }),
      );
    },

    auth: {
      onChange(cb) {
        let off = () => {};
        let dead = false;
        init()
          .then(({ au, auth }) => {
            if (dead) return;
            off = au.onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email || '', name: u.displayName || '' } : null));
          })
          .catch(() => cb(null));
        return () => { dead = true; off(); };
      },
      async signIn(email, password) {
        const { au, auth } = await init();
        await au.signInWithEmailAndPassword(auth, email, password);
      },
      async signUp(email, password, name) {
        const { au, auth } = await init();
        const c = await au.createUserWithEmailAndPassword(auth, email, password);
        if (name) await au.updateProfile(c.user, { displayName: name });
        return c.user.uid; // the hub creates the player profile (Login does it right after sign-up)
      },
      // create an account for someone else WITHOUT signing in as them: a second app instance does the sign-up,
      // so the owner stays signed in on the main one
      async createUser(email, password, name) {
        const { app, au } = await init();
        const second = app.getApps().find((x) => x.name === 'accounts') || app.initializeApp(config, 'accounts');
        const sAuth = au.getAuth(second);
        const c = await au.createUserWithEmailAndPassword(sAuth, email, password);
        if (name) await au.updateProfile(c.user, { displayName: name });
        await au.signOut(sAuth);
        return c.user.uid;
      },
      async signInGoogle() {
        const { au, auth } = await init();
        await au.signInWithPopup(auth, new au.GoogleAuthProvider());
      },
      async signOut() {
        const { au, auth } = await init();
        await au.signOut(auth);
      },
      async resetPassword(email) {
        const { au, auth } = await init();
        await au.sendPasswordResetEmail(auth, email);
      },
    },
  };
}
