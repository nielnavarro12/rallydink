/* Player statistics (wins / losses).
   state.stats   = { [nameKey]: { name, w, l, days: { 'YYYY-MM-DD': [wins, losses] } } }
                   w / l are all-time totals; `days` keeps the last KEEP_DAYS days for "today / 7 days / 30 days" views.
   state.pairs   = { 'keyA|keyB': { names: [a, b], w, l, d, dw, dl } }
                   partner combinations: all-time totals plus today's counters (dw / dl belong to the date `d`).
   state.results = the most recent matches (newest first), used to fix a wrongly entered winner. */
const KEEP_DAYS = 90;
const KEEP_RESULTS = 40;
const MIN_GAMES_HIGHLIGHT = 2; // games needed to be "player of the day" / "best pair"

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const localDate = () => fmt(new Date());
const shiftDate = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  return fmt(new Date(y, m - 1, d + n));
};

export const playerKey = (n) => String(n).trim().toLowerCase();

// add `delta` (+1 / -1) to wins (idx 0) or losses (idx 1) for every name, on `date` and in the totals
function bump(stats, names, date, idx, delta) {
  const next = { ...stats };
  names.forEach((name) => {
    const k = playerKey(name);
    const e = next[k] ? { ...next[k], days: { ...next[k].days } } : { name, w: 0, l: 0, days: {} };
    e.name = name; // keep the latest spelling
    if (idx === 0) e.w = Math.max(0, e.w + delta);
    else e.l = Math.max(0, e.l + delta);
    const day = [...(e.days[date] || [0, 0])];
    day[idx] = Math.max(0, day[idx] + delta);
    if (day[0] === 0 && day[1] === 0) delete e.days[date];
    else e.days[date] = day;
    if (e.w === 0 && e.l === 0 && Object.keys(e.days).length === 0) delete next[k];
    else next[k] = e;
  });
  return next;
}

// same for a partner pair; only pairs played today keep "today" counters
function bumpPair(pairs, names, date, idx, delta) {
  const k = names.map(playerKey).sort().join('|');
  const e = { ...(pairs[k] || { names: [...names], w: 0, l: 0, d: date, dw: 0, dl: 0 }) };
  e.names = [...names];
  const isToday = date === localDate();
  if (isToday && e.d !== date && delta > 0) { e.d = date; e.dw = 0; e.dl = 0; } // a new day starts fresh
  if (idx === 0) e.w = Math.max(0, e.w + delta);
  else e.l = Math.max(0, e.l + delta);
  if (isToday && e.d === date) {
    if (idx === 0) e.dw = Math.max(0, (e.dw || 0) + delta);
    else e.dl = Math.max(0, (e.dl || 0) + delta);
  }
  const next = { ...pairs };
  if (e.w + e.l === 0) delete next[k];
  else next[k] = e;
  return next;
}

// drop per-day detail older than KEEP_DAYS (all-time totals are kept)
function prune(stats, today) {
  const from = shiftDate(today, -KEEP_DAYS);
  const out = {};
  Object.entries(stats).forEach(([k, e]) => {
    const days = {};
    Object.entries(e.days || {}).forEach(([d, v]) => { if (d >= from) days[d] = v; });
    out[k] = { ...e, days };
  });
  return out;
}

const addMatch = (s, win, lose, date, sign) => ({
  stats: bump(bump(s.stats || {}, win, date, 0, sign), lose, date, 1, sign),
  pairs: bumpPair(bumpPair(s.pairs || {}, win, date, 0, sign), lose, date, 1, sign),
});

/* Called when a match ends: returns { stats, pairs, results } to merge into the state. */
export function recordResult(s, { court, win, lose, date }) {
  const { stats, pairs } = addMatch(s, win, lose, date, 1);
  const rec = { id: Date.now(), ts: Date.now(), date, court, win, lose };
  return { stats: prune(stats, date), pairs, results: [rec, ...(s.results || [])].slice(0, KEEP_RESULTS) };
}

const findResult = (s, id) => (s.results || []).find((r) => r.id === id);

