import { useEffect, useState, useMemo } from 'react';
import {
  CLOSE_MIN,
  OPEN_MIN,
  fmtDate,
  fmtTime,
  nowMin,
  toHHMM,
  toMin,
  todayStr,
  useClockTick,
} from '../court-queue/courtQueue.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarPlus, Crown, LogIn, Tag, X } from 'lucide-react';
import { useCollection } from '../data/hooks.js';
import { useHub } from '../hub/HubProvider.jsx';
import { fmtMoney, useSettings } from '../money/pricing.js';
import { sendBookingToPos } from '../money/sendToPos.js';
import Icon from './Icon.jsx';

const SLOT_INTERVAL = 60;
const SLOTS = Array.from(
  { length: (CLOSE_MIN - OPEN_MIN) / SLOT_INTERVAL },
  (_, i) => OPEN_MIN + i * SLOT_INTERVAL
);
const DURATIONS = [
  [60, '1 h'],
  [120, '2 h'],
  [180, '3 h'],
  [240, '4 h'],
];
const hrs = (min) => `${min / 60}`.replace(/\.0$/, '') + ' h';

function normalizeDoc(item) {
  if (!item) return null;
  if (item.doc && typeof item.doc === 'object') {
    return { id: item.id, ...item.doc };
  }
  return item;
}

