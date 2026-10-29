import { useState } from 'react';
import { fmtDate, fmtTime, isPastBooking, todayStr } from '../court-queue/CourtQueue.jsx';
import PayControl from '../components/PayControl.jsx';
import { useAuth, useCollection } from '../data/hooks.js';
import { recordPayment, voidSale } from '../money/domain.js';
import { daysAgo, monthStart } from '../money/dates.js';
import { CATS, summarize } from '../money/income.js';
import { fmtMoney, rentalPrice, sessionFee, useSettings } from '../money/pricing.js';

const RANGES = [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['custom', 'Custom']];
const COLORS = { rental: '#ffb36b', openplay: '#5fdcb5', product: '#9b8cff' };

export default function IncomePage() {
  const { user, can } = useAuth();
  const st = useSettings();
  const money = (n) => fmtMoney(n, st.currency);
  const today = todayStr();
  const [range, setRange] = useState('7');
  const [custom, setCustom] = useState({ from: daysAgo(30), to: today });
  const from = range === 'today' ? today : range === '7' ? daysAgo(6) : range === '30' ? daysAgo(29) : range === 'month' ? monthStart() : custom.from;
  const to = range === 'custom' ? custom.to : today;

  // load the sales from the earliest of: the range start, or 60 days back (to know what is already paid)
  const loadFrom = from < daysAgo(60) ? from : daysAgo(60);
  const sales = useCollection('sales', { where: ['date', '>=', loadFrom] });
  const bookings = useCollection('bookings');
  const sessions = useCollection('sessions');
  const signups = useCollection('signups');
  const sum = summarize(sales, from, to);
  const max = Math.max(1, ...sum.days.map((d) => d.total));
  const paidRef = (ref) => sales.find((s) => !s.void && s.ref === ref);

  // money still to collect: rentals and open play entries up to today that have no payment yet
  const unpaidRentals = bookings.filter((b) => b.date <= today && !paidRef(b.id)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const unpaidPlay = signups
    .map((g) => ({ g, se: sessions.find((x) => x.id === g.sessionId) }))
    .filter(({ g, se }) => se && se.date <= today && !paidRef(g.id) && sessionFee(se, st) > 0);

  const recent = [...sales].filter((s) => s.date >= from && s.date <= to).sort((a, b) => b.ts - a.ts).slice(0, 30);
  const owed = unpaidRentals.reduce((n, b) => n + rentalPrice(b, st), 0) + unpaidPlay.reduce((n, { se }) => n + sessionFee(se, st), 0);

  return (
    <div className="cq">
      <div className="cq-head"><h1>Income</h1></div>

      <div className="cq-card">
        <div className="cq-row" role="group" aria-label="Period">
          {RANGES.map(([k, l]) => <button key={k} className={`small${range === k ? ' on' : ''}`} aria-pressed={range === k} onClick={() => setRange(k)}>{l}</button>)}
          {range === 'custom' && (
            <>
              <input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} aria-label="From" />
              <span className="cq-mut">to</span>
              <input type="date" value={custom.to} min={custom.from} max={today} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} aria-label="To" />
            </>
          )}
        </div>
      </div>

      <div className="cq-stats">
        <div className="cq-stat"><span>{money(sum.total)}</span>total income</div>
        {CATS.map(([k, l]) => <div className="cq-stat" key={k}><span style={{ color: COLORS[k] }}>{money(sum.byCat[k])}</span>{l}</div>)}
        <div className="cq-stat"><span>{money(owed)}</span>still to collect</div>
      </div>

      <div className="cq-card">
        <h2>By day</h2>
        {sum.days.length === 0 && <div className="cq-mut">No income recorded in this period.</div>}
        {sum.days.map((d) => (
          <div className="bar-row" key={d.date}>
            <span className="bar-label">{fmtDate(d.date).replace('Today · ', '')}</span>
            <span className="bar-track">
              {CATS.map(([k]) => d[k] > 0 && <span key={k} className="bar-seg" title={`${k}: ${money(d[k])}`} style={{ width: `${(d[k] / max) * 100}%`, background: COLORS[k] }} />)}
            </span>
            <b className="bar-val">{money(d.total)}</b>
          </div>
        ))}
        <div className="cq-row" style={{ marginTop: 10 }}>
          {CATS.map(([k, l]) => <span key={k} className="cq-mut"><span className="dot" style={{ background: COLORS[k] }} /> {l}</span>)}
        </div>
        {Object.keys(sum.byMethod).length > 0 && (
          <div className="cq-mut" style={{ marginTop: 10 }}>
            By payment method: {Object.entries(sum.byMethod).map(([m, v]) => `${m} ${money(v)}`).join(' · ')}
          </div>
        )}
      </div>

      <div className="cq-card">
        <h2>To collect ({unpaidRentals.length + unpaidPlay.length})</h2>
        {unpaidRentals.length + unpaidPlay.length === 0 && <div className="cq-mut">Everything up to today is paid.</div>}
        {unpaidRentals.map((b) => (
          <div className="cq-item" key={b.id}>
            <span>Rental · {fmtDate(b.date)} {fmtTime(b.start)} – {fmtTime(b.end)} · Court {b.court} · {b.name}{isPastBooking(b) ? '' : ' (in progress)'}</span>
            <PayControl amount={rentalPrice(b, st)} onPay={({ amount, method }) => recordPayment(user, { cat: 'rental', name: `Court ${b.court} ${fmtDate(b.date)} ${fmtTime(b.start)}–${fmtTime(b.end)} (${b.name})`, amount, method, ref: b.id })} />
          </div>
        ))}
        {unpaidPlay.map(({ g, se }) => (
          <div className="cq-item" key={g.id}>
            <span>Open play · {fmtDate(se.date)} {fmtTime(se.start)} · {g.name}</span>
            <PayControl amount={sessionFee(se, st)} onPay={({ amount, method }) => recordPayment(user, { cat: 'openplay', name: `Open play ${fmtDate(se.date)} (${g.name})`, amount, method, ref: g.id })} />
          </div>
        ))}
      </div>

      <div className="cq-card">
        <h2>Recent sales</h2>
        {recent.length === 0 && <div className="cq-mut">No sales in this period.</div>}
        {recent.map((s) => (
          <div className="cq-item" key={s.id} style={s.void ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}>
            <span>
              {new Date(s.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} ·{' '}
              {s.lines.map((l) => `${l.qty > 1 ? `${l.qty}× ` : ''}${l.name}`).join(', ')}
              <span className="cq-mut"> · {s.method}{s.byName ? ` · ${s.byName}` : ''}{s.void ? ' · voided' : ''}</span>
            </span>
            <span>
              <b>{money(s.total)}</b>
              {!s.void && can('refund') && <button className="small" onClick={() => window.confirm('Void this sale? Product stock is returned.') && voidSale(user, s)}>Void</button>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
