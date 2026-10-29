import { useMemo } from 'react';
import { SLOT, toMin } from '../court-queue/CourtQueue.jsx';
import { useDocument } from '../data/hooks.js';

/* Rates (settings/pricing, readable by everyone so clients can see prices; only staff can change them) */
export const DEFAULT_SETTINGS = { currency: '₱', rentalRate: 300, peakRate: 0, peakStart: '17:00', openPlayFee: 100 };

export function useSettings() {
  const doc = useDocument('settings', 'pricing');
  return useMemo(() => ({ ...DEFAULT_SETTINGS, ...(doc || {}) }), [doc]);
}

export const fmtMoney = (n, cur = '₱') =>
  `${cur}${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// court rental price: every 30-minute slot costs half the hourly rate (the peak rate applies from peakStart)
export function rentalPrice(b, st) {
  let total = 0;
  for (let m = toMin(b.start); m < toMin(b.end); m += SLOT) {
    const peak = Number(st.peakRate) > 0 && m >= toMin(st.peakStart || '17:00');
    total += Number(peak ? st.peakRate : st.rentalRate) * (SLOT / 60);
  }
  return Math.round(total * 100) / 100;
}

// open play fee per player: the session's own fee, or the default
export const sessionFee = (se, st) => (se && se.fee != null && se.fee !== '' ? Number(se.fee) : Number(st.openPlayFee));

export const METHODS = ['Cash', 'GCash', 'Card', 'Bank transfer', 'Other'];
