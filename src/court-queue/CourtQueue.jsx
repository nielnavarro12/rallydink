import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdPanel, Ticker } from "./TvAds.jsx";
import GameTimer from "./GameTimer.jsx";
import { useSpeech } from "../speech/useSpeech.js";
import { hasStats, recordResult } from "../stats/stats.js";
import StatsView from "../stats/StatsView.jsx";
import { data, getHub } from "../data/index.js";
import {
  useAuth,
  useCollection,
  useRentals,
  useSessions,
} from "../data/hooks.js";
import { levelNum, playerLevel } from "../data/levels.js";
import { useHubHref } from "../hub/links.jsx";
import { useHub } from "../hub/HubProvider.jsx";
import "./courtQueue.css";

/* =====================================================================
   State + sync
   The control page writes; the TV page listens. Sync uses localStorage +
   BroadcastChannel, so it works across tabs/windows on the SAME browser
   (e.g. laptop with the TV as a second screen). For a TV on another
   device, replace `persist` / the listeners in useCourtStore with your
   backend (WebSocket, Firebase, Supabase realtime...). Nothing else changes.
   ===================================================================== */
// each hub keeps its own saved state and its own same-browser sync channel
const keyOf = () => `court-queue-state-v1:${getHub()}`;
const chanOf = () => `court-queue:${getHub()}`;

const initial = {
  q: [], // waiting players: { n: name, r?: 'W' | 'L' }
  courts: [
    { n: 1, m: null },
    { n: 2, m: null },
  ], // m: { p1: [a, b], p2: [c, d] }
  ev: null, // last announcement: { id, type: 'call' | 'win', ... }
  sport: "Pickleball",
  voice: true,
  auto: true,
  rejoin: true,
  mode: "fifo", // fifo | rand | wl
  rotate: true, // TV alternates between the court board and the schedule
  ads: [], // TV ad playlist: { id, type: 'video' | 'youtube' | 'image', url, title, seconds }
  announcements: [], // TV scrolling messages: { id, text }
  adsOn: true,
  adsPct: 30, // width of the ads panel, % of the screen
  adFill: false, // crop ads to fill the panel instead of fitting inside it
  adSound: false,
  tickerSpeed: 12,
  club: "", // optional TV header title
  partners: { date: "", list: [] }, // fixed partners: [[nameA, nameB, 'session' | 'once'], ...] (cleared the next day)
  gameMinutes: 0, // time limit for a game in minutes; 0 = no limit (the timer just counts up)
  stats: {}, // player win/loss stats, see stats/stats.js
  pairs: {}, // partner combination stats
  results: [], // recent finished matches
  showStats: true, // TV shows the stats screen after the schedule
  speech: {
    voice: "",
    lang: "en",
    rate: 1,
    pitch: 1,
    volume: 1,
    duck: true,
    duckLevel: 0.15,
  }, // TV voice + ad ducking
};

const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

// Rentals and open play sessions live in the database (collections), not in this state: they are merged in when read.
const strip = ({ bookings, schedule, ...rest }) => rest; // eslint-disable-line no-unused-vars

const load = () => {
  try {
    return strip({ ...initial, ...JSON.parse(localStorage.getItem(keyOf())) });
  } catch {
    return initial;
  }
};

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

/* =====================================================================
   Match logic (pure functions: state in, state out)
   ===================================================================== */
/* ---------- fixed partners (for one day) ---------- */
const norm = (n) =>
  String(n || "")
    .trim()
    .toLowerCase();
export const activePairs = (s) =>
  s.partners && s.partners.date === todayStr() ? s.partners.list : [];
export const mateOf = (s, name) => {
  const k = norm(name);
  for (const [a, b] of activePairs(s)) {
    if (norm(a) === k) return b;
    if (norm(b) === k) return a;
  }
  return null;
};
// make a and b partners for today (each player can have only one partner)
// mode 'session': partners for the rest of the queue session (until unpaired, ended, or the day ends)
// mode 'once': partners for their next match only
export function pairUp(s, a, b, mode = "session") {
  if (!a || !b || norm(a) === norm(b)) return s;
  const keep = activePairs(s).filter(
    ([x, y]) => ![x, y].some((n) => norm(n) === norm(a) || norm(n) === norm(b)),
  );
  return {
    ...s,
    partners: {
      date: todayStr(),
      list: [...keep, [a, b, mode === "once" ? "once" : "session"]],
    },
  };
}
// end the queue session: every fixed partnership is cleared
export const endSession = (s) => ({
  ...s,
  partners: { date: todayStr(), list: [] },
});
export function unpair(s, name) {
  const k = norm(name);
  return {
    ...s,
    partners: {
      date: todayStr(),
      list: activePairs(s).filter(([x, y]) => norm(x) !== k && norm(y) !== k),
    },
  };
}

