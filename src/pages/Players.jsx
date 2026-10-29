import { useState } from 'react';
import { useCourtStore } from '../court-queue/CourtQueue.jsx';
import { useCollection } from '../data/hooks.js';
import { deletePlayer, savePlayer } from '../data/domain.js';
import { PLAYER_LEVELS, playerLevel } from '../data/levels.js';
import { rows } from '../stats/stats.js';

const EMPTY = { id: '', name: '', phone: '', email: '', level: '', rating: '', notes: '' };

export default function PlayersPage() {
  const [s] = useCourtStore({ readOnly: true });
  const players = useCollection('players');
  const [form, setForm] = useState(EMPTY);
  const [q, setQ] = useState('');
  const [lvl, setLvl] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const stat = {};
  rows(s.stats, 'all').forEach((r) => { stat[r.key] = r; });

  const save = async () => {
    if (!form.name.trim()) return;
    const p = { ...form, name: form.name.trim(), rating: form.rating === '' ? '' : +form.rating };
    if (!p.id) delete p.id;
    await savePlayer(p);
    setMsg(`Saved ${p.name}.`);
    setForm(EMPTY);
  };

  const list = players
    .filter((p) => (!q || `${p.name} ${p.phone || ''} ${p.email || ''}`.toLowerCase().includes(q.toLowerCase())) && (!lvl || (lvl === 'none' ? !playerLevel(p) : playerLevel(p) === lvl)))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const counts = PLAYER_LEVELS.map((l) => [l, players.filter((p) => playerLevel(p) === l).length]);

  return (
    <div className="cq">
      <div className="cq-head"><h1>Players</h1></div>

      <div className="cq-stats">
        <div className="cq-stat"><span>{players.length}</span>saved players</div>
        {counts.map(([l, n]) => <div className="cq-stat" key={l}><span>{n}</span>{l}</div>)}
      </div>

      <div className="cq-card">
        <h2>{form.id ? `Edit ${form.name}` : 'Add a player'}</h2>
        <div className="cq-row">
          <input type="text" value={form.name} placeholder="Name (required)" onChange={set('name')} />
          <input type="text" value={form.phone} placeholder="Phone" onChange={set('phone')} />
          <input type="text" value={form.email} placeholder="Email" onChange={set('email')} />
        </div>
        <div className="cq-row" style={{ marginTop: 8 }}>
          <select value={form.level} onChange={set('level')} aria-label="Level">
            <option value="">Level: not assigned</option>
            {PLAYER_LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <input type="number" min={1} max={8} step={0.1} value={form.rating} placeholder="Rating (optional)" onChange={set('rating')} style={{ maxWidth: 170 }} aria-label="Rating" />
          <input type="text" value={form.notes} placeholder="Notes (staff only)" onChange={set('notes')} />
        </div>
        <div className="cq-row" style={{ marginTop: 10 }}>
          <button className="primary" disabled={!form.name.trim()} onClick={save}>{form.id ? 'Save changes' : 'Add player'}</button>
          {form.id && <button onClick={() => setForm(EMPTY)}>Cancel</button>}
          {msg && <span role="status" className="cq-mut">{msg}</span>}
        </div>
        <div className="cq-mut" style={{ marginTop: 8 }}>
          Players who create an account on the booking page appear here automatically. A level you set here overrides the level they choose themselves.
        </div>
      </div>

      <div className="cq-card">
        <div className="cq-row" style={{ marginBottom: 10 }}>
          <input type="text" value={q} placeholder="Search name, phone or email" onChange={(e) => setQ(e.target.value)} />
          <select value={lvl} onChange={(e) => setLvl(e.target.value)} aria-label="Filter by level">
            <option value="">All levels</option>
            {PLAYER_LEVELS.map((l) => <option key={l}>{l}</option>)}
            <option value="none">Not assigned</option>
          </select>
        </div>
        {list.length === 0 && <div className="cq-mut">No players found.</div>}
        {list.map((p) => {
          const st = stat[(p.name || '').trim().toLowerCase()];
          const lv = playerLevel(p);
          return (
            <div className="cq-item" key={p.id}>
              <span>
                <b>{p.name}</b>
                {lv && <span className={`lv lv-${PLAYER_LEVELS.indexOf(lv) + 1}`}>{lv}{!p.level ? ' (self)' : ''}</span>}
                {p.rating ? <span className="cq-mut"> · rating {p.rating}</span> : null}
                <span className="cq-mut">
                  {p.phone ? ` · ${p.phone}` : ''}{p.email ? ` · ${p.email}` : ''}{p.uid ? ' · has account' : ''}
                  {st ? ` · ${st.w}W–${st.l}L (${st.pct}%)` : ''}{p.notes ? ` · ${p.notes}` : ''}
                </span>
              </span>
              <span>
                <button className="small" onClick={() => { setForm({ ...EMPTY, ...p, rating: p.rating ?? '' }); setMsg(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                <button className="small" aria-label={`Delete ${p.name}`} onClick={() => window.confirm(`Delete ${p.name}?`) && deletePlayer(p.id)}>✕</button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
