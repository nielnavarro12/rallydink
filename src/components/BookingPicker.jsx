import { useEffect, useState } from 'react';
import { CLOSE_MIN, OPEN_MIN, fmtDate, fmtTime, nowMin, toHHMM, toMin, todayStr, useClockTick } from '../court-queue/CourtQueue.jsx';

import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
// Updated to 60 minutes per slot (hourly blocks)
const SLOT_INTERVAL = 60;

const SLOTS = Array.from({ length: (CLOSE_MIN - OPEN_MIN) / SLOT_INTERVAL }, (_, i) => OPEN_MIN + i * SLOT_INTERVAL);
const DURATIONS = [[60, '1 h'], [120, '2 h'], [180, '3 h'], [240, '4 h']];
const hrs = (min) => `${min / 60}`.replace(/\.0$/, '') + ' h';

function Timeline({ courts, rentals, date, court, onPick }) {
  const span = CLOSE_MIN - OPEN_MIN;
  const ticks = [];
  for (let m = OPEN_MIN; m <= CLOSE_MIN; m += 120) ticks.push(m);
  return (
    <div className="tl">
      <div className="tl-row">
        <span className="tl-name" />
        <div className="tl-bar tl-axis">
          {ticks.map((m) => (
            <span key={m} style={{ left: `${((m - OPEN_MIN) / span) * 100}%` }}>
              {fmtTime(toHHMM(m)).replace(':00', '')}
            </span>
          ))}
        </div>
      </div>
      {courts.map((n) => (
        <button key={n} className={`tl-row${n === court ? ' on' : ''}`} onClick={() => onPick(n)} aria-label={`Select court ${n}`}>
          <span className="tl-name">Court {n}</span>
          <div className="tl-bar">
            {rentals
              .filter((b) => b.date === date && b.court === n)
              .map((b) => (
                <div
                  key={b.id}
                  className={`tl-seg${b.kind === 'openplay' ? ' op' : ''}`}
                  title={`${fmtTime(b.start)} – ${fmtTime(b.end)}`}
                  style={{
                    left: `${((toMin(b.start) - OPEN_MIN) / span) * 100}%`,
                    width: `${((toMin(b.end) - toMin(b.start)) / span) * 100}%`,
                  }}
                >
                  {b.name}
                </div>
              ))}
          </div>
        </button>
      ))}
    </div>
  );
}

/* Pick a court, a date and a time range, then book.
   courts: [1, 2, ...]   rentals: [{ id, court, date, start, end, name }]
   onBook({ court, date, start, end, name, note }) -> Promise<{ ok, error? }> */
