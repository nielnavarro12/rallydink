import { useState } from 'react';
import BookingPicker from '../components/BookingPicker.jsx';
import { fmtDate, fmtTime, isPastBooking, isUpcoming, useCourtStore } from '../court-queue/CourtQueue.jsx';
import { openPlayBlocks } from '../data/blocks.js';
import PayControl from '../components/PayControl.jsx';
import { useAuth, useCollection } from '../data/hooks.js';
import { recordPayment, voidSale } from '../money/domain.js';
import { daysAgo } from '../money/dates.js';
import { fmtMoney, rentalPrice, useSettings } from '../money/pricing.js';
import { bookCourt, cancelBooking } from '../data/domain.js';

export default function RentalsPage() {
  const { user, can } = useAuth();
  const [s] = useCourtStore({ readOnly: true });
  const all = useCollection('bookings'); // staff see every booking with its details
  const st = useSettings();
  const money = (n) => fmtMoney(n, st.currency);
  const sales = useCollection('sales', { where: ['date', '>=', daysAgo(60)] });
  const paidSale = (id) => sales.find((x) => !x.void && x.ref === id);
  const [err, setErr] = useState('');
  const upcoming = all.filter((b) => !isPastBooking(b)).sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start));
  const past = all.filter(isPastBooking);

  const cancel = async (b) => {
    setErr('');
    const paid = paidSale(b.id);
    if (paid) {
      if (!can('refund')) { setErr('This booking is paid. Only a manager or owner can refund it and cancel.'); return; }
      if (!window.confirm(`This booking was paid (${money(paid.total)}). Refund it and cancel the booking?`)) return;
      await voidSale(user, paid, 'booking cancelled');
    }
    const r = await cancelBooking(b);
    if (!r.ok) setErr(r.error);
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>Court rentals</h1></div>

      <div className="cq-card">
        <h2>Book a court (for a walk-in or by phone)</h2>
        <BookingPicker
          courts={s.courts.map((c) => c.n)}
          rentals={s.bookings}
          blocks={openPlayBlocks(s.schedule.filter(isUpcoming), s.courts.map((c) => c.n))}
          nameLabel="Renter name (shown on the TV)"
          quote={(a, e) => `${money(rentalPrice({ start: a, end: e }, st))}`}
          onBook={(b) => bookCourt(user, b, { admin: true })}
        />
      </div>

      <div className="cq-card">
        <h2>Upcoming rentals ({upcoming.length})</h2>
        {err && <div role="alert" style={{ color: '#d9480f' }}>{err}</div>}
        {upcoming.length === 0 && <div className="cq-mut">No upcoming rentals.</div>}
        {upcoming.map((b) => (
          <div className="cq-item" key={b.id}>
            <span>
              {fmtDate(b.date)} · {fmtTime(b.start)} – {fmtTime(b.end)} · <b>Court {b.court}</b>
              <span className="cq-mut"> · {b.name}{b.note ? ` · ${b.note}` : ''}{b.email ? ` · ${b.email}` : ''}{b.byAdmin ? ' · by staff' : ' · online'}</span>
            </span>
            <span className="cq-row" style={{ flexWrap: 'nowrap' }}>
              {paidSale(b.id) ? (
                <>
                  <span className="paid">✓ Paid {money(paidSale(b.id).total)} · {paidSale(b.id).method}</span>
                  {can('refund') && <button className="small" onClick={() => window.confirm('Remove this payment (refund)?') && voidSale(user, paidSale(b.id), 'unpaid')}>Undo</button>}
                </>
              ) : (
                <PayControl amount={rentalPrice(b, st)} onPay={({ amount, method }) => recordPayment(user, { cat: 'rental', name: `Court ${b.court} ${fmtDate(b.date)} ${fmtTime(b.start)}–${fmtTime(b.end)} (${b.name})`, amount, method, ref: b.id })} />
              )}
              <button className="small" aria-label="Cancel booking" onClick={() => cancel(b)}>Cancel</button>
            </span>
          </div>
        ))}
        {past.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button className="small" onClick={() => past.forEach((b) => cancelBooking(b))}>Clear {past.length} past rental{past.length > 1 ? 's' : ''}</button>
          </div>
        )}
      </div>
    </div>
  );
}
