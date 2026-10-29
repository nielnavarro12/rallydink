import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { data } from '../data/index.js';
import { useAuth, useCollection } from '../data/hooks.js';
import { slugify } from '../platform/domain.js';

/* "/" : go to the hub this device used last, or enter a hub code (super admins also get the list of hubs) */
export default function Home() {
  const { user, isSuper, loading, mode } = useAuth();
  const nav = useNavigate();
  const hubs = useCollection('hubs');
  const [code, setCode] = useState('');
  let last = '';
  try { last = localStorage.getItem('cq-last-hub') || ''; } catch { /* private mode */ }

  if (loading) return <div className="cq" role="status">Loading…</div>;
  if (last && !isSuper) return <Navigate to={`/h/${last}`} replace />;

  const go = () => { const c = slugify(code); if (c) nav(`/h/${c}`); };
  return (
    <div className="cq auth">
      <div className="cq-card">
        <h1 style={{ marginBottom: 4 }}>🏸 Court Queue</h1>
        <div className="cq-mut" style={{ marginBottom: 12 }}>Enter the code of your venue (hub). It is in the link or QR code the venue gave you.</div>
        <div className="cq-row">
          <input type="text" value={code} placeholder="Hub code" onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} aria-label="Hub code" />
          <button className="primary" disabled={!slugify(code)} onClick={go}>Go</button>
        </div>
        {isSuper && (
          <>
            <div style={{ marginTop: 16 }}><Link className="cq-btn primary" to="/platform">Platform console</Link></div>
            {hubs.length > 0 && <h2 style={{ marginTop: 16 }}>Hubs</h2>}
            {hubs.map((h) => <div className="cq-item" key={h.id}><span>{h.name} <span className="cq-mut">· {h.id}</span></span><Link className="cq-btn" to={`/h/${h.id}`}>Open</Link></div>)}
          </>
        )}
        {!user && mode === 'firebase' && <div className="cq-mut" style={{ marginTop: 14 }}>Platform staff: <Link to="/login">sign in here</Link>.</div>}
        {user && mode === 'firebase' && <div style={{ marginTop: 14 }}><button className="small" onClick={() => data.auth.signOut()}>Sign out</button></div>}
      </div>
    </div>
  );
}
