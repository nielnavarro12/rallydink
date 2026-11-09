import { useEffect, useState } from "react";
import { getHub } from "../data/index.js";
import { recordResult } from "../stats/stats.js";
import { initial } from "./initial";

/* =====================================================================
   Court queue state and logic (pure functions: state in, state out)

   Rentals (bookings):
     { id, court, date: 'YYYY-MM-DD', start: 'HH:MM', end: 'HH:MM', name, note,
       startAt, endAt }              <- real timestamps (ms), added by makeBooking

   A booking may run past midnight (e.g. 23:00 to 02:00 the next day). The
   start/end strings are what the user typed; startAt/endAt are what the logic
   uses, so every comparison works across midnight.

   A court is rented right now when one of its bookings covers the current
   time. Courts without an active booking are open play courts and are used by
   the queue.
   ===================================================================== */

/* ---------- constants ---------- */
export const OPEN_MIN = 6 * 60; // first bookable start (06:00)
export const CLOSE_MIN = 29 * 60; // last possible end; above 24*60 means after midnight (26:00 = 02:00 next day)
export const SLOT = 30; // minutes per booking slot
const DAY_MIN = 24 * 60;
const TEAM_SIZE = 4; // players needed for one match
export const VIEW_MS = { courts: 5000, schedule: 5000, stats: 25000 }; // how long each TV screen stays
export const AUTO_CALL_DELAY = 8500; // let the congratulations screen finish first

/* ---------- persistence ---------- */
export const keyOf = () => `court-queue-state-v1:${getHub()}`;
export const chanOf = () => `court-queue:${getHub()}`;
export const strip = ({ bookings, schedule, ...rest }) => rest; // eslint-disable-line no-unused-vars
export const load = () => {
  try {
    return strip({ ...initial, ...JSON.parse(localStorage.getItem(keyOf())) });
  } catch {
    return initial;
  }
};

// Re-render every 30 s so rentals start/expire on screen without a refresh.
export function useClockTick() {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
}

/* =====================================================================
   Time helpers
   ===================================================================== */
export const pad = (n) => String(n).padStart(2, "0");
export const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
export const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const nowStr = () => {
  const d = new Date();
  return `${todayStr()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return iso === todayStr() ? `Today · ${label}` : label;
};
// accepts "HH:MM" and values past midnight such as "26:00" (shown as 2:00 AM)
export const fmtTime = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

// timestamp for `min` minutes after midnight of `date`; min above 1440 rolls into the next day
const atMin = (date, min) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 0, min).getTime();
};

/* =====================================================================
   Bookings
   ===================================================================== */
// Build a booking with real timestamps. An end at or before the start means "next day".
export const makeBooking = (b) => {
  const startAt = atMin(b.date, toMin(b.start));
  let endAt = atMin(b.date, toMin(b.end));
  if (endAt <= startAt) endAt = atMin(b.date, toMin(b.end) + DAY_MIN);
  return { ...b, startAt, endAt };
};

// Timestamps for any booking, including old ones saved without them.
export const bookingSpan = (b) => (b.startAt != null ? b : makeBooking(b));

// True when the booking ends on a later day than it starts (show "+1 day" in the UI).
export const endsNextDay = (b) => bookingSpan(b).endAt > atMin(b.date, DAY_MIN);

const clash = (a, b) => {
  const x = bookingSpan(a);
  const y = bookingSpan(b);
  return x.court === y.court && x.startAt < y.endAt && y.startAt < x.endAt;
};

// Bookings that overlap `date`, including ones that started the night before.
export const bookingsOn = (s, date, court) => {
  const from = atMin(date, 0);
  const to = atMin(date, DAY_MIN);
  return (s.bookings || [])
    .map(bookingSpan)
    .filter(
      (b) =>
        (court == null || b.court === court) && b.startAt < to && b.endAt > from,
    );
};

export const activeBooking = (s, court) => {
  const t = Date.now();
  return (s.bookings || [])
    .map(bookingSpan)
    .find((b) => b.court === court && b.startAt <= t && t < b.endAt);
};

export const nextBooking = (s, court) => {
  const t = Date.now();
  return bookingsOn(s, todayStr(), court)
    .filter((b) => b.startAt > t)
    .sort((x, y) => x.startAt - y.startAt)[0];
};

export const bookingConflict = (s, b) =>
  (s.bookings || []).find((x) => clash(x, b));

export const isPastBooking = (b) => bookingSpan(b).endAt < Date.now();

export function addBooking(s, b) {
  if (bookingConflict(s, b)) return s;
  return {
    ...s,
    bookings: [...(s.bookings || []), { id: Date.now(), ...makeBooking(b) }],
  };
}

export const removeBooking = (s, id) => ({
  ...s,
  bookings: (s.bookings || []).filter((b) => b.id !== id),
});

/* ---------- sessions (anything with date/start/end) ---------- */
export const sortSessions = (a) =>
  [...a].sort((x, y) => bookingSpan(x).startAt - bookingSpan(y).startAt);
export const isUpcoming = (x) => bookingSpan(x).endAt >= Date.now();
export const upcomingSessions = (a) => sortSessions(a.filter(isUpcoming));

/* =====================================================================
   Names, partners and waiting time
   ===================================================================== */
export const norm = (n) => String(n || "").trim().toLowerCase();
const pairKey = (a, b) => [norm(a), norm(b)].sort().join("|");

export const activePairs = (s) =>
  s.partners && s.partners.date === todayStr() ? s.partners.list : [];

const withPairs = (s, list) => ({
  ...s,
  partners: { date: todayStr(), list },
});

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
  return withPairs(s, [...keep, [a, b, mode === "once" ? "once" : "session"]]);
}

export function unpair(s, name) {
  const k = norm(name);
  return withPairs(
    s,
    activePairs(s).filter(([x, y]) => norm(x) !== k && norm(y) !== k),
  );
}

// end the queue session: every fixed partnership is cleared
export const endSession = (s) => withPairs(s, []);

export const waitMin = (at) =>
  Number.isFinite(at)
    ? Math.max(0, Math.floor((Date.now() - at) / 60000))
    : null;

export const fmtWait = (at) => {
  const m = waitMin(at);
  if (m === null) return "";
  if (m < 1) return "just joined";
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${pad(m % 60)} min`;
};

