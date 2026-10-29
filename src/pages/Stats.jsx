import { useState } from 'react';
import { fmtDate, todayStr, useCourtStore } from '../court-queue/CourtQueue.jsx';
import { bestPairOfDay, pairRows, playerOfDay, resetAll, resetDay, rows, swapResult, undoResult } from '../stats/stats.js';

const SCOPES = [['today', 'Today'], [7, 'Last 7 days'], [30, 'Last 30 days'], ['all', 'All time']];
const time = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function StatsPage() {
  const [s, update] = useCourtStore();
  const [scope, setScope] = useState('today');
  const [open, setOpen] = useState(null);
  const [pscope, setPscope] = useState('today');
  const today = todayStr();
  const list = rows(s.stats, scope, today);
  const matchesToday = Math.round(rows(s.stats, 'today', today).reduce((n, r) => n + r.w, 0) / 2);
  const star = playerOfDay(s.stats, today);
  const duo = bestPairOfDay(s.pairs, today);
  const plist = pairRows(s.pairs, pscope, today);
  const detail = open && s.stats?.[open];
  const days = detail ? Object.entries(detail.days || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14) : [];

  return (
    <div className="cq">
      <div className="cq-head"><h1>Player stats</h1></div>

      <div className="cq-stats">
        <div className="cq-stat"><span>{matchesToday}</span>matches today</div>
        <div className="cq-stat"><span>{rows(s.stats, 'today', today).length}</span>players today</div>
        <div className="cq-stat"><span>{rows(s.stats, 'all', today).length}</span>players all time</div>
      </div>

      {(star || duo) && (
        <div className="cq-card">
          <h2>Today&apos;s highlights</h2>
          {star && <div>⭐ <b>Player of the day: {star.name}</b> <span className="cq-mut">{star.w} W · {star.l} L ({star.pct}%)</span></div>}
          {duo && <div style={{ marginTop: 4 }}>🤝 <b>Best pair today: {duo.name}</b> <span className="cq-mut">{duo.w} W · {duo.l} L ({duo.pct}%)</span></div>}
          <div className="cq-mut" style={{ marginTop: 6 }}>Needs at least 2 games today. Ranked by wins minus losses.</div>
        </div>
      )}

      <div className="cq-card">
        <div className="cq-row" role="group" aria-label="Period" style={{ marginBottom: 10 }}>
          {SCOPES.map(([k, l]) => (
            <button key={k} className={`small${scope === k ? ' on' : ''}`} aria-pressed={scope === k} onClick={() => { setScope(k); setOpen(null); }}>{l}</button>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="cq-mut">No finished matches in this period. Results are recorded when you tap the winning pair on the Queue page.</div>
        ) : (
          <table className="st-table">
            <thead>
              <tr><th>#</th><th>Player</th><th>W</th><th>L</th><th>Games</th><th>Win %</th></tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={r.key} className={open === r.key ? 'open' : undefined}>
                  <td>{i + 1}</td>
                  <td><button className="st-name" aria-expanded={open === r.key} onClick={() => setOpen(open === r.key ? null : r.key)}>{r.name}</button></td>
                  <td>{r.w}</td><td>{r.l}</td><td>{r.games}</td><td>{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {detail && (
          <div className="st-detail">
            <b>{detail.name}</b>: {detail.w} W · {detail.l} L all time
            {days.length > 0 && <div className="cq-mut" style={{ marginTop: 6 }}>Recent days (wins–losses):</div>}
            {days.map(([d, v]) => <div key={d} className="cq-mut">{fmtDate(d)}: {v[0]}–{v[1]}</div>)}
            <div className="cq-mut" style={{ marginTop: 6 }}>Day-by-day detail is kept for 90 days; the all-time totals are kept for good.</div>
          </div>
        )}
      </div>

      <div className="cq-card">
        <div className="cq-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Best partners</h2>
          <div className="cq-row" role="group" aria-label="Partner period">
            {[['today', 'Today'], ['all', 'All time']].map(([k, l]) => (
              <button key={k} className={`small${pscope === k ? ' on' : ''}`} aria-pressed={pscope === k} onClick={() => setPscope(k)}>{l}</button>
            ))}
          </div>
        </div>
        {plist.length === 0 ? (
          <div className="cq-mut">No partner results yet.</div>
        ) : (
          <table className="st-table">
            <thead><tr><th>#</th><th>Pair</th><th>W</th><th>L</th><th>Games</th><th>Win %</th></tr></thead>
            <tbody>
              {plist.slice(0, 15).map((r, i) => (
                <tr key={r.key}><td>{i + 1}</td><td>{r.name}</td><td>{r.w}</td><td>{r.l}</td><td>{r.games}</td><td>{r.pct}%</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="cq-mut" style={{ marginTop: 8 }}>Partners are drawn at random, so a pair appears once they have played together.</div>
      </div>

      <div className="cq-card">
        <h2>Recent matches</h2>
        {(s.results || []).length === 0 && <div className="cq-mut">No matches recorded yet.</div>}
        {(s.results || []).slice(0, 10).map((r) => (
          <div className="cq-item" key={r.id}>
            <span>
              <span className="cq-mut">{r.date === today ? time(r.ts) : `${fmtDate(r.date)} ${time(r.ts)}`} · Court {r.court} · </span>
              🏆 {r.win.join(' & ')} <span className="cq-mut">beat</span> {r.lose.join(' & ')}
            </span>
            <span>
              <button className="small" onClick={() => update((x) => swapResult(x, r.id))} title="The other pair won">Swap winner</button>
              <button className="small" onClick={() => update((x) => undoResult(x, r.id))} aria-label="Delete result">Delete</button>
            </span>
          </div>
        ))}
        <div className="cq-mut" style={{ marginTop: 8 }}>Swap or delete only corrects the stats; it does not change the queue.</div>
      </div>

      <div className="cq-card">
        <h2>Reset</h2>
        <div className="cq-row">
          <button onClick={() => window.confirm("Remove today's results from the stats?") && update((x) => resetDay(x, today))}>Reset today</button>
          <button onClick={() => window.confirm('Delete ALL player stats, including the history? This cannot be undone.') && update(resetAll)}>Reset all stats</button>
        </div>
      </div>
    </div>
  );
}
