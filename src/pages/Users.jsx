import { useState } from 'react';
import { useAuth, useCollection } from '../data/hooks.js';
import { addUser, changeRole } from '../data/domain.js';
import { ROLES, normalizeRole } from '../auth/roles.js';
import { PLAYER_LEVELS } from '../data/levels.js';

const ROLE_KEYS = ['client', ...Object.keys(ROLES)];
const roleLabel = (k) => (k === 'client' ? 'Client (no staff access)' : ROLES[k] ? ROLES[k].label : k);

/* Owners: add people (creates their account) and change anyone's role */
export default function UsersPage() {
  const { user, mode } = useAuth();
  const players = useCollection('players');
  const admins = useCollection('admins');
  const [f, setF] = useState({ name: '', email: '', phone: '', level: '', role: 'client' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const roleOf = (uid) => { const a = admins.find((x) => x.id === uid); return a ? normalizeRole(a.role) : 'client'; };
  const owners = admins.filter((a) => normalizeRole(a.role) === 'owner').length;

  // everyone with an account: a player profile that has a uid, plus staff whose profile is missing
  const people = [
    ...players.filter((p) => p.uid).map((p) => ({ uid: p.uid, name: p.name, email: p.email || '', phone: p.phone || '', level: p.level || p.selfLevel || '' })),
    ...admins.filter((a) => !players.some((p) => p.uid === a.id)).map((a) => ({ uid: a.id, name: '(no profile)', email: '', phone: '', level: '' })),
  ]
    .filter((p) => (!q || `${p.name} ${p.email} ${p.phone}`.toLowerCase().includes(q.toLowerCase())) && (!filter || roleOf(p.uid) === filter))
    .sort((a, b) => a.name.localeCompare(b.name));

  const create = async () => {
    setBusy(true);
    setResult(null);
    const r = await addUser(f);
    setBusy(false);
    if (r.ok) {
      setResult({ ok: true, ...r, name: f.name.trim(), email: f.email.trim().toLowerCase(), role: f.role });
      setF({ name: '', email: '', phone: '', level: '', role: 'client' });
    } else {
      setResult({ ok: false, error: r.error });
    }
  };

  const setRole = async (p, role) => {
    setErr('');
    const cur = roleOf(p.uid);
    if (cur === 'owner' && role !== 'owner' && owners <= 1) { setErr('There must be at least one owner. Make someone else an owner first.'); return; }
    if (cur === 'owner' && role !== 'owner' && !window.confirm(`${p.name} is an owner. Change their role?`)) return;
    await changeRole(p.uid, role);
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>Users &amp; roles</h1></div>

      <div className="cq-card">
        <h2>Add a user</h2>
        <div className="cq-row">
          <input type="text" value={f.name} placeholder="Name (required)" onChange={set('name')} autoComplete="off" />
          <input type="email" value={f.email} placeholder="Email (required)" onChange={set('email')} autoComplete="off" style={{ flex: '1 1 200px', minWidth: 0 }} />
        </div>
        <div className="cq-row" style={{ marginTop: 8 }}>
          <input type="text" value={f.phone} placeholder="Phone (optional)" onChange={set('phone')} />
          <select value={f.level} onChange={set('level')} aria-label="Level">
            <option value="">Level: not assigned</option>
            {PLAYER_LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select value={f.role} onChange={set('role')} aria-label="Role">
            {ROLE_KEYS.map((k) => <option key={k} value={k}>{roleLabel(k)}</option>)}
          </select>
          <button className="primary" disabled={busy || !f.name.trim() || !f.email.trim()} onClick={create}>{busy ? 'Creating…' : 'Create account'}</button>
        </div>
        <div className="cq-mut" style={{ marginTop: 8 }}>
          {mode === 'firebase'
            ? 'This creates their login. They get an email to choose their own password. People can also sign up themselves on the booking page and appear in the list below.'
            : 'Local mode: this only adds a record on this device. Accounts and passwords need Firebase (see the README).'}
        </div>
        {result && result.ok && (
          <div role="status" className="cq-msg">
            Created <b>{result.name}</b> ({roleLabel(result.role)}).{' '}
            {result.emailed ? `A reset-password email was sent to ${result.email}.` : 'The reset email could not be sent.'}
            {mode === 'firebase' && <> Temporary password: <code>{result.password}</code> (shown once; give it to them if the email does not arrive).</>}
          </div>
        )}
        {result && !result.ok && <div role="alert" className="cq-msg" style={{ color: '#c2255c' }}>{result.error}</div>}
      </div>

      <div className="cq-card">
        <h2>Everyone with an account ({people.length})</h2>
        <div className="cq-row" style={{ marginBottom: 10 }}>
          <input type="text" value={q} placeholder="Search name, email or phone" onChange={(e) => setQ(e.target.value)} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by role">
            <option value="">All roles</option>
            {ROLE_KEYS.map((k) => <option key={k} value={k}>{roleLabel(k)}</option>)}
          </select>
        </div>
        {err && <div role="alert" style={{ color: '#c2255c', marginBottom: 8 }}>{err}</div>}
        {people.length === 0 && <div className="cq-mut">No users found.</div>}
        {people.map((p) => (
          <div className="cq-item" key={p.uid}>
            <span>
              <b>{p.name}</b>{p.uid === user.uid ? ' (you)' : ''}
              <span className="cq-mut">{p.email ? ` · ${p.email}` : ''}{p.phone ? ` · ${p.phone}` : ''}{p.level ? ` · ${p.level}` : ''}</span>
            </span>
            {p.uid === user.uid ? (
              <span className="cq-mut">{roleLabel(roleOf(p.uid))}</span>
            ) : (
              <select value={roleOf(p.uid)} onChange={(e) => setRole(p, e.target.value)} aria-label={`Role of ${p.name}`}>
                {ROLE_KEYS.map((k) => <option key={k} value={k}>{roleLabel(k)}</option>)}
              </select>
            )}
          </div>
        ))}
        <div className="cq-mut" style={{ marginTop: 10 }}>
          {Object.entries(ROLES).map(([k, v]) => <div key={k}><b style={{ color: 'var(--tx)' }}>{v.label}</b>: {v.desc}</div>)}
          <div><b style={{ color: 'var(--tx)' }}>Client</b>: can book courts and join open play, no staff pages.</div>
        </div>
      </div>
    </div>
  );
}
