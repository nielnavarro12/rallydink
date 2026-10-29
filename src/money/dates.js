const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); };
export const monthStart = () => { const d = new Date(); return fmt(new Date(d.getFullYear(), d.getMonth(), 1)); };
// stable for the whole day, so it can be used as part of a database query
export const dayStartMs = (n = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d.getTime(); };
