// import { useState } from 'react';
// import { fmtDate, fmtTime, isUpcoming, sortSessions, useClockTick } from '../court-queue/CourtQueue.jsx';
// import { useAuth, useCollection, useDocument, useSessions } from '../data/hooks.js';
// import { cancelSignup, signUpForSession } from '../data/domain.js';
// import { playerLevel } from '../data/levels.js';
// import { fmtMoney, sessionFee, useSettings } from '../money/pricing.js';

// export default function ClientOpenPlay() {
//   const { user } = useAuth();
//   useClockTick();
//   const sessions = sortSessions(useSessions().filter(isUpcoming));
//   const signups = useCollection('signups');
//   const profile = useDocument('players', user && user.uid);
//   const mine = playerLevel(profile);
//   const st = useSettings();
//   const [busy, setBusy] = useState('');
//   const [err, setErr] = useState('');

//   const act = async (id, fn) => {
//     setBusy(id);
//     setErr('');
//     try { await fn(); } catch { setErr('Could not update your sign-up. Try again.'); }
//     setBusy('');
//   };

//   return (
//     <div className="cq">
//       <div className="cq-head"><h1>Open play</h1></div>
//       {err && <div role="alert" style={{ color: '#d9480f', marginBottom: 10 }}>{err}</div>}
//       {sessions.length === 0 && <div className="cq-card cq-mut">No open play sessions are scheduled yet.</div>}
//       {sessions.map((se) => {
//         const going = signups.filter((g) => g.sessionId === se.id);
//         const me = going.some((g) => g.uid === user.uid);
//         const full = se.capacity > 0 && going.length >= se.capacity;
//         const mismatch = se.level !== 'All levels' && mine && se.level !== mine;
//         return (
//           <div className="cq-card" key={se.id}>
//             <div className="cq-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
//               <div>
//                 <b>{fmtDate(se.date)}</b>
//                 <div>{fmtTime(se.start)} – {fmtTime(se.end)} · {se.sport} · {se.level} · {sessionFee(se, st) > 0 ? `${fmtMoney(sessionFee(se, st), st.currency)} per player` : 'Free'}</div>
//                 {se.note && <div className="cq-mut">{se.note}</div>}
//                 <div className="cq-mut" style={{ marginTop: 4 }}>
//                   {going.length}{se.capacity ? ` / ${se.capacity}` : ''} signed up{full ? ' (full)' : ''}
//                   {going.length > 0 && ` · ${going.map((g) => g.name.split(' ')[0]).join(', ')}`}
//                 </div>
//                 {mismatch && !me && <div className="cq-mut" style={{ marginTop: 4 }}>⚠ This session is for {se.level} players. Your level is {mine}. You can still sign up.</div>}
//               </div>
//               {me ? (
//                 <button disabled={busy === se.id} onClick={() => act(se.id, () => cancelSignup(se.id, user.uid))}>Cancel sign-up</button>
//               ) : (
//                 <button className="primary" disabled={full || busy === se.id} onClick={() => act(se.id, () => signUpForSession(user, se, profile))}>{full ? 'Full' : 'Sign up'}</button>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for login redirect
import { fmtDate, fmtTime, isUpcoming, sortSessions, useClockTick } from '../court-queue/CourtQueue.jsx';
import { useAuth, useCollection, useDocument, useSessions } from '../data/hooks.js';
import { cancelSignup, signUpForSession } from '../data/domain.js';
import { playerLevel } from '../data/levels.js';
import { fmtMoney, sessionFee, useSettings } from '../money/pricing.js';

export default function ClientOpenPlay() {
  const { user } = useAuth();
  const navigate = useNavigate(); // Added navigation
  useClockTick();
  const sessions = sortSessions(useSessions().filter(isUpcoming));
  const signups = useCollection('signups');
  
  // Safely handle null user
  const profile = useDocument('players', user && user.uid);
  const mine = playerLevel(profile);
  const st = useSettings();
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const act = async (id, fn) => {
    setBusy(id);
    setErr('');
    try { await fn(); } catch { setErr('Could not update your sign-up. Try again.'); }
    setBusy('');
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>Open play</h1></div>
      {err && <div role="alert" style={{ color: '#d9480f', marginBottom: 10 }}>{err}</div>}
      {sessions.length === 0 && <div className="cq-card cq-mut">No open play sessions are scheduled yet.</div>}
      {sessions.map((se) => {
        const going = signups.filter((g) => g.sessionId === se.id);
        
        // Ensure user exists before checking their uid
        const me = user ? going.some((g) => g.uid === user.uid) : false;
        
        const full = se.capacity > 0 && going.length >= se.capacity;
        const mismatch = se.level !== 'All levels' && mine && se.level !== mine;
        
        return (
          <div className="cq-card" key={se.id}>
            <div className="cq-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <b>{fmtDate(se.date)}</b>
                <div>{fmtTime(se.start)} – {fmtTime(se.end)} · {se.sport} · {se.level} · {sessionFee(se, st) > 0 ? `${fmtMoney(sessionFee(se, st), st.currency)} per player` : 'Free'}</div>
                {se.note && <div className="cq-mut">{se.note}</div>}
                <div className="cq-mut" style={{ marginTop: 4 }}>
                  {going.length}{se.capacity ? ` / ${se.capacity}` : ''} signed up{full ? ' (full)' : ''}
                  {going.length > 0 && ` · ${going.map((g) => g.name.split(' ')[0]).join(', ')}`}
                </div>
                {user && mismatch && !me && <div className="cq-mut" style={{ marginTop: 4 }}>⚠ This session is for {se.level} players. Your level is {mine}. You can still sign up.</div>}
              </div>
              
              {/* If user is not logged in, prompt them to login. Otherwise, show normal buttons */}
              {!user ? (
                 <button className="primary" onClick={() => navigate('/login')}>Log in to sign up</button>
              ) : me ? (
                <button disabled={busy === se.id} onClick={() => act(se.id, () => cancelSignup(se.id, user.uid))}>Cancel sign-up</button>
              ) : (
                <button className="primary" disabled={full || busy === se.id} onClick={() => act(se.id, () => signUpForSession(user, se, profile))}>{full ? 'Full' : 'Sign up'}</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}