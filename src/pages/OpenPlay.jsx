import { useState } from 'react';
import { LEVELS, fmtDate, fmtTime, isUpcoming, sortSessions, todayStr, toMin, useClockTick, useCourtStore } from '../court-queue/CourtQueue.jsx';
import PayControl from '../components/PayControl.jsx';
import { useAuth, useCollection } from '../data/hooks.js';
import { createSession, deleteSession, updateSession } from '../data/domain.js';
import { recordPayment, voidSale } from '../money/domain.js';
import { daysAgo } from '../money/dates.js';
import { fmtMoney, sessionFee, useSettings } from '../money/pricing.js';
import { levelNum } from '../data/levels.js';

const addDays = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(y, m - 1, d + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

export default function OpenPlayPage() {
  const { user, can } = useAuth();
  const [s, update] = useCourtStore({ readOnly: true });
  const allCourts = s.courts.map((c) => c.n);
  const st = useSettings();
  const money = (n) => fmtMoney(n, st.currency);
  const sales = useCollection('sales', { where: ['date', '>=', daysAgo(60)] });
  const paidSale = (id) => sales.find((x) => !x.void && x.ref === id);
  const sessions = useCollection('sessions');
  const signups = useCollection('signups');
  useClockTick();
  const [f, setF] = useState({ date: todayStr(), start: '18:00', end: '20:00', sport: 'Pickleball', level: 'All levels', capacity: '', fee: '', note: '', repeat: 0 });
  const [pick, setPick] = useState(null); // courts used; null = all courts
  const [report, setReport] = useState([]);
  const [editing, setEditing] = useState(null); // the session being changed
  const blank = { date: todayStr(), start: '18:00', end: '20:00', sport: 'Pickleball', level: 'All levels', capacity: '', fee: '', note: '', repeat: 0 };
  const setField = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const chosen = pick || allCourts;
  const toggle = (n) => {
    const next = chosen.includes(n) ? chosen.filter((x) => x !== n) : [...chosen, n];
    setPick(next.length === allCourts.length ? null : next);
  };
  const valid = f.date && f.start && f.end && toMin(f.end) > toMin(f.start) && chosen.length > 0;

  const add = async () => {
    if (!valid) return;
    const { repeat, capacity, fee, ...base } = f;
    let made = 0;
    const skipped = [];
    for (let k = 0; k <= +repeat; k++) {
      const date = addDays(f.date, 7 * k);
      // eslint-disable-next-line no-await-in-loop
      const r = await createSession(user, { ...base, date, note: f.note.trim(), capacity: capacity ? +capacity : 0, fee: fee === '' ? null : +fee, courts: chosen }, allCourts);
      if (r.ok) made += 1;
      else skipped.push(`${fmtDate(date)}: ${r.error}`);
    }
    setReport([`Created ${made} session${made === 1 ? '' : 's'}. Court rentals are blocked for ${made === 1 ? 'it' : 'them'}.`, ...skipped.map((x) => `Skipped ${x}`)]);
    setF((v) => ({ ...v, note: '' }));
  };

  const startEdit = (x) => {
    setEditing(x);
    setF({ date: x.date, start: x.start, end: x.end, sport: x.sport, level: x.level, capacity: x.capacity ? String(x.capacity) : '', fee: x.fee == null ? '' : String(x.fee), note: x.note || '', repeat: 0 });
    setPick(!x.courts || !x.courts.length || x.courts.length === allCourts.length ? null : x.courts);
    setReport([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEdit = () => { setEditing(null); setF(blank); setPick(null); };
  const saveEdit = async () => {
    if (!valid || !editing) return;
    const { repeat, capacity, fee, ...base } = f;
    const r = await updateSession(user, editing, { ...base, note: f.note.trim(), capacity: capacity ? +capacity : 0, fee: fee === '' ? null : +fee, courts: chosen }, allCourts);
    setReport([r.ok ? 'Session updated. Its court blocks moved with it.' : r.error]);
    if (r.ok) cancelEdit();
  };

  // older sessions (created before rentals were blocked): take their court slots now
  const blockNow = async (x) => {
    const r = await createSession(user, x, allCourts, x.id);
    setReport([r.ok ? 'Rentals are now blocked for that session.' : r.error]);
  };

  // put everyone who signed up into the live queue (skipping people already waiting)
  const addToQueue = (se) => {
    const going = signups.filter((g) => g.sessionId === se.id);
    update((x) => {
      const have = new Set(x.q.map((p) => (p.n || '').toLowerCase()));
      const add2 = going.filter((g) => !have.has(g.name.toLowerCase())).map((g) => ({ n: g.name, at: Date.now(), ...(g.level ? { lv: g.level, lvl: levelNum(g.level) } : {}) }));
      return add2.length ? { ...x, q: [...x.q, ...add2] } : x;
    });
  };

  const courtsLabel = (x) => (!x.courts || !x.courts.length || x.courts.length === allCourts.length ? 'all courts' : `Court ${x.courts.join(', ')}`);
  const all = sortSessions(sessions);
  return (
    <div className="cq">
      <div className="cq-head"><h1>Open play schedule</h1></div>
      {can('sessions') && (
        <div className="cq-card">
          <h2>{editing ? `Edit session · ${fmtDate(editing.date)}` : 'Add a session'}</h2>
          <div className="cq-row">
            <input type="date" value={f.date} min={editing ? undefined : todayStr()} onChange={setField('date')} aria-label="Date" />
            <input type="time" value={f.start} onChange={setField('start')} aria-label="Start time" />
            <span className="cq-mut">to</span>
            <input type="time" value={f.end} onChange={setField('end')} aria-label="End time" />
            <select value={f.sport} onChange={setField('sport')}><option>Pickleball</option><option>Badminton</option></select>
            <select value={f.level} onChange={setField('level')}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
          </div>
          <div className="cq-row" style={{ marginTop: 8 }} role="group" aria-label="Courts used">
            <span className="cq-mut">Courts used:</span>
            {allCourts.map((n) => (
              <label key={n} className="cq-check"><input type="checkbox" checked={chosen.includes(n)} onChange={() => toggle(n)} /> Court {n}</label>
            ))}
          </div>
          <div className="cq-row" style={{ marginTop: 8 }}>
            <input type="text" value={f.note} placeholder="Note (optional): fee, bring your own paddle…" onChange={setField('note')} onKeyDown={(e) => e.key === 'Enter' && (editing ? saveEdit() : add())} />
            <input type="number" min={0} max={200} value={f.capacity} placeholder="Max players" onChange={setField('capacity')} style={{ width: 120 }} aria-label="Maximum players" />
            <input type="number" min={0} step="0.01" value={f.fee} placeholder={`Fee (default ${money(st.openPlayFee)})`} onChange={setField('fee')} style={{ width: 170 }} aria-label="Fee per player" />
            {!editing && (
              <select value={f.repeat} onChange={setField('repeat')} aria-label="Repeat">
                <option value={0}>Once</option>
                <option value={3}>Weekly, 4 weeks</option>
                <option value={7}>Weekly, 8 weeks</option>
                <option value={11}>Weekly, 12 weeks</option>
              </select>
            )}
            <button className="primary" disabled={!valid} onClick={editing ? saveEdit : add}>{editing ? 'Save changes' : 'Add session'}</button>
            {editing && <button onClick={cancelEdit}>Cancel</button>}
          </div>
          <div className="cq-mut" style={{ marginTop: 8 }}>
            Rentals are blocked on the chosen courts during the session. If a court already has a rental at that time the session is not created: cancel the rental first.
          </div>
          {!valid && <div className="cq-mut" style={{ marginTop: 8 }}>Pick an end time after the start time and at least one court.</div>}
          {report.map((r, i) => <div key={i} role="status" className="cq-msg" style={r.startsWith('Skipped') || r.startsWith('Court') ? { color: '#c2255c' } : undefined}>{r}</div>)}
        </div>
      )}

      <div className="cq-card">
        <h2>Sessions ({all.length})</h2>
        {all.length === 0 && <div className="cq-mut">No sessions yet.</div>}
        {all.map((x) => {
          const going = signups.filter((g) => g.sessionId === x.id);
          return (
            <div className="cq-item" key={x.id} style={{ opacity: isUpcoming(x) ? 1 : 0.5, alignItems: 'flex-start' }}>
              <span>
                {fmtDate(x.date)} · {fmtTime(x.start)} – {fmtTime(x.end)}
                <span className="cq-mut"> · {x.sport} · {x.level} · {courtsLabel(x)}{x.note ? ` · ${x.note}` : ''}{isUpcoming(x) ? '' : ' (past)'}</span>
                <div className="cq-mut">
                  Signed up: {going.length}{x.capacity ? ` / ${x.capacity}` : ''} · fee {money(sessionFee(x, st))} per player
                  {x.blocks ? ' · 🔒 rentals blocked' : ''}
                </div>
                {going.map((g) => {
                  const paid = paidSale(g.id);
                  return (
                    <div key={g.id} className="cq-row" style={{ marginTop: 4, gap: 8 }}>
                      <span>{g.name}{g.level ? <span className="cq-mut"> · {g.level}</span> : null}</span>
                      {paid ? (
                        <>
                          <span className="paid">✓ Paid {money(paid.total)} · {paid.method}</span>
                          {can('refund') && <button className="small" onClick={() => window.confirm('Remove this payment (refund)?') && voidSale(user, paid, 'unpaid')}>Undo</button>}
                        </>
                      ) : sessionFee(x, st) > 0 ? (
                        <PayControl amount={sessionFee(x, st)} onPay={({ amount, method }) => recordPayment(user, { cat: 'openplay', name: `Open play ${fmtDate(x.date)} (${g.name})`, amount, method, ref: g.id })} />
                      ) : <span className="cq-mut">Free</span>}
                    </div>
                  );
                })}
              </span>
              <span className="cq-row" style={{ flexWrap: 'nowrap' }}>
                {can('sessions') && !x.blocks && isUpcoming(x) && <button className="small" onClick={() => blockNow(x)}>Block rentals</button>}
                {can('sessions') && isUpcoming(x) && <button className="small" onClick={() => startEdit(x)}>Edit</button>}
                {going.length > 0 && isUpcoming(x) && <button className="small" onClick={() => addToQueue(x)}>Add all to queue</button>}
                {can('sessions') && <button className="small" aria-label="Delete session" onClick={() => window.confirm('Delete this session? Its court slots open up for rentals again.') && deleteSession(x, signups)}>✕</button>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
