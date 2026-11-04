import { useEffect, useState } from "react";

import { data, getHub } from "../data/index.js";
/* =====================================================================
   Rentals (bookings): { id, court, date: 'YYYY-MM-DD', start: 'HH:MM', end: 'HH:MM', name, note }
   A court is rented right now when one of its bookings covers the current time.
   Courts without an active booking are open play courts and are used by the queue.
   ===================================================================== */
   import { initial } from "./initial";
export const OPEN_MIN = 1 * 60; // first bookable time (06:00)
export const CLOSE_MIN = 25* 60; // last possible end time (22:00)
export const SLOT = 30; // minutes per booking slot

export const load = () => {
  try {
    return strip({ ...initial, ...JSON.parse(localStorage.getItem(keyOf())) });
  } catch {
    return initial;
  }
};
export const strip = ({ bookings, schedule, ...rest }) => rest; // eslint-disable-line no-unused-vars

export const keyOf = () => `court-queue-state-v1:${getHub()}`;
export const chanOf = () => `court-queue:${getHub()}`;

// Re-render every 30 s so rentals start/expire on screen without a refresh.
export function useClockTick() {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
};
export const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
export const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

//================================
// BOOKING
//================================

export const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
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

export const spokenText = (ev) =>
  ev.type === "call"
    ? `Now calling. Court ${ev.court}. ${ev.p1.join(" and ")}, versus ${ev.p2.join(" and ")}. Please proceed to court ${ev.court}.`
    : `Congratulations ${ev.win.join(" and ")}! Great match.`;


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
    
    export const cancelMatch = (s, ci) => {
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