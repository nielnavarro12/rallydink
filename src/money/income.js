export const CATS = [['rental', 'Court rentals'], ['openplay', 'Open play'], ['product', 'Products']];
const round = (n) => Math.round(n * 100) / 100;

/* Income for the sales between two dates (inclusive, 'YYYY-MM-DD'). Voided sales are ignored.
   Returns totals, totals by category and payment method, and one row per day. */
export function summarize(sales, from, to) {
  const out = { total: 0, count: 0, byCat: { rental: 0, openplay: 0, product: 0 }, byMethod: {}, days: [] };
  const days = {};
  (sales || []).filter((s) => !s.void && s.date >= from && s.date <= to).forEach((s) => {
    out.total += s.total;
    out.count += 1;
    out.byMethod[s.method] = (out.byMethod[s.method] || 0) + s.total;
    const d = days[s.date] || (days[s.date] = { date: s.date, total: 0, rental: 0, openplay: 0, product: 0 });
    d.total += s.total;
    s.lines.forEach((l) => {
      const v = l.price * l.qty;
      out.byCat[l.cat] = (out.byCat[l.cat] || 0) + v;
      d[l.cat] = (d[l.cat] || 0) + v;
    });
  });
  out.total = round(out.total);
  Object.keys(out.byCat).forEach((k) => { out.byCat[k] = round(out.byCat[k]); });
  Object.keys(out.byMethod).forEach((k) => { out.byMethod[k] = round(out.byMethod[k]); });
  out.days = Object.values(days).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, total: round(d.total) }));
  return out;
}
