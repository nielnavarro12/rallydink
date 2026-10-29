import { data } from '../data/index.js';
import { newId } from '../data/ids.js';
import { todayStr } from '../court-queue/CourtQueue.jsx';

/* POS, inventory and payments. Income is always computed from the `sales` records:
   sale = { ts, date, lines: [{ cat: 'rental' | 'openplay' | 'product', id, name, price, qty }], total, method, ref, note, void }
   `ref` links a payment to a booking id (rental) or a signup id (open play). */
const who = (user) => ({ by: user.uid, byName: user.name || user.email || 'staff' });
const round = (n) => Math.round(n * 100) / 100;

/* ----- products ----- */
export async function saveProduct(p) {
  const { id, ...rest } = p;
  const key = id || newId();
  await data.setDoc('products', key, { ...rest, updatedAt: Date.now() }, { merge: true });
  return key;
}
export const deleteProduct = (id) => data.deleteDoc('products', id);

/* delta: add or remove units; setTo: a counted total. Every change is written to the stock history. */
export async function changeStock(user, productId, { delta, setTo, reason }) {
  try {
    await data.transaction(async (tx) => {
      const p = await tx.get('products', productId);
      if (!p) throw new Error('missing');
      const before = Number(p.stock) || 0;
      const after = setTo != null ? Number(setTo) : before + Number(delta);
      if (!(after >= 0)) throw new Error('negative');
      tx.set('products', productId, { ...p, stock: after, updatedAt: Date.now() });
      tx.set('stockLog', newId(), { productId, name: p.name, delta: after - before, after, reason, ts: Date.now(), ...who(user) });
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message === 'negative' ? 'Stock cannot go below zero.' : 'Could not update the stock.' };
  }
}

/* ----- POS checkout: stock check, stock update, stock history and the sale in one transaction ----- */
export async function checkout(user, lines, { method, tendered, note } = {}) {
  const clean = lines.filter((l) => l.qty > 0);
  if (!clean.length) return { ok: false, error: 'The cart is empty.' };
  const total = round(clean.reduce((n, l) => n + l.price * l.qty, 0));
  const saleId = newId();
  const need = {};
  clean.forEach((l) => { if (l.cat === 'product') need[l.id] = (need[l.id] || 0) + l.qty; });
  try {
    await data.transaction(async (tx) => {
      const prods = {};
      for (const id of Object.keys(need)) prods[id] = await tx.get('products', id); // all reads first
      for (const id of Object.keys(need)) {
        const p = prods[id];
        if (!p) throw new Error('missing');
        if (p.track && (Number(p.stock) || 0) < need[id]) throw new Error(`stock:${p.name}`);
      }
      Object.keys(need).forEach((id) => {
        const p = prods[id];
        if (!p.track) return;
        const after = (Number(p.stock) || 0) - need[id];
        tx.set('products', id, { ...p, stock: after, updatedAt: Date.now() });
        tx.set('stockLog', newId(), { productId: id, name: p.name, delta: -need[id], after, reason: 'sale', ref: saleId, ts: Date.now(), ...who(user) });
      });
      tx.set('sales', saleId, {
        ts: Date.now(), date: todayStr(), method: method || 'Cash', tendered: Number(tendered) || 0, note: note || '', ref: '',
        lines: clean.map((l) => ({ cat: l.cat, id: l.id || '', name: l.name, price: Number(l.price), qty: l.qty })), total, ...who(user),
      });
    });
    return { ok: true, id: saleId, total };
  } catch (e) {
    const m = (e && e.message) || '';
    if (m.startsWith('stock:')) return { ok: false, error: `Not enough stock for ${m.slice(6)}.` };
    if (m === 'missing') return { ok: false, error: 'A product in the cart no longer exists.' };
    return { ok: false, error: 'Could not complete the sale. Check your connection and try again.' };
  }
}

/* ----- payments for a booking or an open play sign-up ----- */
export async function recordPayment(user, { cat, name, amount, method, ref, note }) {
  const id = newId();
  const total = round(Number(amount) || 0);
  await data.setDoc('sales', id, {
    ts: Date.now(), date: todayStr(), method: method || 'Cash', tendered: 0, note: note || '', ref: ref || '',
    lines: [{ cat, id: '', name, price: total, qty: 1 }], total, ...who(user),
  });
  return id;
}

/* Void a sale (refund). Product lines return to stock. */
export async function voidSale(user, sale, reason = '') {
  try {
    await data.transaction(async (tx) => {
      const cur = await tx.get('sales', sale.id);
      if (!cur || cur.void) throw new Error('gone');
      const back = {};
      cur.lines.forEach((l) => { if (l.cat === 'product' && l.id) back[l.id] = (back[l.id] || 0) + l.qty; });
      const prods = {};
      for (const id of Object.keys(back)) prods[id] = await tx.get('products', id);
      Object.keys(back).forEach((id) => {
        const p = prods[id];
        if (!p || !p.track) return;
        const after = (Number(p.stock) || 0) + back[id];
        tx.set('products', id, { ...p, stock: after, updatedAt: Date.now() });
        tx.set('stockLog', newId(), { productId: id, name: p.name, delta: back[id], after, reason: 'void', ref: sale.id, ts: Date.now(), ...who(user) });
      });
      tx.set('sales', sale.id, { ...cur, void: true, voidedAt: Date.now(), voidReason: reason });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not void the sale.' };
  }
}