export const fmtWaitShort = (at) => {
  const m = waitMin(at);
  if (m === null) return "";
  if (m < 1) return "new";
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${pad(m % 60)}`;
};

export const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/* =====================================================================
   Queue: units and picking the next match
   ===================================================================== */
// A unit is one waiting player, or two fixed partners waiting together.
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

// Choose units whose sizes add up to exactly `need` players, in order. Returns null if impossible.
export const fill = (us, need = TEAM_SIZE, start = 0) => {
  if (need === 0) return [];
  for (let i = start; i < us.length; i++) {
    const size = us[i].idx.length;
    if (size <= need) {
      const rest = fill(us, need - size, i + 1);
      if (rest) return [us[i], ...rest];
    }
  }
  return null;
};

export const pick = (s) => {
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
    if (group.reduce((n, u) => n + u.idx.length, 0) >= TEAM_SIZE) us = group;
  }
  return fill(us);
};

/* =====================================================================
   Matches
   ===================================================================== */
const setCourt = (s, ci, m) =>
  s.courts.map((c, i) => (i === ci ? { ...c, m } : c));

// players going back to the front of the queue
const toQueue = (names) => names.map((n) => ({ n, at: Date.now() }));

// fixed partners stay a team; everyone else gets a random partner
function buildTeams(s, chosen) {
  const teams = chosen
    .filter((u) => u.idx.length === 2)
    .map((u) => u.idx.map((i) => s.q[i].n));
  const singles = shuffle(
    chosen.filter((u) => u.idx.length === 1).map((u) => s.q[u.idx[0]].n),
  );
  for (let k = 0; k < singles.length; k += 2)
    teams.push([singles[k], singles[k + 1]]);
  return shuffle(teams);
}

export function callMatch(s, ci) {
  const c = s.courts[ci];
  if (c.m || activeBooking(s, c.n)) return s;
  const chosen = pick(s);
  if (!chosen) return s;

  const ids = chosen.flatMap((u) => u.idx);
  const [p1, p2] = buildTeams(s, chosen);

  // a pair made for "next match only" is used up by this match
  const used = new Set(
    chosen
      .filter((u) => u.idx.length === 2)
      .map((u) => pairKey(s.q[u.idx[0]].n, s.q[u.idx[1]].n)),
  );
  const before = activePairs(s);
  const left = before.filter(
    ([x, y, mode]) => !(mode === "once" && used.has(pairKey(x, y))),
  );

  return {
    ...(left.length !== before.length ? withPairs(s, left) : s),
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
  const at = Date.now();
  return {
    ...s,
    q: s.rejoin
      ? [
          ...s.q,
          ...win.map((n) => ({ n, r: "W", at })),
          ...lose.map((n) => ({ n, r: "L", at })),
        ]
      : s.q,
    courts: setCourt(s, ci, null),
    // player stats; recordResult must return an object (or {}) that is safe to spread into state
    ...recordResult(s, { court: c.n, win, lose, date: todayStr() }),
    ev: { id: at, type: "win", court: c.n, win },
  };
}

export const cancelMatch = (s, ci) => {
  const m = s.courts[ci].m;
  if (!m) return s;
  return {
    ...s,
    q: [...toQueue([...m.p1, ...m.p2]), ...s.q],
    courts: setCourt(s, ci, null),
  };
};

export const resizeCourts = (s, count) => {
  let courts = s.courts.slice(0, count);
  let q = s.q;
  s.courts.slice(count).forEach((c) => {
    if (c.m) q = [...toQueue([...c.m.p1, ...c.m.p2]), ...q];
  });
  while (courts.length < count)
    courts = [...courts, { n: courts.length + 1, m: null }];
  return { ...s, courts, q };
};

export const spokenText = (ev) =>
  ev.type === "call"
    ? `Now calling. Court ${ev.court}. ${ev.p1.join(" and ")}, versus ${ev.p2.join(" and ")}. Please proceed to court ${ev.court}.`
    : `Congratulations ${ev.win.join(" and ")}! Great match.`;

    // Next `count` groups of 4 names, e.g. 2 courts gives 8 players.
export const nextGroups = (s, count = 2) => {
  const groups = [];
  let sim = s;
  for (let k = 0; k < count; k++) {
    const up = pick(sim);
    if (!up) break;
    const idxs = up.flatMap((u) => u.idx);
    groups.push(idxs.map((i) => sim.q[i].n));
    sim = { ...sim, q: sim.q.filter((_, i) => !idxs.includes(i)) };
  }
  return groups;
};