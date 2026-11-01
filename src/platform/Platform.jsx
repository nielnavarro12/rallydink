import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { data } from '../data/index.js';
import { useAuth, useCollection, useDocument } from '../data/hooks.js';
import { ROLES, normalizeRole } from '../auth/roles.js';
import { THEMES as BASE_THEMES, addHubStaff, createHub, findUserByEmail, removeHubStaff, setHubStaffRole, setSuperAdmin, slugify, updateHub, validSlug } from './domain.js';

const banner = "./images/logo.jpeg";
const origin = () => window.location.href.split('#')[0];
const copy = (t) => { try { navigator.clipboard.writeText(t); } catch { /* shown on screen anyway */ } };

// Extended themes including Dark Glass
const THEMES = {
  ...BASE_THEMES,
  'dark-glass': {
    label: 'Dark Glass',
    swatch: 'linear-gradient(135deg, #080c14, #a875ff, #00e5ff)',
    desc: 'Deep cosmic void with vibrant neon glass panels',
  },
};

/* the platform console uses the neutral professional look */
export function PlatformLayout() {
  const { user, mode } = useAuth();
  useEffect(() => {
    document.documentElement.dataset.cqTheme = 'professional';
    return () => { delete document.documentElement.dataset.cqTheme; };
  }, []);
  return (
    <>
      <nav className="cq-nav" aria-label="Platform">
        <div className="cq-nav-in">
          <img src={banner} alt="Banner" className="logo" />
          <NavLink to="/platform" end className={({ isActive }) => (isActive ? 'active' : undefined)}>Hubs</NavLink>
          <NavLink to="/platform/admins" className={({ isActive }) => (isActive ? 'active' : undefined)}>Super admins</NavLink>
          <span className="cq-nav-tv" />
          <NavLink to="/">Hub chooser</NavLink>
          {mode === 'firebase' && user && <a href="#/" onClick={(e) => { e.preventDefault(); data.auth.signOut(); }}>Sign out</a>}
        </div>
      </nav>
      <Outlet />
    </>
  );
}

export function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme">
      {Object.entries(THEMES).map(([k, t]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} className={`theme-opt${value === k ? ' on' : ''}`} onClick={() => onChange(k)}>
          <span className="theme-sw" style={{ background: t.swatch }} />
          <b>{t.label}</b>
          <span className="cq-mut">{t.desc}</span>
        </button>
      ))}
    </div>
  );
}

function Created({ r }) {
  if (!r) return null;
  if (!r.ok) return <div role="alert" className="cq-msg" style={{ color: '#c2255c' }}>{r.error}</div>;
  const o = r.owner;
  return (
    <div role="status" className="cq-msg">
      Hub <b>{r.id}</b> created.{' '}
      {o === null && 'No owner yet: add one on the hub page.'}
      {o && !o.ok && <span style={{ color: '#c2255c' }}>The owner could not be added: {o.error}</span>}
      {o && o.ok && !o.created && <>{o.name} already had an account and is now the owner.</>}
      {o && o.ok && o.created && (
        <>The owner account for {o.name} was created. {o.emailed ? 'A reset-password email was sent.' : 'The reset email could not be sent.'} Temporary password: <code>{o.password}</code> (shown once).</>
      )}
    </div>
  );
}