/* The queue as "units": a fixed pair that is waiting together counts as one unit of 2 players, anyone else as 1. */
export function units(s) {
  const q = s.q;
  const used = new Set();
  const out = [];
  q.forEach((p, i) => {
    if (used.has(i)) return;
    used.add(i);
    const mate = mateOf(s, p.n);
    const j = mate
      ? q.findIndex((x, k) => !used.has(k) && norm(x.n) === norm(mate))
      : -1;
    if (j >= 0) {
      used.add(j);
      out.push({
        idx: [i, j],
        lvl: ((p.lvl ?? 2) + (q[j].lvl ?? 2)) / 2,
        r: p.r || q[j].r,
      });
    } else {
      out.push({ idx: [i], lvl: p.lvl ?? 2, r: p.r });
    }
  });
  return out;
}

// first combination of units (in priority order) that adds up to exactly 4 players
function fill(us, need = 4, start = 0) {
  if (need === 0) return [];
  for (let i = start; i < us.length; i++) {
    const size = us[i].idx.length;
    if (size <= need) {
      const rest = fill(us, need - size, i + 1);
      if (rest) return [us[i], ...rest];
    }
  }
  return null;
}

// the units that play the next match, or null when there are fewer than 4 players
const pick = (s) => {
  let us = units(s);
  if (s.mode === "rand") {
    us = shuffle(us);
  } else if (s.mode === "level" && us.length) {
    // the first unit in line plus the units closest in level
    const base = us[0].lvl;
    us = [
      us[0],
      ...us
        .slice(1)
        .sort((a, b) => Math.abs(a.lvl - base) - Math.abs(b.lvl - base)),
    ];
  } else if (s.mode === "wl" && us.length) {
    const t = us[0].r;
    const group = us.filter((u) => !t || !u.r || u.r === t);
    if (group.reduce((n, u) => n + u.idx.length, 0) >= 4) us = group;
  }
  return fill(us);
};

/* how long a player has been waiting: "5 min", "1 h 05 min" (long) or "5m", "1h05" (short, for the TV) */
export const waitMin = (at) =>
  Number.isFinite(at)
    ? Math.max(0, Math.floor((Date.now() - at) / 60000))
    : null;
export const fmtWait = (at) => {
  const m = waitMin(at);
  if (m === null) return "";
  if (m < 1) return "just joined";
  return m < 60
    ? `${m} min`
    : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
};
export const fmtWaitShort = (at) => {
  const m = waitMin(at);
  if (m === null) return "";
  return m < 1
    ? "new"
    : m < 60
      ? `${m}m`
      : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
};

const setCourt = (s, ci, m) =>
  s.courts.map((c, i) => (i === ci ? { ...c, m } : c));

export function callMatch(s, ci) {
  const c = s.courts[ci];
  if (c.m || activeBooking(s, c.n)) return s;
  const chosen = pick(s);
  if (!chosen) return s;
  const ids = chosen.flatMap((u) => u.idx);
  // fixed partners stay a team; everyone else gets a random partner
  const teams = chosen
    .filter((u) => u.idx.length === 2)
    .map((u) => u.idx.map((i) => s.q[i].n));
  const singles = shuffle(
    chosen.filter((u) => u.idx.length === 1).map((u) => s.q[u.idx[0]].n),
  );
  for (let k = 0; k < singles.length; k += 2)
    teams.push([singles[k], singles[k + 1]]);
  const [p1, p2] = shuffle(teams);
  // a pair made for "next match only" is used up by this match
  const used = new Set(
    chosen
      .filter((u) => u.idx.length === 2)
      .map((u) =>
        u.idx
          .map((i) => norm(s.q[i].n))
          .sort()
          .join("|"),
      ),
  );
  const left = activePairs(s).filter(
    ([x, y, mode]) =>
      !(mode === "once" && used.has([norm(x), norm(y)].sort().join("|"))),
  );
  return {
    ...s,
    ...(left.length !== activePairs(s).length
      ? { partners: { date: todayStr(), list: left } }
      : {}),
    q: s.q.filter((_, k) => !ids.includes(k)),
    courts: setCourt(s, ci, { p1, p2, startedAt: Date.now() }),
    ev: { id: Date.now(), type: "call", court: c.n, p1, p2 },
  };
}

export function finishMatch(s, ci, winner) {
  const c = s.courts[ci];
  if (!c.m) return s;
  const win = winner === 1 ? c.m.p1 : c.m.p2;
  const lose = winner === 1 ? c.m.p2 : c.m.p1;
  return {
    ...s,
    q: s.rejoin
      ? [
          ...s.q,
          ...win.map((n) => ({ n, r: "W", at: Date.now() })),
          ...lose.map((n) => ({ n, r: "L", at: Date.now() })),
        ]
      : s.q,
    courts: setCourt(s, ci, null),
    ...recordResult(s, { court: c.n, win, lose, date: todayStr() }), // player stats
    ev: { id: Date.now(), type: "win", court: c.n, win },
  };
}

const cancelMatch = (s, ci) => {
  const m = s.courts[ci].m;
  if (!m) return s;
  return {
    ...s,
    q: [...[...m.p1, ...m.p2].map((n) => ({ n, at: Date.now() })), ...s.q],
    courts: setCourt(s, ci, null),
  };
};

