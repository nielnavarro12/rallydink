import { data } from './index.js';
import { newId } from './ids.js';
import { CLOSE_MIN, OPEN_MIN, SLOT, nowMin, toMin, todayStr } from '../court-queue/CourtQueue.jsx';

/* Writes to the database: bookings, open play, players, staff. */
const MAX_MINUTES = 240; // longest booking a client can make (staff are not limited)
const MAX_DAYS_AHEAD = 60; // how far ahead a client can book

export const slotIds = (b) => {
  const ids = [];
  for (let m = toMin(b.start); m < toMin(b.end); m += SLOT) ids.push(`${b.court}_${b.date}_${m}`);
  return ids;
};

const daysUntil = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const [ty, tm, td] = todayStr().split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - new Date(ty, tm - 1, td)) / 86400000);
};

/* Book a court. Every 30-minute slot gets its own document and the transaction fails if any slot already exists,
   so two people can never book the same time. */
export async function bookCourt(user, b, { admin = false } = {}) {
  const name = (b.name || '').trim();
  if (!name) return { ok: false, error: 'Please enter a name for the booking.' };
  const a = toMin(b.start);
  const e = toMin(b.end);
  if (!(e > a) || a < OPEN_MIN || e > CLOSE_MIN) return { ok: false, error: 'Choose a time between opening and closing.' };
  if (b.date < todayStr() || (b.date === todayStr() && e <= nowMin())) return { ok: false, error: 'That time has already passed.' };
  if (!admin && e - a > MAX_MINUTES) return { ok: false, error: `Bookings can be at most ${MAX_MINUTES / 60} hours.` };
  if (!admin && daysUntil(b.date) > MAX_DAYS_AHEAD) return { ok: false, error: `You can book up to ${MAX_DAYS_AHEAD} days ahead.` };

  const id = newId();
  const ids = slotIds(b);
  try {
    await data.transaction(async (tx) => {
      for (const sid of ids) {
        const hit = await tx.get('slots', sid);
        if (hit) throw new Error(hit.kind === 'openplay' ? 'openplay' : 'taken');
      }
      tx.set('bookings', id, {
        court: b.court, date: b.date, start: b.start, end: b.end, name, note: (b.note || '').trim(),
        phone: b.phone || '', uid: user.uid, email: user.email || '', createdAt: Date.now(), byAdmin: admin,
      });
      tx.set('rentalsPublic', id, { court: b.court, date: b.date, start: b.start, end: b.end, name, uid: user.uid });
      ids.forEach((sid) => tx.set('slots', sid, { bookingId: id, uid: user.uid, court: b.court, date: b.date }));
    });
    return { ok: true, id };
  } catch (err) {
    return {
      ok: false,
      error: err && err.message === 'openplay'
        ? 'That time is reserved for open play, so the court cannot be rented then. Pick another time.'
        : err && err.message === 'taken'
          ? 'Sorry, part of that time was just booked. Pick another slot.'
          : 'Could not save the booking. Check your connection and try again.',
    };
  }
}

