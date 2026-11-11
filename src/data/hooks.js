import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { data, getHub } from "./index.js";

/* ---------- collections: one shared live listener per query (and per hub) ---------- */
const stores = new Map();

export function resetStores() {
  stores.forEach((s) => s.off());
  stores.clear();
}

export function dropHubStores(hub) {
  for (const [k, s] of Array.from(stores)) {
    if (k.startsWith(`${hub}|`)) {
      s.off();
      stores.delete(k);
    }
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
    s.off = src.watchCollection(
      name,
      (items) => {
        s.items = items;
        notify();
      },
      opts,
      (e) => {
        s.error = e;
        notify();
      },
    );
    stores.set(key, s);
  }
  return s;
}

// hub: read another hub's collection (platform console only); by default the current hub
export function useCollection(name, opts, hub) {
  const s = storeFor(name, opts, hub);
  const subscribe = useCallback(
    (cb) => {
      s.listeners.add(cb);
      return () => s.listeners.delete(cb);
    },
    [s],
  );
  return useSyncExternalStore(
    subscribe,
    () => s.items,
    () => s.items,
  );
}

const dayStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// public: the court rentals from today on (court, date, start, end, name)
export const useRentals = () =>
  useCollection("rentalsPublic", { where: ["date", ">=", dayStart()] });

// public: the open play sessions
export const useSessions = () => useCollection("sessions");

/* one document, e.g. a player profile */
export function useDocument(name, id, hub) {
  const [doc, setDoc] = useState(null);
  const h = hub || getHub();
  useEffect(() => {
    if (!id) {
      setDoc(null);
      return undefined;
    }
    const src = hub ? data.forHub(hub) : data;
    return src.watchDoc(name, id, setDoc, () => setDoc(null));
  }, [name, id, h]); // eslint-disable-line react-hooks/exhaustive-deps
  return doc;
}

/* ---------- login state ----------
   AuthProvider (the whole app): who is signed in, user profile data (including assignedHubs),
   and whether they are a platform super admin.
   HubProvider (inside a hub) replaces isAdmin / role / can with the person's role in THAT hub. */
export const AuthContext = createContext({
  loading: false,
  user: null,
  assignedHubs: [],
  managesHub: () => false,
  isSuper: false,
  isAdmin: false,
  role: "",
  can: () => false,
  hub: null,
  mode: data.mode,
});

export const useAuth = () => useContext(AuthContext);

async function ensureUserDoc(u) {
  try {
    await data.setDoc(
      "users",
      u.uid,
      { uid: u.uid, email: u.email, name: u.name || "", updatedAt: Date.now() },
      { merge: true },
    );
  } catch {
    /* the directory entry can be written later */
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    user: null,
    userDoc: null,
    isSuper: false,
  });

  useEffect(() => {
    let offSuper = () => {};
    let offUserDoc = () => {};

    const off = data.auth.onChange((u) => {
      offSuper();
      offUserDoc();
      offSuper = () => {};
      offUserDoc = () => {};
      resetStores();

      if (!u) {
        setState({ loading: false, user: null, userDoc: null, isSuper: false });
        return;
      }

      if (data.mode === "local") {
        setState({
          loading: false,
          user: u,
          userDoc: { uid: u.uid, assignedHubs: [] },
          isSuper: true,
        });
        return;
      }

      setState({ loading: true, user: u, userDoc: null, isSuper: false });
      ensureUserDoc(u);

      let active = true;

      // 1. Watch user document to read profile & assignedHubs array
      const stopUserDoc = data.watchDoc(
        "users",
        u.uid,
        (doc) => {
          if (!active) return;
          setState((prev) => ({ ...prev, userDoc: doc }));
        },
        () => {
          if (!active) return;
          setState((prev) => ({ ...prev, userDoc: null }));
        }
      );

      // 2. Watch platformAdmins to determine super admin rights
      const stopSuper = data.watchDoc(
        "platformAdmins",
        u.uid,
        (doc) => {
          if (!active) return;
          setState((prev) => ({ ...prev, loading: false, user: u, isSuper: !!doc }));
        },
        (err) => {
          if (!active) return;
          console.error("[auth] platformAdmins read failed:", err.code, err.message);
          setState((prev) => ({ ...prev, loading: false, user: u, isSuper: false }));
        }
      );

      offSuper = () => {
        active = false;
        stopSuper();
      };
      offUserDoc = () => {
        stopUserDoc();
      };
    });

    return () => {
      off();
      offSuper();
      offUserDoc();
    };
  }, []);

  // Combine auth user object with Firestore user document (assignedHubs)
  const fullUser = state.user
    ? {
        ...state.user,
        ...(state.userDoc || {}),
      }
    : null;

  const assignedHubs = Array.isArray(fullUser?.assignedHubs)
    ? fullUser.assignedHubs
    : [];

  const managesHub = (hubId) => {
    if (state.isSuper) return true;
    return assignedHubs.includes(hubId);
  };

  return createElement(
    AuthContext.Provider,
    {
      value: {
        loading: state.loading,
        user: fullUser,
        assignedHubs,
        managesHub,
        isSuper: state.isSuper,
        isAdmin: false,
        role: "",
        can: () => false,
        hub: null,
        mode: data.mode,
      },
    },
    children,
  );
}