export function HubsPage() {
  const { user } = useAuth();
  const hubs = useCollection('hubs');
  const [f, setF] = useState({ name: '', slug: '', theme: 'candy', ownerName: '', ownerEmail: '' });
  const [touched, setTouched] = useState(false); // the code was typed by hand
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const onName = (e) => { const name = e.target.value; setF((v) => ({ ...v, name, slug: touched ? v.slug : slugify(name) })); };

  const create = async () => {
    setBusy(true);
    setRes(null);
    const r = await createHub(user, f);
    setBusy(false);
    setRes(r);
    if (r.ok) { setF({ name: '', slug: '', theme: f.theme, ownerName: '', ownerEmail: '' }); setTouched(false); }
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>Hubs</h1></div>

      <div className="cq-card">
        <h2>Create a hub</h2>
        <div className="cq-row">
          <input type="text" value={f.name} placeholder="Hub name (e.g. Daily Dink Caloocan)" onChange={onName} />
          <input type="text" value={f.slug} placeholder="Hub code" onChange={(e) => { setTouched(true); setF((v) => ({ ...v, slug: slugify(e.target.value) })); }} style={{ maxWidth: 220 }} aria-label="Hub code" />
        </div>
        <div className="cq-mut" style={{ margin: '6px 0 10px' }}>
          The code is part of every link of this hub: {origin()}#/h/<b>{f.slug || 'code'}</b>
        </div>
        <ThemePicker value={f.theme} onChange={(theme) => setF((v) => ({ ...v, theme }))} />
        <div className="cq-row" style={{ marginTop: 12 }}>
          <input type="text" value={f.ownerName} placeholder="Owner name" onChange={set('ownerName')} />
          <input type="text" value={f.ownerEmail} placeholder="Owner email (optional now)" onChange={set('ownerEmail')} />
          <button className="primary" disabled={busy || !f.name.trim() || !validSlug(f.slug)} onClick={create}>{busy ? 'Creating…' : 'Create hub'}</button>
        </div>
        <div className="cq-mut" style={{ marginTop: 8 }}>
          The owner runs the hub: staff, rates, courts, bookings and sales. They see only their own hub. If the email already has an account it is used,
          otherwise an account is created and they get an email to choose a password.
        </div>
        <Created r={res} />
      </div>

      <div className="cq-card">
        <h2>All hubs ({hubs.length})</h2>
        {hubs.length === 0 && <div className="cq-mut">No hubs yet. Create the first one above.</div>}
        {[...hubs].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((h) => (
          <div className="cq-item" key={h.id} style={h.active === false ? { opacity: 0.6 } : undefined}>
            <span>
              <b>{h.name}</b> <span className="cq-mut">· {h.id} · {THEMES[h.theme] ? THEMES[h.theme].label : h.theme}{h.active === false ? ' · inactive' : ''}</span>
            </span>
            <span className="cq-row" style={{ flexWrap: 'nowrap' }}>
              <Link className="cq-btn" to={`/platform/hubs/${h.id}`}>Manage</Link>
              <Link className="cq-btn" to={`/h/${h.id}`}>Open</Link>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HubDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const hub = useDocument('hubs', id);
  const staff = useCollection('admins', undefined, id);
  const players = useCollection('players', undefined, id);
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const [add, setAdd] = useState({ name: '', email: '', role: 'owner' });
  const [res, setRes] = useState(null);
  useEffect(() => { if (hub && !f) setF({ name: hub.name || '', theme: hub.theme || 'candy', active: hub.active !== false }); }, [hub]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hub) return <div className="cq" role="status">Loading… <Link to="/platform">Back to hubs</Link></div>;
  const nameOf = (uid) => (players.find((p) => p.uid === uid || p.id === uid) || {}).name || uid;
  const base = `${origin()}#/h/${id}`;
  const links = [['Staff area', base], ['Client booking page', `${base}/c`], ['TV display', `${base}/tv`]];

  const save = async () => {
    await updateHub(id, { name: f.name.trim() || hub.name, theme: f.theme, active: f.active });
    setMsg('Saved.');
  };
  const addStaff = async () => {
    setRes(null);
    const r = await addHubStaff(id, add);
    setRes(r);
    if (r.ok) setAdd({ name: '', email: '', role: add.role });
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>{hub.name}</h1><Link className="cq-btn" to="/platform" onClick={() => nav('/platform')}>← All hubs</Link></div>

      <div className="cq-card">
        <h2>Hub settings</h2>
        {f && (
          <>
            <div className="cq-row">
              <input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Hub name" />
              <label className="cq-check"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active (clients and staff can use it)</label>
            </div>
            <div style={{ marginTop: 10 }}><ThemePicker value={f.theme} onChange={(theme) => setF({ ...f, theme })} /></div>
            <div className="cq-row" style={{ marginTop: 12 }}>
              <button className="primary" onClick={save}>Save</button>
              {msg && <span role="status" className="cq-mut">{msg}</span>}
            </div>
          </>
        )}
        <div className="cq-mut" style={{ marginTop: 10 }}>Only super admins can change a hub&apos;s name, theme or status. The hub code ({id}) cannot be changed.</div>
      </div>

      <div className="cq-card">
        <h2>Links</h2>
        {links.map(([l, u]) => (
          <div className="cq-item" key={l}>
            <span>{l}<div className="cq-mut" style={{ wordBreak: 'break-all' }}>{u}</div></span>
            <button className="small" onClick={() => copy(u)}>Copy</button>
          </div>
        ))}
      </div>

      <div className="cq-card">
        <h2>Staff of this hub ({staff.length})</h2>
        {staff.length === 0 && <div className="cq-mut">No staff yet. Add the owner below.</div>}
        {staff.map((a) => (
          <div className="cq-item" key={a.id}>
            <span>{nameOf(a.id)}</span>
            <span className="cq-row" style={{ flexWrap: 'nowrap' }}>
              <select value={normalizeRole(a.role)} onChange={(e) => setHubStaffRole(id, a.id, e.target.value)} aria-label={`Role of ${nameOf(a.id)}`}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button className="small" onClick={() => window.confirm('Remove this person from the hub?') && removeHubStaff(id, a.id)}>Remove</button>
            </span>
          </div>
        ))}
        <div className="cq-row" style={{ marginTop: 12 }}>
          <input type="text" value={add.name} placeholder="Name (for a new account)" onChange={(e) => setAdd({ ...add, name: e.target.value })} />
          <input type="text" value={add.email} placeholder="Email" onChange={(e) => setAdd({ ...add, email: e.target.value })} />
          <select value={add.role} onChange={(e) => setAdd({ ...add, role: e.target.value })} aria-label="Role">
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="primary" disabled={!add.email.trim()} onClick={addStaff}>Add</button>
        </div>
        {res && res.ok && (
          <div role="status" className="cq-msg">
            {res.name} added.{' '}
            {res.created && <>New account. {res.emailed ? 'A reset-password email was sent.' : 'The reset email could not be sent.'} Temporary password: <code>{res.password}</code> (shown once).</>}
          </div>
        )}
        {res && !res.ok && <div role="alert" className="cq-msg" style={{ color: '#c2255c' }}>{res.error}</div>}
        <div className="cq-mut" style={{ marginTop: 8 }}>Each hub&apos;s owner can add and manage their own staff on their Users page. Super admins can open any hub as its owner.</div>
      </div>
    </div>
  );
}

export function SuperAdminsPage() {
  const { user } = useAuth();
  const admins = useCollection('platformAdmins');
  const users = useCollection('users');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const nameOf = (uid) => { const u = users.find((x) => x.uid === uid || x.id === uid); return u ? `${u.name || u.email}${u.name && u.email ? ` · ${u.email}` : ''}` : uid; };

  const grant = async () => {
    const u = await findUserByEmail(email);
    if (!u) { setMsg('No account with that email has signed in to this app yet. Ask them to sign in once first.'); return; }
    await setSuperAdmin(u.uid, true);
    setMsg(`${u.name || u.email} is now a super admin.`);
    setEmail('');
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>Super admins</h1></div>
      <div className="cq-card">
        <h2>Super admins ({admins.length})</h2>
        {admins.map((a) => (
          <div className="cq-item" key={a.id}>
            <span>{nameOf(a.id)}{user && a.id === user.uid ? ' (you)' : ''}</span>
            {user && a.id !== user.uid && admins.length > 1 && (
              <button className="small" onClick={() => window.confirm('Remove this super admin?') && setSuperAdmin(a.id, false)}>Remove</button>
            )}
          </div>
        ))}
        <div className="cq-row" style={{ marginTop: 12 }}>
          <input type="text" value={email} placeholder="Email of an existing account" onChange={(e) => setEmail(e.target.value)} />
          <button className="primary" disabled={!email.trim()} onClick={grant}>Make super admin</button>
        </div>
        {msg && <div role="status" className="cq-msg">{msg}</div>}
        <div className="cq-mut" style={{ marginTop: 10 }}>
          Super admins create hubs, choose their themes and owners, and can open any hub as its owner. Hub owners and their staff never see other hubs.
        </div>
      </div>
    </div>
  );
}