export const resizeCourts = (s, count) => {
  let courts = s.courts.slice(0, count);
  let q = s.q;
  s.courts.slice(count).forEach((c) => {
    if (c.m)
      q = [...[...c.m.p1, ...c.m.p2].map((n) => ({ n, at: Date.now() })), ...q];
  });
  while (courts.length < count)
    courts = [...courts, { n: courts.length + 1, m: null }];
  return { ...s, courts, q };
};

const VIEW_MS = { courts: 25000, schedule: 12000, stats: 14000 }; // how long each TV screen stays
const AUTO_CALL_DELAY = 8500; // let the congratulations screen finish first

/* =====================================================================
   Rentals (bookings): { id, court, date: 'YYYY-MM-DD', start: 'HH:MM', end: 'HH:MM', name, note }
   A court is rented right now when one of its bookings covers the current time.
   Courts without an active booking are open play courts and are used by the queue.
   ===================================================================== */
export const OPEN_MIN = 6 * 60; // first bookable time (06:00)
export const CLOSE_MIN = 22 * 60; // last possible end time (22:00)
export const SLOT = 30; // minutes per booking slot
export const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
export const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const clash = (a, b) =>
  a.court === b.court &&
  a.date === b.date &&
  toMin(a.start) < toMin(b.end) &&
  toMin(b.start) < toMin(a.end);
export const bookingsOn = (s, date, court) =>
  (s.bookings || []).filter(
    (b) => b.date === date && (court == null || b.court === court),
  );
export const activeBooking = (s, court) =>
  bookingsOn(s, todayStr(), court).find(
    (b) => toMin(b.start) <= nowMin() && nowMin() < toMin(b.end),
  );
export const nextBooking = (s, court) =>
  bookingsOn(s, todayStr(), court)
    .filter((b) => toMin(b.start) > nowMin())
    .sort((x, y) => toMin(x.start) - toMin(y.start))[0];
export const bookingConflict = (s, b) =>
  (s.bookings || []).find((x) => clash(x, b));
export const isPastBooking = (b) => `${b.date} ${b.end}` < nowStr();
export function addBooking(s, b) {
  if (bookingConflict(s, b)) return s;
  return { ...s, bookings: [...(s.bookings || []), { id: Date.now(), ...b }] };
}
export const removeBooking = (s, id) => ({
  ...s,
  bookings: (s.bookings || []).filter((b) => b.id !== id),
});

// Re-render every 30 s so rentals start/expire on screen without a refresh.
export function useClockTick() {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
}

/* =====================================================================
   Pickleball court (used on the TV page)
   ===================================================================== */
