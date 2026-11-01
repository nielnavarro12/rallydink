import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { data } from '../data/index.js';
import { useAuth, useCollection } from '../data/hooks.js';
import { slugify } from '../platform/domain.js';

export default function Home() {
  const { user, isSuper, loading, mode } = useAuth();
  const nav = useNavigate();
  const hubs = useCollection('hubs');
  
  const [code, setCode] = useState('');
  const [newHubName, setNewHubName] = useState('');
  const [creating, setCreating] = useState(false);

  if (loading) return <div className="cq" role="status">Loading…</div>;

  const go = () => { 
    const c = slugify(code); 
    if (c) nav(`/h/${c}`); 
  };
console.log('Home component rendered. User:', user, 'Mode:', mode, 'IsSuper:', isSuper, 'Hubs:', hubs);
 
const handleCreateHub = async () => {
  const hubId = slugify(newHubName);
  if (!hubId || !user?.uid) return;

  setCreating(true);
  try {
    await data.transaction(async (tx) => {
      tx.set('hubs', hubId, {
        name: newHubName.trim(), active: true, theme: 'candy', createdAt: Date.now(),
      });
      tx.set(`hubs/${hubId}/admins`, user.uid, { role: 'owner' });
    });
    setNewHubName('');
    nav(`/h/${hubId}`);
  } catch (err) {
    console.error('Error creating hub:', err);
    alert('Failed to create hub. Check your database permissions.');
  } finally {
    setCreating(false);
  }
};
  return (
    <div className="cq auth">
      <div className="cq-card">
        <h1 style={{ marginBottom: 4 }}>Drive n Dink</h1>
        <div className="cq-mut" style={{ marginBottom: 12 }}>
          Enter the code of your venue (hub) or pick one below.
        </div>

        {/* Enter Code Form */}
        <div className="cq-row" style={{ marginBottom: 16 }}>
          <input 
            type="text" 
            value={code} 
            placeholder="Hub code" 
            onChange={(e) => setCode(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && go()} 
            aria-label="Hub code" 
          />
          <button className="primary" disabled={!slugify(code)} onClick={go}>Go</button>
        </div>

        {/* Create Hub Form */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: 16, marginTop: 16 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Create a New Hub</h2>
          <div className="cq-row">
            <input 
              type="text" 
              value={newHubName} 
              placeholder="New Hub Name (e.g. Metro Court)" 
              onChange={(e) => setNewHubName(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleCreateHub()}
            />
            <button className="primary" disabled={!slugify(newHubName) || creating} onClick={handleCreateHub}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>

        {/* List of Available Hubs */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: 16, marginTop: 16 }}>
          <h2>Available Hubs ({hubs.length})</h2>
          {hubs.length === 0 ? (
            <div className="cq-mut" style={{ marginTop: 8 }}>No hubs found. Create one above!</div>
          ) : (
            hubs.map((h) => (
              <div className="cq-item" key={h.id}>
                <span>
                  <b>{h.name}</b> <span className="cq-mut">· {h.id}</span>
                </span>
                <Link className="cq-btn" to={`/h/${h.id}`}>Open</Link>
              </div>
            ))
          )}
        </div>

        {/* Super Admin Console Button */}
        {isSuper && (
          <div style={{ marginTop: 16 }}>
            <Link className="cq-btn primary" to="/platform">Platform console</Link>
          </div>
        )}

        {/* Auth status */}
        {!user && mode === 'firebase' && (
          <div className="cq-mut" style={{ marginTop: 14 }}>
            Platform staff: <Link to="/login">sign in here</Link>.
          </div>
        )}
        {user && mode === 'firebase' && (
          <div style={{ marginTop: 14 }}>
            <button className="small" onClick={() => data.auth.signOut()}>Sign out</button>
          </div>
        )}
      </div>
    </div>
  );
}