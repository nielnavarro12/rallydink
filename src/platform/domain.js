import { data } from '../data/index.js';

/* Platform console: creating hubs (venues), their themes and owners. Only super admins can do any of this. */
export const THEMES = {
  candy: { label: 'Candy', desc: 'Pastel candy colours on frosted glass panels', swatch: 'linear-gradient(135deg,#ff9ccf,#c9b8ff 55%,#9fdcff)' },
  glass: { label: 'Glass', desc: 'Cool frosted glass on a deep blue backdrop', swatch: 'linear-gradient(135deg,#3b82f6,#8b5cf6 55%,#06b6d4)' },
  professional: { label: 'Professional', desc: 'Clean, solid and neutral, like business software', swatch: 'linear-gradient(135deg,#0f172a,#2563eb 55%,#e2e8f0)' },
};

export const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
export const validSlug = (s) => /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(s) && !['platform', 'login', 'h'].includes(s);

const randomPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(14)) : Array.from({ length: 14 }, () => Math.floor(Math.random() * 256));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
};
const AUTH_ERRORS = {
  'auth/email-already-in-use': 'That email already has an account but has not signed in to this app yet. Ask them to sign in once, then add them here.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/operation-not-allowed': 'Email/Password sign-in is not enabled in Firebase (Authentication > Sign-in method).',
};

export async function findUserByEmail(email) {
  const em = String(email || '').trim().toLowerCase();
  const all = await data.getCollection('users');
  return all.find((u) => (u.email || '').toLowerCase() === em) || null;
}

/* Give someone a role in a hub. An existing account (one that has signed in before) is used as it is; otherwise an
   account is created and they get an email to choose a password. */
export async function addHubStaff(hubId, { name, email, role = 'owner' }) {
  const em = String(email || '').trim().toLowerCase();
  const nm = String(name || '').trim();
  if (!em) return { ok: false, error: 'Enter an email.' };
  try {
    let user = await findUserByEmail(em);
    let password = null;
    let emailed = false;
    if (!user) {
      if (!nm) return { ok: false, error: 'Enter a name for the new account.' };
      password = randomPassword();
      const uid = await data.auth.createUser(em, password, nm);
      user = { uid, email: em, name: nm };
      await data.setDoc('users', uid, { uid, email: em, name: nm, updatedAt: Date.now() });
      try { await data.auth.resetPassword(em); emailed = true; } catch { /* the temporary password is shown instead */ }
    }
    const hub = data.forHub(hubId);
    await hub.setDoc('admins', user.uid, { role, ts: Date.now() });
    await hub.setDoc('players', user.uid, { uid: user.uid, name: user.name || nm || em.split('@')[0], email: em, createdAt: Date.now(), updatedAt: Date.now() }, { merge: true });
    return { ok: true, uid: user.uid, created: !!password, password, emailed, name: user.name || nm };
  } catch (e) {
    return { ok: false, error: AUTH_ERRORS[e && e.code] || (e && e.message) || 'Could not add that person.' };
  }
}

export async function createHub(creator, { name, slug, theme, ownerName, ownerEmail }) {
  const nm = String(name || '').trim();
  if (!nm) return { ok: false, error: 'Enter the hub name.' };
  if (!validSlug(slug)) return { ok: false, error: 'The hub code needs 3 to 30 lowercase letters, digits or dashes (and cannot be "platform", "login" or "h").' };
  if (!THEMES[theme]) return { ok: false, error: 'Choose a theme.' };
  try {
    if (await data.getDoc('hubs', slug)) return { ok: false, error: `The code “${slug}” is already used by another hub.` };
    await data.setDoc('hubs', slug, { name: nm, theme, active: true, createdAt: Date.now(), createdBy: creator ? creator.uid : '' });
  } catch {
    return { ok: false, error: 'Could not create the hub. Check your connection and try again.' };
  }
  if (!String(ownerEmail || '').trim()) return { ok: true, id: slug, owner: null };
  const owner = await addHubStaff(slug, { name: ownerName, email: ownerEmail, role: 'owner' });
  return { ok: true, id: slug, owner };
}

export const updateHub = (id, patch) => data.setDoc('hubs', id, patch, { merge: true });
export const setHubStaffRole = (hubId, uid, role) => data.forHub(hubId).setDoc('admins', uid, { role, ts: Date.now() });
export const removeHubStaff = (hubId, uid) => data.forHub(hubId).deleteDoc('admins', uid);
export const setSuperAdmin = (uid, on) => (on ? data.setDoc('platformAdmins', uid, { ts: Date.now() }) : data.deleteDoc('platformAdmins', uid));