function PickleballCourt({ court, rental, next, limit = 0 }) {
  const { m } = court;
  const spot = (name, cls) => <div className={`pn ${cls}`}>{name}</div>;
  return (
    <div className={`pcw${rental ? " rented" : m ? "" : " idle"}`}>
      <div className="ct">
        <div className="kz l" />
        <div className="kz r" />
        <div className="cl a" />
        <div className="cl b" />
        <div className="net" />
        <div className="cname">COURT {court.n}</div>
        {m ? (
          <>
            {m.startedAt && (
              <div className="gt">
                <GameTimer since={m.startedAt} limit={limit} />
              </div>
            )}
            {spot(m.p1[0], "tl")}
            {spot(m.p1[1], "tr")}
            {spot(m.p2[0], "bl")}
            {spot(m.p2[1], "br")}
          </>
        ) : rental ? (
          <>
            <div className="rent-top">
              <div className="rent-tag">RENTED</div>
            </div>
            <div className="rent-bot">
              <div className="rent-time">
                {fmtTime(rental.start)} – {fmtTime(rental.end)}
              </div>
              {rental.name && <div className="rent-sub">{rental.name}</div>}
            </div>
          </>
        ) : (
          <div className="free">
            AVAILABLE
            {next && (
              <div className="rent-sub">Rented from {fmtTime(next.start)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  left: Math.random() * 100,
  dur: 3 + Math.random() * 3,
  delay: -Math.random() * 5,
  icon: ["🎉", "🏆", "⭐", "🎊"][i % 4],
}));

function Announcement({ ev, sport }) {
  if (ev.type === "call") {
    return (
      <div className="ov call">
        <div className="ov-lbl">Now calling · {sport}</div>
        <div className="ov-court">COURT {ev.court}</div>
        <div className="ov-big">{ev.p1.join(" & ")}</div>
        <div className="ov-vs">VS</div>
        <div className="ov-big">{ev.p2.join(" & ")}</div>
      </div>
    );
  }
  return (
    <div className="ov win">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="ov-conf"
          style={{
            left: `${c.left}vw`,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          {c.icon}
        </span>
      ))}
      <div className="ov-trophy">🏆</div>
      <div className="ov-lbl">Congratulations</div>
      <div className="ov-big" style={{ color: "#ffd84d", marginTop: "2vh" }}>
        {ev.win.join(" & ")}
      </div>
      <div className="ov-vs">Winners · Court {ev.court}</div>
    </div>
  );
}

const spokenText = (ev) =>
  ev.type === "call"
    ? `Now calling. Court ${ev.court}. ${ev.p1.join(" and ")}, versus ${ev.p2.join(" and ")}. Please proceed to court ${ev.court}.`
    : `Congratulations ${ev.win.join(" and ")}! Great match.`;

/* =====================================================================
   TV page: route it at e.g. /queue/tv
   ===================================================================== */
/* =====================================================================
   Open play schedule
   ===================================================================== */
export const pad = (n) => String(n).padStart(2, "0");
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const nowStr = () => {
  const d = new Date();
  return `${todayStr()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const sortSessions = (a) =>
  [...a].sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start));
export const isUpcoming = (x) => `${x.date} ${x.end}` >= nowStr();
export const upcomingSessions = (a) => sortSessions(a.filter(isUpcoming));
export const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return iso === todayStr() ? `Today · ${label}` : label;
};
export const fmtTime = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};
export const LEVELS = ["All levels", "Beginner", "Intermediate", "Advanced"];

function ScheduleView({ sessions }) {
  const days = [];
  sessions.slice(0, 10).forEach((x) => {
    const last = days[days.length - 1];
    if (last && last.date === x.date) last.items.push(x);
    else days.push({ date: x.date, items: [x] });
  });
  return (
    <div className="tvs">
      <div className="tvs-title">Open Play Schedule</div>
      <div className="tvs-cols">
        {days.map((d) => (
          <div className="tvs-day" key={d.date}>
            <div className="tvs-date">{fmtDate(d.date)}</div>
            {d.items.map((x) => (
              <div className="tvs-row" key={x.id}>
                <span className="tvs-time">
                  {fmtTime(x.start)} – {fmtTime(x.end)}
                </span>
                <span className="tvs-tag">{x.sport}</span>
                <span className="tvs-tag">{x.level}</span>
                {x.note && <span className="tvs-note">{x.note}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================================
   TV page: route it at e.g. /tv
   ===================================================================== */
// export function TvPage() {
//   const [s, , sync] = useCourtStore({ readOnly: true });
//   useClockTick();
//   const { speak, unlock, isSpeaking } = useSpeech(s.speech);
//   const [started, setStarted] = useState(false);
//   const [ev, setEv] = useState(null);
//   const [view, setView] = useState("courts"); // courts | schedule | stats
//   const upcoming = upcomingSessions(s.schedule || []);
//   const showSchedule = s.rotate && upcoming.length > 0;
//   const showStats = s.showStats !== false && hasStats(s.stats);
//   // The right side cycles: courts -> open play schedule -> player stats
//   const order = [
//     "courts",
//     ...(showSchedule ? ["schedule"] : []),
//     ...(showStats ? ["stats"] : []),
//   ];
//   const orderKey = order.join();
//   const shown = order.includes(view) ? view : "courts";

//   useEffect(() => {
//     if (order.length < 2) {
//       setView("courts");
//       return undefined;
//     }
//     const t = setTimeout(
//       () => setView((v) => order[(order.indexOf(v) + 1) % order.length]),
//       VIEW_MS[shown] ?? 12000,
//     );
//     return () => clearTimeout(t);
//   }, [shown, orderKey]); // eslint-disable-line react-hooks/exhaustive-deps
//   const startedRef = useRef(false);
//   const lastId = useRef(s.ev?.id); // ignore the announcement that existed on load
//   const seeded = useRef(false);

//   useEffect(() => {
//     if (sync.status === "connecting") return; // wait for the first snapshot so an old announcement is not replayed
//     if (!seeded.current) {
//       seeded.current = true;
//       lastId.current = s.ev?.id;
//       return;
//     }
//     const e = s.ev;
//     if (!e || e.id === lastId.current) return;
//     lastId.current = e.id;
//     if (e.type === "say") {
//       // a voice test sent from the control page: speak only, no overlay
//       if (startedRef.current) speak(e.text);
//       return;
//     }
//     setEv(e);
//     setTimeout(
//       () => setEv((cur) => (cur?.id === e.id ? null : cur)),
//       e.type === "call" ? 9000 : 8000,
//     );
//     if (s.voice && startedRef.current) speak(spokenText(e)); // queued; the ads are lowered while it speaks
//   }, [s.ev?.id, sync.status]); // eslint-disable-line react-hooks/exhaustive-deps

//   const start = () => {
//     startedRef.current = true;
//     setStarted(true);
//     document.documentElement.requestFullscreen?.().catch(() => {});
//     unlock(); // browsers allow speech only after a tap
//   };

//   // TV layout: header / [ads panel | courts] / scrolling announcements
//   const showAds = s.adsOn !== false && (s.ads || []).length > 0;
//   const adsPct = s.adsPct || 30;
//   const hasTicker = (s.announcements || []).length > 0;
//   const ups = units(s); // waiting players; fixed partners show together
//   const hubDoc = useHub().doc; // the venue name is the TV title unless one is set on TV & ads
//   const mainW = 100 - 4 - (showAds ? adsPct + 2 : 0); // vw left for the courts
//   // Vertical courts: one row up to 5 courts (4 with the ads panel), two rows beyond; sized to always fit
//   const n = s.courts.length;
//   const rows = n > (showAds ? 4 : 5) ? 2 : 1;
//   const perRow = Math.ceil(n / rows);
//   const maxH = (rows === 2 ? 24 : 50) + (hasTicker ? 0 : 6);
//   const courtH = `min(${maxH}vh, calc((${mainW}vw - ${perRow * 3.4}vh - ${(perRow - 1) * 2}vw) / ${perRow} * 2.2))`;
//   const clock = new Date().toLocaleTimeString([], {
//     hour: "numeric",
//     minute: "2-digit",
//   });
//   return (
//     <div className="tv">
//       {!started && (
//         <button className="tv-start" onClick={start}>
//           ▶ Tap to start TV display
//         </button>
//       )}
//       <header className="tv-head">
//         <b>🏸 {(s.club || (hubDoc && hubDoc.name) || s.sport).toUpperCase()}</b>
//         <span>
//           {s.club ? `${s.sport} · ` : ""}
//           {clock} · {s.q.length} {s.q.length === 1 ? "player" : "players"}{" "}
//           waiting{sync.status === "error" ? " · ⚠ sync lost" : ""}
//         </span>
//       </header>
//       <div className="tv-body">
//         {showAds && (
//           <aside className="tv-ads" style={{ width: `${adsPct}vw` }}>
//             <AdPanel
//               ads={s.ads}
//               sound={!!s.adSound && started}
//               fill={!!s.adFill}
//               volume={
//                 isSpeaking && s.speech?.duck !== false
//                   ? (s.speech?.duckLevel ?? 0.15)
//                   : 1
//               }
//             />
//           </aside>
//         )}
//         <main className="tv-main">
//           {shown === "schedule" ? (
//             <ScheduleView sessions={upcoming} />
//           ) : shown === "stats" ? (
//             <StatsView stats={s.stats} pairs={s.pairs} />
//           ) : (
//             <>
//               <div className="tv-grid" style={{ "--ch": courtH }}>
//                 {s.courts.map((c) => (
//                   <PickleballCourt
//                     key={c.n}
//                     court={c}
//                     rental={activeBooking(s, c.n)}
//                     next={nextBooking(s, c.n)}
//                     limit={s.gameMinutes || 0}
//                   />
//                 ))}
//               </div>
//               <div className="tv-next">
//                 <b>Up next:</b>{" "}
//                 {ups.length
//                   ? ups.slice(0, 12).map((u, i) => {
//                       const w = fmtWaitShort(
//                         Math.min(...u.idx.map((k) => s.q[k].at ?? Infinity)),
//                       );
//                       return (
//                         <span key={i}>
//                           {i + 1}. {u.idx.map((k) => s.q[k].n).join(" & ")}
//                           {w ? ` · ${w}` : ""}
//                         </span>
//                       );
//                     })
//                   : "—"}
//                 {ups.length > 12 && <span>+{ups.length - 12} more</span>}
//               </div>
//             </>
//           )}
//         </main>
//       </div>
//       {hasTicker && (
//         <Ticker items={s.announcements} speed={s.tickerSpeed || 12} />
//       )}
//       {ev && <Announcement ev={ev} sport={s.sport} />}
//     </div>
//   );
// }
export function TvPage() {
  const [s, , sync] = useCourtStore({ readOnly: true });
  const { hub } = useAuth(); // Access current hub document
  useClockTick();
  const { speak, unlock, isSpeaking } = useSpeech(s.speech);
  const [started, setStarted] = useState(false);
  const [ev, setEv] = useState(null);
  const [view, setView] = useState('courts');
  const upcoming = upcomingSessions(s.schedule || []);
  const showSchedule = s.rotate && upcoming.length > 0;
  const showStats = s.showStats !== false && hasStats(s.stats);
  const order = ['courts', ...(showSchedule ? ['schedule'] : []), ...(showStats ? ['stats'] : [])];
  const orderKey = order.join();
  const shown = order.includes(view) ? view : 'courts';

  useEffect(() => {
    if (order.length < 2) {
      setView('courts');
      return undefined;
    }
    const t = setTimeout(() => setView((v) => order[(order.indexOf(v) + 1) % order.length]), VIEW_MS[shown] ?? 12000);
    return () => clearTimeout(t);
  }, [shown, orderKey]);

  const startedRef = useRef(false);
  const lastId = useRef(s.ev?.id);
  const seeded = useRef(false);

  useEffect(() => {
    if (sync.status === 'connecting') return;
    if (!seeded.current) {
      seeded.current = true;
      lastId.current = s.ev?.id;
      return;
    }
    const e = s.ev;
    if (!e || e.id === lastId.current) return;
    lastId.current = e.id;
    if (e.type === 'say') {
      if (startedRef.current) speak(e.text);
      return;
    }
    setEv(e);
    setTimeout(() => setEv((cur) => (cur?.id === e.id ? null : cur)), e.type === 'call' ? 9000 : 8000);
    if (s.voice && startedRef.current) speak(spokenText(e));
  }, [s.ev?.id, sync.status]);

  const start = () => {
    startedRef.current = true;
    setStarted(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
    unlock();
  };

  const showAds = s.adsOn !== false && (s.ads || []).length > 0;
  const adsPct = s.adsPct || 30;
  const hasTicker = (s.announcements || []).length > 0;
  const ups = units(s);
  const mainW = 100 - 4 - (showAds ? adsPct + 2 : 0);
  const n = s.courts.length;
  const rows = n > (showAds ? 4 : 5) ? 2 : 1;
  const perRow = Math.ceil(n / rows);
  const maxH = (rows === 2 ? 24 : 50) + (hasTicker ? 0 : 6);
  const courtH = `min(${maxH}vh, calc((${mainW}vw - ${perRow * 3.4}vh - ${(perRow - 1) * 2}vw) / ${perRow} * 2.2))`;
  const clock = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Resolve active hub logo or fallback
  const logo = hub?.logoUrl || s.clubLogo;

  return (
    <div className="tv">
      {!started && <button className="tv-start" onClick={start}>▶ Tap to start TV display</button>}
      <header className="tv-head">
        <b style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          {logo ? (
            <img
              src={logo}
              alt="Hub Logo"
             className="logo"
              
            />
          ) : (
            <span>🏸</span>
          )}
          {(s.club || hub?.name || s.sport).toUpperCase()}
        </b>
        <span>
          {s.club ? `${s.sport} · ` : ''}
          {clock} · {s.q.length} {s.q.length === 1 ? 'player' : 'players'} waiting
          {sync.status === 'error' ? ' · ⚠ sync lost' : ''}
        </span>
      </header>
      <div className="tv-body">
        {showAds && (
          <aside className="tv-ads" style={{ width: `${adsPct}vw` }}>
            <AdPanel
              ads={s.ads}
              sound={!!s.adSound && started}
              fill={!!s.adFill}
              volume={isSpeaking && s.speech?.duck !== false ? (s.speech?.duckLevel ?? 0.15) : 1}
            />
          </aside>
        )}
        <main className="tv-main">
          {shown === 'schedule' ? (
            <ScheduleView sessions={upcoming} />
          ) : shown === 'stats' ? (
            <StatsView stats={s.stats} pairs={s.pairs} />
          ) : (
            <>
              <div className="tv-grid" style={{ '--ch': courtH }}>
                {s.courts.map((c) => (
                  <PickleballCourt
                    key={c.n}
                    court={c}
                    rental={activeBooking(s, c.n)}
                    next={nextBooking(s, c.n)}
                    limit={s.gameMinutes || 0}
                  />
                ))}
              </div>
              <div className="tv-next">
                <b>Up next:</b>{' '}
                {ups.length
                  ? ups.slice(0, 12).map((u, i) => {
                      const w = fmtWaitShort(Math.min(...u.idx.map((k) => s.q[k].at ?? Infinity)));
                      return (
                        <span key={i}>
                          {i + 1}. {u.idx.map((k) => s.q[k].n).join(' & ')}
                          {w ? ` · ${w}` : ''}
                        </span>
                      );
                    })
                  : '—'}
                {ups.length > 12 && <span>+{ups.length - 12} more</span>}
              </div>
            </>
          )}
        </main>
      </div>
      {hasTicker && <Ticker items={s.announcements} speed={s.tickerSpeed || 12} />}
      {ev && <Announcement ev={ev} sport={s.sport} />}
    </div>
  );
}
/* =====================================================================
   Control page: route it at e.g. /queue
   ===================================================================== */
export function ControlPage() {
  const hh = useHubHref();
  const [s, update] = useCourtStore();
  useClockTick();
  const [text, setText] = useState("");
  const [asPair, setAsPair] = useState(false); // the two names typed are partners for today
  const [pa, setPa] = useState("");
  const [pb, setPb] = useState("");
  const [pmode, setPmode] = useState("session"); // how long a new pair lasts
  const roster = useCollection("players"); // saved players (staff only), used for levels and suggestions
  const set = (patch) => update((x) => ({ ...x, ...patch }));

  const addPlayers = (picked) => {
    const names = (typeof picked === "string" ? picked : text)
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!names.length) return;
    const mk = (n) => {
      const p = roster.find(
        (r) => (r.name || "").trim().toLowerCase() === n.toLowerCase(),
      );
      return p
        ? {
            n: p.name,
            lvl: levelNum(playerLevel(p)),
            lv: playerLevel(p),
            at: Date.now(),
          }
        : { n, at: Date.now() };
    };
    update((x) => {
      const next = { ...x, q: [...x.q, ...names.map(mk)] };
      return asPair && typeof picked !== "string" && names.length === 2
        ? pairUp(next, names[0], names[1])
        : next;
    });
    if (typeof picked !== "string") setText("");
  };

  const finish = (ci, winner) => {
    update((x) => finishMatch(x, ci, winner));
    setTimeout(() => {
      update((x) =>
        x.auto && !x.courts[ci]?.m && x.q.length >= 4 ? callMatch(x, ci) : x,
      );
    }, AUTO_CALL_DELAY);
  };

  const move = (i) =>
    update((x) => {
      const q = [...x.q];
      [q[i - 1], q[i]] = [q[i], q[i - 1]];
      return { ...x, q };
    });

  const nextUp = pick(s);
  // everyone who could be paired: waiting, playing, or saved
  const known = Array.from(
    new Map(
      [
        ...s.q.map((p) => p.n),
        ...s.courts.flatMap((c) => (c.m ? [...c.m.p1, ...c.m.p2] : [])),
        ...roster.map((r) => r.name),
      ]
        .filter(Boolean)
        .map((n) => [norm(n), n]),
    ).values(),
  ).sort((a, b) => a.localeCompare(b));
  const preview = !nextUp
    ? "Need 4 players waiting"
    : s.mode === "rand"
      ? "Random draw of 4 players"
      : `Next: ${nextUp
          .flatMap((u) => u.idx)
          .map((i) => s.q[i].n)
          .join(", ")}`;

  return (
    <div className="cq">
      <div className="cq-head">
        <h1>Queue &amp; courts</h1>
       
      </div>
      
      <div className="cq-card">
        <h2>Add players</h2>
        <div className="cq-row">
          <input
            type="text"
            value={text}
            placeholder="Names, comma separated: Anna, Ben, Cara"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlayers()}
          />
          <button className="primary" onClick={addPlayers}>
            Add
          </button>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={asPair}
              onChange={(e) => setAsPair(e.target.checked)}
            />{" "}
            The 2 names are partners for the session
          </label>
          {roster.length > 0 && (
            <select
              value=""
              aria-label="Add a saved player"
              onChange={(e) => e.target.value && addPlayers(e.target.value)}
            >
              <option value="">+ Saved player…</option>
              {roster
                .filter(
                  (r) =>
                    !s.q.some(
                      (x) =>
                        (x.n || "").toLowerCase() ===
                        (r.name || "").toLowerCase(),
                    ),
                )
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                    {playerLevel(r) ? ` · ${playerLevel(r)}` : ""}
                  </option>
                ))}
            </select>
          )}
         
        </div>
        <div className="cq-row" style={{ marginTop: 10 }}>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.voice}
              onChange={(e) => set({ voice: e.target.checked })}
            />{" "}
            Voice on TV
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.auto}
              onChange={(e) => set({ auto: e.target.checked })}
            />{" "}
            Auto-call next match
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.rejoin}
              onChange={(e) => set({ rejoin: e.target.checked })}
            />{" "}
            Players rejoin after a match
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.rotate}
              onChange={(e) => set({ rotate: e.target.checked })}
            />{" "}
            Show schedule on TV
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.showStats !== false}
              onChange={(e) => set({ showStats: e.target.checked })}
            />{" "}
            Show player stats on TV
          </label>
         
        </div>
      </div>

      <div className="cq-card">
        <h2>Partners</h2>
        <div className="cq-row">
          <select
            value={pa}
            onChange={(e) => setPa(e.target.value)}
            aria-label="First partner"
            style={{ width: 250, maxWidth: 500 }}
          >
            <option value="">Player…</option>
            {known.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <span className="cq-mut">with</span>
          <select
            value={pb}
            onChange={(e) => setPb(e.target.value)}
            aria-label="Second partner"
            
            style={{ width: 250, maxWidth: 500 }}
          >
            <option value="">Partner…</option>
            {known
              .filter((n) => n !== pa)
              .map((n) => (
                <option key={n}>{n}</option>
              ))}
          </select>
          <select
            value={pmode}
            onChange={(e) => setPmode(e.target.value)}
            aria-label="How long"
                  style={{ width: 250, maxWidth: 500 }}
          >
            <option value="session">Rest of the queue session</option>
            <option value="once">Next match only</option>
          </select>
          <button
            className="primary"
            disabled={!pa || !pb || pa === pb}
            onClick={() => {
              update((x) => pairUp(x, pa, pb, pmode));
              setPa("");
              setPb("");
            }}
          >
            Pair up
          </button>
        </div>
        {activePairs(s).length === 0 && (
          <div className="cq-mut" style={{ marginTop: 10 }}>
            No fixed partners. Everyone gets a random partner each match.
          </div>
        )}
        {activePairs(s).map(([a, b, mode]) => (
          <div className="cq-item" key={`${a}|${b}`}>
            <span>
              🤝 <b>{a}</b> &amp; <b>{b}</b>{" "}
              <span className="cq-mut">
                · {mode === "once" ? "next match only" : "rest of the session"}
              </span>
            </span>
            <button
              className="small"
              onClick={() => update((x) => unpair(x, a))}
            >
              Unpair
            </button>
          </div>
        ))}
        <div className="cq-row" style={{ marginTop: 10 }}>
          {activePairs(s).length > 0 && (
            <button
              className="small"
              onClick={() =>
                window.confirm(
                  "End the queue session? All fixed partners are cleared.",
                ) && update(endSession)
              }
            >
              End session (clear partners)
            </button>
          )}
        </div>
        <div className="cq-mut" style={{ marginTop: 8 }}>
          <b>Rest of the queue session</b>: the pair plays on the same team for
          every match and waits in the queue together, until you unpair them,
          end the session, or the day ends.
          <b> Next match only</b>: they are partners for their next match, then
          go back to random partners.
        </div>
      </div>

      <div className="cq-card">
        <h2>Courts</h2>
        <div className="cq-mut" style={{ marginBottom: 10 }}>
          Used for the queue:{" "}
          {s.courts
            .filter((c) => !activeBooking(s, c.n))
            .map((c) => `Court ${c.n}`)
            .join(", ") || "none"}
          {s.courts.some((c) => activeBooking(s, c.n)) &&
            ` · Rented now: ${s.courts
              .filter((c) => activeBooking(s, c.n))
              .map((c) => `Court ${c.n}`)
              .join(", ")}`}
          {" · "}Set up rentals on the Rentals page.
        </div>
        <div className="cq-courts">
          {s.courts.map((c, i) => {
            const rb = activeBooking(s, c.n);
            const nb = nextBooking(s, c.n);
            return (
              <div className="cq-court" key={c.n}>
                <div style={{ marginBottom: 8 }}>
                  <b>
                    Court {c.n} · {c.m ? "Playing" : rb ? "Rented" : "Free"}
                  </b>
                </div>
                {c.m ? (
                  <>
                    <div>{c.m.p1.join(" & ")}</div>
                    <div className="cq-mut">vs</div>
                    <div>{c.m.p2.join(" & ")}</div>
                    {c.m.startedAt && (
                      <div style={{ marginTop: 6 }}>
                        <GameTimer
                          since={c.m.startedAt}
                          limit={s.gameMinutes || 0}
                        />
                      </div>
                    )}
                    <div className="cq-row" style={{ marginTop: 10 }}>
                      <button onClick={() => finish(i, 1)}>
                        🏆 {c.m.p1.join(" & ")}
                      </button>
                      <button onClick={() => finish(i, 2)}>
                        🏆 {c.m.p2.join(" & ")}
                      </button>
                      <button
                        className="small"
                        onClick={() => update((x) => cancelMatch(x, i))}
                      >
                        Cancel match
                      </button>
                    </div>
                  </>
                ) : rb ? (
                  <div className="cq-mut">
                    Rented {fmtTime(rb.start)} – {fmtTime(rb.end)}
                    {rb.name ? ` · ${rb.name}` : ""}. Not used for the queue.
                  </div>
                ) : (
                  <>
                    <div className="cq-mut">{preview}</div>
                    <div style={{ marginTop: 10 }}>
                      <button
                        className="primary"
                        disabled={!nextUp}
                        onClick={() => update((x) => callMatch(x, i))}
                      >
                        Call match
                      </button>
                    </div>
                  </>
                )}
                {nb && (
                  <div className="cq-mut" style={{ marginTop: 8 }}>
                    Next rental today: {fmtTime(nb.start)} – {fmtTime(nb.end)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
          <div className="cq-row" style={{ marginTop: 20, marginBottom: 10   }}>
             
    <div className="cq-row" style={{ marginTop: 10, flexWrap: "wrap", gap: 20 }}>
       <label className="cq-check">
            Game time (min, 0 = no limit){" "}
            <input
              type="number"
              min={0}
              max={90}
              value={s.gameMinutes || 0}
              onChange={(e) =>
                set({ gameMinutes: Math.max(0, +e.target.value || 0) })
              }
              style={{ width: 70 }}
            />
          </label>
          <select
            value={s.mode}
            onChange={(e) => set({ mode: e.target.value })}
            style={{ width: "auto", maxWidth: 400 }}
            aria-label="How to pick the next match"
          >
            <option value="fifo">Next 4 in line</option>
            <option value="rand">Random 4</option>
            <option value="level">Similar levels</option>
            <option value="wl">Winners with winners, losers with losers</option>
          </select>
           <button onClick={() => update((x) => ({ ...x, q: shuffle(x.q) }))}>
            Shuffle list
          </button>
          <button
            onClick={() =>
              update((x) => ({
                ...x,
                q: [],
                courts: x.courts.map((c) => ({ ...c, m: null })),
                ev: null,
              }))
            }
          >
            Reset all
          </button>
         
       </div>
 
          </div>
      </div>

      <div className="cq-card">
        <h2>Players waiting ({s.q.length})</h2>
        {s.q.length === 0 && (
          <div className="cq-mut">No players waiting. Add some above.</div>
        )}
        {s.q.map((p, i) => (
          <div className="cq-item" key={`${p.n}-${i}`}>
            <span>
              <span className="cq-mut">{i + 1}&nbsp;&nbsp;</span>
              {p.n}
              {p.lv && <span className={`lv lv-${p.lvl}`}>{p.lv}</span>}
              {mateOf(s, p.n) && (
                <span className="cq-mut"> 🤝 {mateOf(s, p.n)}</span>
              )}
              {p.at ? (
                <span className="cq-mut"> · ⏳ {fmtWait(p.at)}</span>
              ) : null}
              {p.r && (
                <span className="cq-mut">
                  {" "}
                  ({p.r === "W" ? "🏆 won" : "lost"})
                </span>
              )}
            </span>
            <span>
              <button
                className="small"
                disabled={!i}
                onClick={() => move(i)}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                className="small"
                onClick={() =>
                  update((x) => ({ ...x, q: x.q.filter((_, k) => k !== i) }))
                }
                aria-label="Remove"
              >
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