// Flat membership rule lookup matching BenefitRuleForm (no tiering)
function evaluateCourtDiscount(rules) {
  if (!Array.isArray(rules)) return null;
  const now = new Date();

  const matching = rules
    .filter((r) => {
      if (r.isActive === false || r.active === false) return false;
      const code = r.benefitCode || r.benefitType;
      if (code !== 'BOOKING_DISCOUNT' && code !== 'COURT_DISCOUNT') return false;

      const vType = r.valueType || r.discountType;
      if (vType !== 'PERCENTAGE' && vType !== 'PERCENT' && vType !== 'FIXED' && vType !== 'AMOUNT') {
        return false;
      }

      if (r.validFrom) {
        const start = r.validFrom.toDate ? r.validFrom.toDate() : new Date(r.validFrom);
        if (now < start) return false;
      }
      if (r.validUntil) {
        const end = r.validUntil.toDate ? r.validUntil.toDate() : new Date(r.validUntil);
        if (now > end) return false;
      }
      return true;
    })
    .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));

  return matching[0] || null;
}

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
        <button
          key={n}
          type="button"
          className={`tl-row${n === court ? ' on' : ''}`}
          onClick={() => onPick(n)}
          aria-label={`Select court ${n}`}
        >
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
  hourlyRate = null,
  posPath = 'pos',
}) {
  useClockTick();
  const list = courts.length ? courts : [1];
  const [court, setCourt] = useState(list[0]);
  const [date, setDate] = useState(todayStr());
  const [sel, setSel] = useState(null);
  const [name, setName] = useState(defaultName);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const [activeMember, setActiveMember] = useState(null);
  const [memberQuery, setMemberQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const hub = useHub();
  const st = useSettings();
  const money = (n) => fmtMoney(n, st.currency);

  const activeHubId = hub?.id || hub?.doc?.id || null;
  const effectiveHourlyRate = Number(hourlyRate ?? st.courtHourlyRate ?? st.hourlyRate ?? 0);

  const rawMemberships = useCollection('memberships');
  const rawBenefitRules = useCollection('benefitRules');

  const activeHubMembers = useMemo(() => {
    const now = new Date();
    return rawMemberships
      .map(normalizeDoc)
      .filter((m) => {
        if (!m) return false;
        if (activeHubId && m.hubId && m.hubId !== activeHubId) return false;
        if ((m.status || '').toLowerCase() !== 'active') return false;
        if (m.validUntil) {
          const end = m.validUntil.toDate ? m.validUntil.toDate() : new Date(m.validUntil);
          if (!Number.isNaN(end.getTime()) && now > end) return false;
        }
        return true;
      });
  }, [rawMemberships, activeHubId]);

  const hubRules = useMemo(() => {
    return rawBenefitRules
      .map(normalizeDoc)
      .filter(
        (r) =>
          r &&
          (!activeHubId || !r.hubId || r.hubId === activeHubId) &&
          r.isActive !== false &&
          r.active !== false
      );
  }, [rawBenefitRules, activeHubId]);

  useEffect(() => {
    const stateMember = location.state?.bookingMember;
    const rawStored = sessionStorage.getItem('pending_booking_member');

    let incoming = stateMember || null;
    if (!incoming && rawStored) {
      try {
        incoming = JSON.parse(rawStored);
        sessionStorage.removeItem('pending_booking_member');
      } catch {
        // ignore malformed storage
      }
    }

    if (incoming) {
      setActiveMember(incoming);
      if (incoming.memberName) setName(incoming.memberName);
      if (incoming.memberCode) {
        setNote((prev) => prev || `Member: ${incoming.memberCode}`);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (defaultName && !activeMember) setName((n) => n || defaultName);
  }, [defaultName, activeMember]);

  const memberMatches = useMemo(() => {
    const term = memberQuery.trim().toLowerCase();
    if (!term) return [];
    return activeHubMembers
      .filter(
        (m) =>
          (m.memberCode || '').toLowerCase().includes(term) ||
          (m.memberName || '').toLowerCase().includes(term) ||
          (m.phone || '').toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [activeHubMembers, memberQuery]);

  const courtRule = useMemo(
    () => (activeMember ? evaluateCourtDiscount(hubRules) : null),
    [hubRules, activeMember]
  );

  // Preview pricing & member discount
  const pricing = useMemo(() => {
    if (!sel) return null;
    const durationHours = (sel.b - sel.a) / 60;

    let grossAmount =
      effectiveHourlyRate > 0 ? Math.round(effectiveHourlyRate * durationHours * 100) / 100 : 0;
    if (grossAmount === 0 && typeof quote === 'function') {
      const rawQuote = quote(toHHMM(sel.a), toHHMM(sel.b));
      if (typeof rawQuote === 'number') {
        grossAmount = rawQuote;
      } else if (typeof rawQuote === 'string') {
        const parsed = parseFloat(rawQuote.replace(/[^0-9.]/g, ''));
        if (!Number.isNaN(parsed)) grossAmount = parsed;
      }
    }

    let discountAmount = 0;
    let discountLabel = '';

    if (courtRule && grossAmount > 0) {
      const valType = courtRule.valueType || courtRule.discountType;
      const valNum = Number(courtRule.value ?? courtRule.discountValue) || 0;
      if (valType === 'PERCENTAGE' || valType === 'PERCENT') {
        discountAmount = Math.round(grossAmount * (Math.min(100, valNum) / 100) * 100) / 100;
        discountLabel = `${valNum}% off`;
      } else {
        discountAmount = Math.min(grossAmount, valNum);
        discountLabel = `${money(valNum)} off`;
      }
    }

    const finalAmount = Math.max(0, Math.round((grossAmount - discountAmount) * 100) / 100);
    return { durationHours, grossAmount, discountAmount, finalAmount, discountLabel };
  }, [sel, effectiveHourlyRate, quote, courtRule]);

  const handleSelectMember = (m) => {
    setActiveMember(m);
    setMemberQuery('');
    setName(m.memberName || '');
    if (m.memberCode) {
      setNote((prev) => prev || `Member: ${m.memberCode}`);
    }
  };

  const handleClearMember = () => {
    setActiveMember(null);
    setMemberQuery('');
  };

  const everything = [...rentals, ...blocks];
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
    if (!sel || sel.b - sel.a > SLOT_INTERVAL || m < sel.a)
      return setSel({ a: m, b: m + SLOT_INTERVAL });
    return setSel(
      free(sel.a, m + SLOT_INTERVAL)
        ? { a: sel.a, b: m + SLOT_INTERVAL }
        : { a: m, b: m + SLOT_INTERVAL }
    );
  };

  // Save booking and hand off directly to POS / Checkout
  const book = async () => {
    if (!sel || !name.trim() || busy) return;
    setBusy(true);

    const startStr = toHHMM(sel.a);
    const endStr = toHHMM(sel.b);
    const durationHours = pricing?.durationHours || (sel.b - sel.a) / 60;

    const b = {
      court,
      date,
      start: startStr,
      end: endStr,
      name: name.trim(),
      note: note.trim(),
      memberId: activeMember?.id || null,
      memberCode: activeMember?.memberCode || null,
      memberName: activeMember?.memberName || null,
      originalAmount: pricing?.grossAmount ?? 0,
      discountAmount: pricing?.discountAmount ?? 0,
      amount: pricing?.finalAmount ?? 0,
      appliedRuleId: courtRule?.id || null,
      paymentStatus: 'pending_pos',
    };

    const r = await onBook(b);
    setBusy(false);

    if (!r.ok) {
      setMsg({ bad: true, t: r.error });
      return;
    }

    // Handoff to POS / Checkout page immediately
    sendBookingToPos({
      bookingId: r.id || null,
      courtName: `Court ${court}`,
      bookingDate: date,
      startTime: startStr,
      endTime: endStr,
      durationHours,
      hourlyRate: effectiveHourlyRate,
      originalAmount: pricing?.grossAmount ?? 0,
      member: activeMember,
      onNavigate: () => navigate(posPath),
    });
  };

  return (
    <div>
      {/* Member Banner / Quick Lookup for Court Discount */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        {activeMember ? (
          <div
            className="cq-sel"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderColor: 'rgba(43, 138, 62, 0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 700,
                  color: '#2b8a3e',
                }}
              >
                <Icon icon={Crown} size={15} />
                {activeMember.memberName} · Member
              </span>
              <span className="cq-mut">{activeMember.memberCode}</span>
              {courtRule ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#2b8a3e',
                  }}
                >
                  <Icon icon={Tag} size={13} />
                  {courtRule.title || 'Member Booking Discount'} active
                </span>
              ) : (
                <span className="cq-mut" style={{ fontSize: '0.8rem' }}>
                  (No booking discount rule active)
                </span>
              )}
            </div>
            <button
              type="button"
              className="small"
              onClick={handleClearMember}
              title="Clear member discount"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Icon icon={X} size={14} />
              Remove
            </button>
          </div>
        ) : (
          activeHubMembers.length > 0 && (
            <div style={{ position: 'relative', maxWidth: 360 }}>
              <input
                type="text"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="👑 Apply Member Discount (Code, Name, Phone)…"
                aria-label="Search member for court discount"
                style={{ width: '100%' }}
              />
              {memberQuery.trim() && (
                <div
                  className="cq-sel"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '100%',
                    marginTop: 4,
                    zIndex: 40,
                    padding: 4,
                  }}
                >
                  {memberMatches.length === 0 ? (
                    <div className="cq-mut" style={{ padding: '6px 8px', fontSize: '0.85rem' }}>
                      No active member matching "{memberQuery}".
                    </div>
                  ) : (
                    memberMatches.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMember(m)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '6px 8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>
                          <b>{m.memberName}</b> <span className="cq-mut">({m.memberCode})</span>
                        </span>
                        <b style={{ color: '#2b8a3e' }}>MEMBER</b>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Court & Date Controls */}
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
        Court {court}: tap a start time, then tap the last slot you need (or pick a duration). Each
        slot is 1 hour. Peach slots are already booked; mint slots are reserved for open play.
      </div>
      <div className="slots" role="group" aria-label="Time slots">
        {SLOTS.map((m) => {
          const on = sel && m >= sel.a && m < sel.b;
          return (
            <button
              key={m}
              type="button"
              className={`slot${on ? ' sel' : ''}${taken(m) ? ' taken' : ''}${
                taken(m) && taken(m).kind === 'openplay' ? ' op' : ''
              }${past(m) ? ' past' : ''}`}
              title={
                taken(m)
                  ? taken(m).kind === 'openplay'
                    ? 'Open play session'
                    : 'Already booked'
                  : undefined
              }
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
              type="button"
              className="small"
              disabled={!free(sel.a, sel.a + d)}
              onClick={() => setSel({ a: sel.a, b: sel.a + d })}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Selected Time & Discounted Price Summary */}
      <div className="cq-sel" style={{ marginTop: 12 }}>
        {sel ? (
          <>
            Selected:{' '}
            <b>
              {fmtTime(toHHMM(sel.a))} – {fmtTime(toHHMM(sel.b))}
            </b>{' '}
            ({hrs(sel.b - sel.a)})
            {pricing && pricing.grossAmount > 0 ? (
              <>
                {' · '}
                {pricing.discountAmount > 0 ? (
                  <>
                    <s className="cq-mut">{money(pricing.grossAmount)}</s>{' '}
                    <span style={{ color: '#2b8a3e', fontWeight: 700 }}>
                      {money(pricing.finalAmount)} ({pricing.discountLabel})
                    </span>
                  </>
                ) : (
                  <b>{money(pricing.grossAmount)}</b>
                )}
              </>
            ) : quote ? (
              <>
                {' · '}
                <b>{quote(toHHMM(sel.a), toHHMM(sel.b))}</b>
              </>
            ) : null}
          </>
        ) : (
          <span className="cq-mut">No time selected</span>
        )}
      </div>

      {/* Booking Inputs & Submit */}
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
          <button
            type="button"
            className="primary"
            onClick={() => navigate(`${location.pathname}/login`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Icon icon={LogIn} size={20} />
            Log in to book a court
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            disabled={!sel || !name.trim() || busy}
            onClick={book}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Icon icon={CalendarPlus} size={20} />
            {busy ? 'Proceeding to Checkout…' : 'Book & Proceed to POS'}
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