export default function BookingPicker({
  courts,
  rentals,
  onBook,
  defaultName = '',
  nameLabel = 'Booking name (shown on the TV)',
  maxMinutes = Infinity,
  showNote = true,
  quote = null,
  blocks = [],
}) {
  useClockTick();
  const list = courts.length ? courts : [1];
  const [court, setCourt] = useState(list[0]);
  const [date, setDate] = useState(todayStr());
  const [sel, setSel] = useState(null); // { a: start minute, b: end minute (exclusive) }
  const [name, setName] = useState(defaultName);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); 
  useEffect(() => {
    if (defaultName) setName((n) => n || defaultName);
  }, [defaultName]);

  const everything = [...rentals, ...blocks]; // rentals and open play sessions
  const day = everything.filter((b) => b.date === date && b.court === court);
  const taken = (m) => day.find((b) => toMin(b.start) <= m && m < toMin(b.end));
  const past = (m) => date === todayStr() && m + SLOT_INTERVAL <= nowMin();
  const blocked = (m) => !!taken(m) || past(m);

  const free = (a, b) => {
    if (b - a > maxMinutes || b > CLOSE_MIN) return false;
    for (let x = a; x < b; x += SLOT_INTERVAL) if (blocked(x)) return false;
    return true;
  };

  const reset = () => {
    setSel(null);
    setMsg(null);
  };

  const clickSlot = (m) => {
    if (blocked(m)) return;
    setMsg(null);
    if (!sel || sel.b - sel.a > SLOT_INTERVAL || m < sel.a) return setSel({ a: m, b: m + SLOT_INTERVAL });
    return setSel(free(sel.a, m + SLOT_INTERVAL) ? { a: sel.a, b: m + SLOT_INTERVAL } : { a: m, b: m + SLOT_INTERVAL });
  };

  const book = async () => {
    if (!sel || !name.trim() || busy) return;
    setBusy(true);
    const b = { court, date, start: toHHMM(sel.a), end: toHHMM(sel.b), name: name.trim(), note: note.trim() };
    const r = await onBook(b);
    setBusy(false);
    if (r.ok) {
      setMsg({ t: `Booked Court ${court} on ${fmtDate(date)}, ${fmtTime(b.start)} – ${fmtTime(b.end)}.` });
      setSel(null);
      setNote('');
    } else {
      setMsg({ bad: true, t: r.error });
    }
  };
  return (
    <div>
      <div className="cq-row">
        <select
          value={court}
          onChange={(e) => {
            setCourt(+e.target.value);
            reset();
          }}
          aria-label="Court"
        >
          {list.map((n) => (
            <option key={n} value={n}>
              Court {n}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          min={todayStr()}
          onChange={(e) => {
            setDate(e.target.value || todayStr());
            reset();
          }}
          aria-label="Date"
        />
        <span className="cq-mut">{fmtDate(date)}</span>
      </div>

      <Timeline
        courts={list}
        rentals={everything}
        date={date}
        court={court}
        onPick={(n) => {
          setCourt(n);
          reset();
        }}
      />

      <div className="cq-mut" style={{ margin: '12px 0 6px' }}>
        Court {court}: tap a start time, then tap the last slot you need (or pick a duration). Each slot is 1 hour. Peach slots are already booked; mint slots are reserved for open play.
      </div>
      <div className="slots" role="group" aria-label="Time slots">
        {SLOTS.map((m) => {
          const on = sel && m >= sel.a && m < sel.b;
          return (
            <button
              key={m}
              className={`slot${on ? ' sel' : ''}${taken(m) ? ' taken' : ''}${
                taken(m) && taken(m).kind === 'openplay' ? ' op' : ''
              }${past(m) ? ' past' : ''}`}
              title={taken(m) ? (taken(m).kind === 'openplay' ? 'Open play session' : 'Already booked') : undefined}
              disabled={blocked(m)}
              aria-pressed={!!on}
              onClick={() => clickSlot(m)}
            >
              {fmtTime(toHHMM(m))}
            </button>
          );
        })}
      </div>

      {sel && (
        <div className="cq-row" style={{ marginTop: 12 }}>
          <span className="cq-mut">Duration:</span>
          {DURATIONS.map(([d, l]) => (
            <button
              key={d}
              className="small"
              disabled={!free(sel.a, sel.a + d)}
              onClick={() => setSel({ a: sel.a, b: sel.a + d })}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      <div className="cq-sel" style={{ marginTop: 12 }}>
        {sel ? (
          <>
            Selected: <b>{fmtTime(toHHMM(sel.a))} – {fmtTime(toHHMM(sel.b))}</b> ({hrs(sel.b - sel.a)})
            {quote ? <> · <b>{quote(toHHMM(sel.a), toHHMM(sel.b))}</b></> : null}
          </>
        ) : (
          <span className="cq-mut">No time selected</span>
        )}
      </div>
      <div className="cq-row" style={{ marginTop: 8 }}>
        <input
          type="text"
          value={name}
          placeholder={nameLabel}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && book()}
        />
        {showNote && (
          <input
            type="text"
            value={note}
            placeholder="Phone / note (optional)"
            onChange={(e) => setNote(e.target.value)}
          />
        )}
         {!name ? (
                 <button className="primary" onClick={() => navigate(`${location.pathname}/login`)}>Log in to book a court</button>
              ) : (
                <button className="primary" disabled={!sel || !name.trim() || busy} onClick={book}>
                  {busy ? 'Booking…' : 'Book court'}
                </button>
              )}
      </div>
      {msg && (
        <div role="status" className="cq-msg" style={msg.bad ? { color: '#d9480f' } : undefined}>
          {msg.t}
        </div>
      )}
    </div>
  );
}