export function undoResult(s, id) {
  const r = findResult(s, id);
  if (!r) return s;
  return { ...s, ...addMatch(s, r.win, r.lose, r.date, -1), results: s.results.filter((x) => x.id !== id) };
}

// the other pair actually won: move the win and the loss
export function swapResult(s, id) {
  const r = findResult(s, id);
  if (!r) return s;
  const base = undoResult(s, id);
  const swapped = { ...r, win: r.lose, lose: r.win };
  return { ...base, ...addMatch(base, swapped.win, swapped.lose, r.date, 1), results: s.results.map((x) => (x.id === id ? swapped : x)) };
}

export function resetDay(s, date) {
  const stats = {};
  Object.entries(s.stats || {}).forEach(([k, e]) => {
    const d = e.days && e.days[date];
    if (!d) { stats[k] = e; return; }
    const days = { ...e.days };
    delete days[date];
    const w = Math.max(0, e.w - d[0]);
    const l = Math.max(0, e.l - d[1]);
    if (w + l > 0 || Object.keys(days).length) stats[k] = { ...e, w, l, days };
  });
  const pairs = {};
  Object.entries(s.pairs || {}).forEach(([k, e]) => {
    if (e.d !== date || !(e.dw || e.dl)) { pairs[k] = e; return; }
    const w = Math.max(0, e.w - (e.dw || 0));
    const l = Math.max(0, e.l - (e.dl || 0));
    if (w + l > 0) pairs[k] = { ...e, w, l, dw: 0, dl: 0 };
  });
  return { ...s, stats, pairs, results: (s.results || []).filter((r) => r.date !== date) };
}
export const resetAll = (s) => ({ ...s, stats: {}, pairs: {}, results: [] });

export const hasStats = (stats) => Object.values(stats || {}).some((e) => e.w + e.l > 0);

const byWins = (a, b) => b.w - a.w || b.pct - a.pct || a.l - b.l || a.name.localeCompare(b.name);
const byNet = (a, b) => (b.w - b.l) - (a.w - a.l) || b.w - a.w || a.l - b.l || a.name.localeCompare(b.name);
const row = (key, name, w, l) => ({ key, name, w, l, games: w + l, pct: Math.round((w / (w + l)) * 100) });

/* Leaderboard rows. scope: 'today' | 7 | 30 | 'all'. Sorted by wins, then win %, then fewer losses. */
export function rows(stats, scope, today = localDate()) {
  const from = scope === 'today' ? today : typeof scope === 'number' ? shiftDate(today, -(scope - 1)) : null;
  const out = [];
  Object.entries(stats || {}).forEach(([key, e]) => {
    let w = e.w;
    let l = e.l;
    if (from) {
      w = 0;
      l = 0;
      Object.entries(e.days || {}).forEach(([d, v]) => { if (d >= from && d <= today) { w += v[0]; l += v[1]; } });
    }
    if (w + l > 0) out.push(row(key, e.name, w, l));
  });
  return out.sort(byWins);
}

/* Best partner combinations. scope: 'today' | 'all' */
export function pairRows(pairs, scope, today = localDate()) {
  const out = [];
  Object.entries(pairs || {}).forEach(([key, e]) => {
    const w = scope === 'today' ? (e.d === today ? e.dw || 0 : 0) : e.w;
    const l = scope === 'today' ? (e.d === today ? e.dl || 0 : 0) : e.l;
    if (w + l > 0) out.push(row(key, `${e.names[0]} & ${e.names[1]}`, w, l));
  });
  return out.sort(byWins);
}

// "Player of the day": best win-minus-loss today, at least MIN_GAMES_HIGHLIGHT games
export const playerOfDay = (stats, today = localDate()) =>
  rows(stats, 'today', today).filter((r) => r.games >= MIN_GAMES_HIGHLIGHT).sort(byNet)[0] || null;

export const bestPairOfDay = (pairs, today = localDate()) =>
  pairRows(pairs, 'today', today).filter((r) => r.games >= MIN_GAMES_HIGHLIGHT).sort(byNet)[0] || null;
