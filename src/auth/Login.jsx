import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigate } from '../hub/links.jsx';
import { useHub } from '../hub/HubProvider.jsx';
import { data } from '../data/index.js';
import { useAuth } from '../data/hooks.js';

const MESSAGES = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'No account with that email.',
  'auth/email-already-in-use': 'An account with that email already exists. Sign in instead.',
  'auth/weak-password': 'Use a password with at least 6 characters.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/popup-closed-by-user': 'The Google window was closed.',
  'auth/unauthorized-domain': 'This site is not on the Firebase authorized domains list (see the README).',
};
const explain = (e) => MESSAGES[e && e.code] || (e && e.message) || 'Something went wrong. Try again.';

export default function LoginPage() {
  const { user, isAdmin, loading, mode, isSuper } = useAuth();
  const hub = useHub();
  const loc = useLocation();
  const [tab, setTab] = useState('in');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  useEffect(() => { setMsg(null); }, [tab]);

  if (mode === 'local') return <Navigate to="/" replace />;
  if (user && !loading) {
    if (!hub.id) return <Navigate to={isSuper ? '/platform' : '/'} replace />; // signed in on the platform login
    return <Navigate to={isAdmin ? (loc.state && loc.state.from) || '/' : '/c'} replace />;
  }

  const run = async (fn) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ bad: true, t: explain(e) });
    }
    setBusy(false);
  };
  const submit = (e) => {
    e.preventDefault();
    if (tab === 'in') run(() => data.auth.signIn(f.email.trim(), f.password));
    else if (tab === 'up') run(() => data.auth.signUp(f.email.trim(), f.password, f.name.trim()));
    else run(async () => { await data.auth.resetPassword(f.email.trim()); setMsg({ t: 'If that email has an account, a reset link is on its way.' }); });
  };

  return (
    <div className="cq auth">
      <div className="cq-card">
        <h1 style={{ marginBottom: 4 }}>🏸 {hub.doc ? hub.doc.name : 'Court Queue'}</h1>
        <div className="cq-mut" style={{ marginBottom: 12 }}>Sign in to book courts and join open play.</div>
        <div className="cq-row" role="tablist" style={{ marginBottom: 12 }}>
          {[['in', 'Sign in'], ['up', 'Create account'], ['reset', 'Forgot password']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`small${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <form onSubmit={submit} className="auth-form">
          {tab === 'up' && <input type="text" value={f.name} onChange={set('name')} placeholder="Your name" autoComplete="name" required />}
          <input type="email" value={f.email} onChange={set('email')} placeholder="Email" autoComplete="email" required />
          {tab !== 'reset' && <input type="password" value={f.password} onChange={set('password')} placeholder="Password" autoComplete={tab === 'up' ? 'new-password' : 'current-password'} required minLength={6} />}
          <button className="primary" type="submit" disabled={busy}>{tab === 'in' ? 'Sign in' : tab === 'up' ? 'Create account' : 'Send reset link'}</button>
        </form>
        {tab !== 'reset' && (
          <div style={{ marginTop: 10 }}>
            <button disabled={busy} onClick={() => run(() => data.auth.signInGoogle())}>Continue with Google</button>
          </div>
        )}
        {msg && <div role="alert" className="cq-msg" style={msg.bad ? { color: '#d9480f' } : undefined}>{msg.t}</div>}
      </div>
    </div>
  );
}
