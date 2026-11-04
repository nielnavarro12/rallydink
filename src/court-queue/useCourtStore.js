import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  useAuth,
  useCollection,
  useRentals,
  useSessions,
} from "../data/hooks.js";

import { data, getHub } from "../data/index.js";
import{load, strip, keyOf, chanOf} from "./courtQueue.js";
import {initial} from "./initial.js"; 
export function useCourtStore({ readOnly = false } = {}) {
  const auth = useAuth();
  const rentals = useRentals();
  const sessions = useSessions();
  const [state, setState] = useState(load);
  // sync: { status: 'off' | 'connecting' | 'live' | 'error', error }
  const [sync, setSync] = useState({
    status: data.mode === "firebase" ? "connecting" : "off",
    error: "",
  });
  const ref = useRef(state);
  const derived = useRef({});
  derived.current = { bookings: rentals, schedule: sessions };
  const chan = useRef(null);
  const conn = useRef(null);
  const pushT = useRef(null);
  const dirty = useRef(false);
  const clientId = useRef(Math.random().toString(36).slice(2));

  // Same-browser sync: other tabs and windows
  useEffect(() => {
    chan.current = new BroadcastChannel(chanOf());
    const apply = (next) => {
      ref.current = next;
      setState(next);
    };
    chan.current.onmessage = (e) => apply(e.data);
    const onStorage = (e) =>
      e.key === keyOf() && e.newValue && apply(strip(JSON.parse(e.newValue)));
    window.addEventListener("storage", onStorage);
    return () => {
      chan.current.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Cross-device sync: the live state is one public document (display/live). Only staff can write it; the TV and
  // the client pages only read it.
  useEffect(() => {
    if (data.mode !== "firebase" || auth.loading) return undefined;
    const canWrite = !readOnly && (auth.can("queue") || auth.can("tv")); // roles that may change the live queue
    const push = () => {
      dirty.current = false;
      data
        .setDoc("display", "live", {
          json: JSON.stringify(ref.current),
          by: clientId.current,
          ts: Date.now(),
        })
        .catch((e) =>
          setSync({
            status: "error",
            error:
              e.code === "permission-denied"
                ? "Permission denied: check the Firestore rules."
                : String(e.message || e),
          }),
        );
    };
    conn.current = canWrite ? push : null;
    const off = data.watchDoc(
      "display",
      "live",
      (doc) => {
        if (!doc) {
          if (canWrite) push(); // an empty database is filled from this device
        } else if (doc.by !== clientId.current) {
          try {
            const next = strip({ ...initial, ...JSON.parse(doc.json) });
            ref.current = next;
            setState(next);
            localStorage.setItem(keyOf(), JSON.stringify(next));
          } catch {
            /* ignore a malformed document */
          }
        }
        setSync({ status: "live", error: "" });
      },
      (e) =>
        setSync({
          status: "error",
          error:
            e && e.code === "permission-denied"
              ? "Permission denied: check the Firestore rules."
              : String((e && e.message) || e),
        }),
    );
    return () => {
      clearTimeout(pushT.current);
      if (dirty.current && conn.current) conn.current(); // flush a pending change before leaving the page
      off();
      conn.current = null;
    };
  }, [
    auth.loading,
    auth.isAdmin,
    auth.role,
    auth.user && auth.user.uid,
    readOnly,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // update(fn): fn receives the latest state (with rentals and sessions merged in) and returns the next one.
  const update = useCallback((fn) => {
    const input = { ...ref.current, ...derived.current };
    const out = fn(input);
    if (out === input) return;
    const next = strip(out);
    ref.current = next;
    setState(next);
    localStorage.setItem(keyOf(), JSON.stringify(next));
    chan.current?.postMessage(next);
    if (conn.current) {
      dirty.current = true;
      clearTimeout(pushT.current);
      pushT.current = setTimeout(() => conn.current?.(), 250);
    }
  }, []);

  const merged = useMemo(
    () => ({ ...state, bookings: rentals, schedule: sessions }),
    [state, rentals, sessions],
  );
  return [merged, update, sync];
}