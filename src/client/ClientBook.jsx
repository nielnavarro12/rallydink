// import { useState } from 'react';
// import BookingPicker from '../components/BookingPicker.jsx';
// import { fmtDate, fmtTime, isPastBooking, isUpcoming, useCourtStore } from '../court-queue/CourtQueue.jsx';
// import { openPlayBlocks } from '../data/blocks.js';
// import { useAuth, useCollection, useDocument } from '../data/hooks.js';
// import { bookCourt, cancelBooking } from '../data/domain.js';
// import { fmtMoney, rentalPrice, useSettings } from '../money/pricing.js';

// export default function ClientBook() {
//   const { user } = useAuth();
//   const [s] = useCourtStore({ readOnly: true });
//   const profile = useDocument('players', user && user.uid);
//   const st = useSettings();
//   const mine = useCollection('bookings', { where: ['uid', '==', user ? user.uid : ''] });
//   const [err, setErr] = useState('');
//   const upcoming = mine.filter((b) => !isPastBooking(b)).sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start));

//   const cancel = async (b) => {
//     if (!window.confirm('Cancel this booking?')) return;
//     setErr('');
//     const r = await cancelBooking(b);
//     if (!r.ok) setErr(r.error);
//   };

//   return (
//     <div className="cq">
//       <div className="cq-head"><h1>Book a court</h1></div>

//       <div className="cq-card">
//         <div className="cq-mut" style={{ marginBottom: 10 }}>
//           Rate: {fmtMoney(st.rentalRate, st.currency)} per hour{Number(st.peakRate) > 0 ? ` (${fmtMoney(st.peakRate, st.currency)} from ${st.peakStart})` : ''}. You pay at the venue.
//         </div>
//         <BookingPicker
//           courts={s.courts.map((c) => c.n)}
//           rentals={s.bookings}
//           blocks={openPlayBlocks(s.schedule.filter(isUpcoming), s.courts.map((c) => c.n))}
//           defaultName={(profile && profile?.name) || user?.name || ''}
//           nameLabel="Name for the booking (shown on the TV)"
//           maxMinutes={240}
//           quote={(a, e) => fmtMoney(rentalPrice({ start: a, end: e }, st), st.currency)}
//           onBook={(b) => bookCourt(user, { ...b, phone: (profile && profile.phone) || '' })}
//         />
//       </div>

//       <div className="cq-card">
//         <h2>My bookings ({upcoming.length})</h2>
//         {err && <div role="alert" style={{ color: '#d9480f' }}>{err}</div>}
//         {upcoming.length === 0 && <div className="cq-mut">You have no upcoming bookings.</div>}
//         {upcoming.map((b) => (
//           <div className="cq-item" key={b.id}>
//             <span>{fmtDate(b.date)} · {fmtTime(b.start)} – {fmtTime(b.end)} · <b>Court {b.court}</b></span>
//             <button className="small" onClick={() => cancel(b)}>Cancel</button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import BookingPicker from '../components/BookingPicker.jsx';
import { fmtDate, fmtTime, isPastBooking, isUpcoming, useCourtStore } from '../court-queue/CourtQueue.jsx';
import { openPlayBlocks } from '../data/blocks.js';
import { useAuth, useCollection, useDocument } from '../data/hooks.js';
import { bookCourt, cancelBooking } from '../data/domain.js';
import { fmtMoney, rentalPrice, useSettings } from '../money/pricing.js';

export default function ClientBook() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Capture the current URL for the redirect
  const [s] = useCourtStore({ readOnly: true });
  
  const profile = useDocument('players', user && user.uid);
  const st = useSettings();
  const mine = useCollection('bookings', { where: ['uid', '==', user ? user.uid : ''] });
  const [err, setErr] = useState('');
  
  const upcoming = user ? mine.filter((b) => !isPastBooking(b)).sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start)) : [];

  const cancel = async (b) => {
    if (!window.confirm('Cancel this booking?')) return;
    setErr('');
    const r = await cancelBooking(b);
    if (!r.ok) setErr(r.error);
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>Book a court</h1></div>

      <div className="cq-card">
        <div className="cq-mut" style={{ marginBottom: 10 }}>
          Rate: {fmtMoney(st.rentalRate, st.currency)} per hour{Number(st.peakRate) > 0 ? ` (${fmtMoney(st.peakRate, st.currency)} from ${st.peakStart})` : ''}. You pay at the venue.
        </div>
        
        {/* BookingPicker is now visible to everyone */}
        <BookingPicker
          courts={s.courts.map((c) => c.n)}
          rentals={s.bookings}
          blocks={openPlayBlocks(s.schedule.filter(isUpcoming), s.courts.map((c) => c.n))}
          defaultName={profile?.name || user?.name || ''} // Safely check for name using optional chaining
          nameLabel="Name for the booking (shown on the TV)"
          maxMinutes={240}
          quote={(a, e) => fmtMoney(rentalPrice({ start: a, end: e }, st), st.currency)}
          onBook={(b) => {
            // Intercept the booking attempt
            if (!user) {
              // Redirect to login and pass the current path so they come back after authenticating
              navigate('/login', { state: { from: location.pathname } });
              return; 
            }
            // If logged in, proceed with the booking
            bookCourt(user, { ...b, phone: profile?.phone || '' });
          }}
        />
      </div>

      {/* Only show "My bookings" if logged in */}
      {user && (
        <div className="cq-card">
          <h2>My bookings ({upcoming.length})</h2>
          {err && <div role="alert" style={{ color: '#d9480f' }}>{err}</div>}
          {upcoming.length === 0 && <div className="cq-mut">You have no upcoming bookings.</div>}
          {upcoming.map((b) => (
            <div className="cq-item" key={b.id}>
              <span>{fmtDate(b.date)} · {fmtTime(b.start)} – {fmtTime(b.end)} · <b>Court {b.court}</b></span>
              <button className="small" onClick={() => cancel(b)}>Cancel</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}