export async function cancelBooking(b) {
  try {
    await data.transaction(async (tx) => {
      tx.delete('bookings', b.id);
      tx.delete('rentalsPublic', b.id);
      slotIds(b).forEach((sid) => tx.delete('slots', sid));
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not cancel the booking.' };
  }
}

/* open play sessions. A session also takes the 30-minute slots of its courts, exactly like a rental does, so nobody can
   rent those courts at that time. Creating a session fails (and nothing is saved) if a rental or another session is
   already in one of those slots. */
const clock = (min) => {
  const h = Math.floor(min / 60);
  return `${((h + 11) % 12) + 1}:${String(min % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export async function createSession(user, s, allCourts, existingId) {
  const courts = (s.courts && s.courts.length ? s.courts : allCourts).slice().sort((x, y) => x - y);
  const id = existingId || newId();
  const ids = courts.flatMap((court) => slotIds({ court, date: s.date, start: s.start, end: s.end }));
  try {
    await data.transaction(async (tx) => {
      for (const sid of ids) {
        const ex = await tx.get('slots', sid);
        if (ex && ex.sessionId !== id) {
          const [court, , min] = sid.split('_');
          const err = new Error('clash');
          err.court = court;
          err.min = +min;
          err.what = ex.kind === 'openplay' ? 'another open play session' : 'a rental';
          throw err;
        }
      }
      const { id: _id, ...rest } = s;
      tx.set('sessions', id, { ...rest, courts, blocks: true });
      ids.forEach((sid) => {
        const [court] = sid.split('_');
        tx.set('slots', sid, { sessionId: id, uid: user.uid, court: +court, date: s.date, kind: 'openplay' });
      });
    });
    return { ok: true, id };
  } catch (e) {
    if (e && e.message === 'clash') {
      return { ok: false, error: `Court ${e.court} is already taken at ${clock(e.min)} by ${e.what}. Cancel that first, or choose other courts.` };
    }
    return { ok: false, error: 'Could not save the session. Check your connection and try again.' };
  }
}

/* Change a session (date, time, courts, fee...). Its old court slots are released and the new ones are taken in one
   transaction; if a rental or another session is in the way nothing changes. Sign-ups stay with the session. */
export async function updateSession(user, old, s, allCourts) {
  const courts = (s.courts && s.courts.length ? s.courts : allCourts).slice().sort((x, y) => x - y);
  const id = old.id;
  const slotsOf = (se, cs) => cs.flatMap((court) => slotIds({ court, date: se.date, start: se.start, end: se.end }));
  const newIds = slotsOf(s, courts);
  const oldIds = old.blocks ? slotsOf(old, old.courts || []) : []; // an older session never took slots
  try {
    await data.transaction(async (tx) => {
      for (const sid of newIds) {
        const ex = await tx.get('slots', sid);
        if (ex && ex.sessionId !== id) {
          const [court, , min] = sid.split('_');
          const err = new Error('clash');
          err.court = court;
          err.min = +min;
          err.what = ex.kind === 'openplay' ? 'another open play session' : 'a rental';
          throw err;
        }
      }
      const { id: _id, ...rest } = s;
      tx.set('sessions', id, { ...rest, courts, blocks: true });
      oldIds.filter((sid) => !newIds.includes(sid)).forEach((sid) => tx.delete('slots', sid));
      newIds.forEach((sid) => {
        const [court] = sid.split('_');
        tx.set('slots', sid, { sessionId: id, uid: user.uid, court: +court, date: s.date, kind: 'openplay' });
      });
    });
    return { ok: true, id };
  } catch (e) {
    if (e && e.message === 'clash') {
      return { ok: false, error: `Court ${e.court} is already taken at ${clock(e.min)} by ${e.what}. Nothing was changed.` };
    }
    return { ok: false, error: 'Could not save the changes. Check your connection and try again.' };
  }
}

export async function deleteSession(session, signups = []) {
  const ids = (session.courts || []).flatMap((court) => slotIds({ court, date: session.date, start: session.start, end: session.end }));
  await data.transaction(async (tx) => {
    tx.delete('sessions', session.id);
    ids.forEach((sid) => tx.delete('slots', sid));
  });
  await Promise.all(signups.filter((x) => x.sessionId === session.id).map((x) => data.deleteDoc('signups', x.id)));
}
export async function signUpForSession(user, session, profile) {
  await data.setDoc('signups', `${session.id}_${user.uid}`, {
    sessionId: session.id, uid: user.uid, name: (profile && profile.name) || user.name || user.email || 'Player',
    level: (profile && (profile.level || profile.selfLevel)) || '', ts: Date.now(),
  });
}
export const cancelSignup = (sessionId, uid) => data.deleteDoc('signups', `${sessionId}_${uid}`);

/* players (saved details) */
export async function savePlayer(p) {
  const { id, ...rest } = p;
  const key = id || newId();
  await data.setDoc('players', key, { ...rest, updatedAt: Date.now() }, { merge: true });
  return key;
}
export const deletePlayer = (id) => data.deleteDoc('players', id);

/* staff */
export const setAdmin = (uid, on, role = 'frontdesk') => (on ? data.setDoc('admins', uid, { role, ts: Date.now() }) : data.deleteDoc('admins', uid));

/* ---------- users (accounts) ---------- */
const randomPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(14)) : Array.from({ length: 14 }, () => Math.floor(Math.random() * 256));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
};
const AUTH_ERRORS = {
  'auth/email-already-in-use': 'That email already has an account. If they are in the list below, change their role there; otherwise ask them to open this venue\'s page and sign in once, and they will appear in the list.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/weak-password': 'The generated password was refused. Try again.',
  'auth/operation-not-allowed': 'Email/Password sign-in is not enabled in Firebase (Authentication > Sign-in method).',
  'auth/network-request-failed': 'No connection. Try again.',
};

/* Create an account for someone (an owner does this). The person gets a reset-password email to choose their own
   password; the temporary password is returned too, in case the email is slow. role: 'client' or a staff role. */
export async function addUser({ name, email, phone = '', level = '', role = 'client' }) {
  const em = (email || '').trim().toLowerCase();
  const nm = (name || '').trim();
  if (!nm || !em) return { ok: false, error: 'Enter a name and an email.' };
  const password = randomPassword();
  try {
    const uid = await data.auth.createUser(em, password, nm);
    await data.setDoc('players', uid, { uid, name: nm, email: em, phone: phone.trim(), ...(level ? { level } : {}), createdAt: Date.now(), updatedAt: Date.now() });
    if (role && role !== 'client') await setAdmin(uid, true, role);
    let emailed = true;
    try { await data.auth.resetPassword(em); } catch { emailed = false; }
    return { ok: true, uid, password, emailed };
  } catch (e) {
    return { ok: false, error: AUTH_ERRORS[e && e.code] || (e && e.message) || 'Could not create the account.' };
  }
}

// give someone a staff role, or take their staff access away with role 'client'
export const changeRole = (uid, role) => (role === 'client' ? setAdmin(uid, false) : setAdmin(uid, true, role));
