import { useEffect, useState } from 'react';
import { data } from '../data/index.js';
import { useAuth, useDocument } from '../data/hooks.js';
import { PLAYER_LEVELS } from '../data/levels.js';

export default function ClientProfile() {
  const { user, mode } = useAuth();
  const profile = useDocument('players', user && user.uid);
  const [f, setF] = useState({ name: '', phone: '', selfLevel: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (profile) setF({ name: profile.name || '', phone: profile.phone || '', selfLevel: profile.selfLevel || '' });
  }, [profile && profile.id, profile && profile.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const save = async () => {
    if (!f.name.trim()) return;
    // players may change only these fields (the Firestore rules enforce it)
    await data.setDoc('players', user.uid, { uid: user.uid, name: f.name.trim(), phone: f.phone.trim(), selfLevel: f.selfLevel, updatedAt: Date.now(), ...(mode === 'local' ? {} : {}) }, { merge: true });
    setMsg('Saved.');
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>My profile</h1></div>
      <div className="cq-card">
        <div className="cq-field"><span>Name</span><input type="text" value={f.name} onChange={set('name')} /></div>
        <div className="cq-field"><span>Phone</span><input type="text" value={f.phone} onChange={set('phone')} placeholder="Optional" /></div>
        <label className="cq-field">
          <span>My level</span>
          <select value={f.selfLevel} onChange={set('selfLevel')}>
            <option value="">Not sure yet</option>
            {PLAYER_LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        {profile && profile.level && (
          <div className="cq-mut" style={{ marginTop: 10 }}>Level assigned by staff: <b style={{ color: 'var(--tx)' }}>{profile.level}</b>. Staff may change it as you play.</div>
        )}
        <div className="cq-row" style={{ marginTop: 14 }}>
          <button className="primary" disabled={!f.name.trim()} onClick={save}>Save profile</button>
          {msg && <span role="status" className="cq-mut">{msg}</span>}
        </div>
        <div className="cq-mut" style={{ marginTop: 10, wordBreak: 'break-all' }}>{user.email ? `Signed in as ${user.email}` : 'Local mode (no login)'}{mode === 'firebase' ? ` · Account ID: ${user.uid}` : ''}</div>
      </div>
    </div>
  );
}
