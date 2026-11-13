import { data } from '../data/index.js';
import { newId } from '../data/ids.js';
import { todayStr } from '../court-queue/courtQueue.js';

/* POS, inventory and payments. Income is always computed from the `sales` records:
   sale = { ts, date, lines: [{ cat: 'rental' | 'openplay' | 'product', id, name, price, qty }], total, method, ref, void }
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
export async function checkout(
  user,
  lines,
  { method, tendered, note, grossAmount, itemDiscountsTotal = 0, cartDiscount = {}, discount = 0, total } = {}
) {
  const clean = lines.filter((l) => l.qty > 0);
  if (!clean.length) return { ok: false, error: 'The cart is empty.' };

  // Original gross sum before discount if not explicitly passed
  const calculatedGross = round(clean.reduce((n, l) => n + Number(l.price) * l.qty, 0));
  const finalGross = Number(grossAmount) != null ? round(Number(grossAmount)) : calculatedGross;
  
  // Total overall discount
  const finalDiscount = round(Number(discount) || 0);
  
  // Final net total amount after discount
  const finalTotal = round(Number(total) != null ? Number(total) : Math.max(0, finalGross - finalDiscount));

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

      // Structure line items with full discount metadata
      const formattedLines = clean.map((l) => ({
        cat: l.cat,
        id: l.id || '',
        name: l.name,
        price: Number(l.price),
        qty: l.qty,
        discountType: l.discountType || 'amount',
        discountValue: Number(l.discountValue) || 0,
        unitPriceAfterDiscount: Number(l.unitPriceAfterDiscount) != null ? Number(l.unitPriceAfterDiscount) : Number(l.price),
        lineDiscountAmount: Number(l.lineDiscountAmount) || 0,
        originalLineTotal: Number(l.originalLineTotal) != null ? Number(l.originalLineTotal) : round(Number(l.price) * l.qty),
        discountedLineTotal: Number(l.discountedLineTotal) != null ? Number(l.discountedLineTotal) : round((Number(l.unitPriceAfterDiscount) || Number(l.price)) * l.qty),
      }));

      tx.set('sales', saleId, {
        ts: Date.now(),
        date: todayStr(),
        method: method || 'Cash',
        tendered: Number(tendered) || 0,
        note: note || '',
        ref: '',
        lines: formattedLines,
        grossAmount: finalGross,
        itemDiscountsTotal: round(Number(itemDiscountsTotal) || 0),
        cartDiscount: {
          type: cartDiscount.type || 'amount',
          value: Number(cartDiscount.value) || 0,
          amount: round(Number(cartDiscount.amount) || 0),
        },
        discount: finalDiscount,
        total: finalTotal,
        ...who(user),
      });
    });
    return { ok: true, id: saleId, total: finalTotal };
  } catch (e) {
    const m = (e && e.message) || '';
    if (m.startsWith('stock:')) return { ok: false, error: `Not enough stock for ${m.slice(6)}.` };
    if (m === 'missing') return { ok: false, error: 'A product in the cart no longer exists.' };
    return { ok: false, error: 'Could not complete the sale. Check your connection and try again.' };
  }
}

/* ----- payments for a booking or an open play sign-up ----- */
export async function recordPayment(user, { cat, name, discount = 0, amount, method, ref, note }) {
  const id = newId();
  const total = round(Number(amount) || 0);
  const discountVal = round(Number(discount) || 0);
  const grossAmount = round(total + discountVal);

  await data.setDoc('sales', id, {
    ts: Date.now(),
    date: todayStr(),
    method: method || 'Cash',
    tendered: 0,
    note: note || '',
    ref: ref || '',
    grossAmount,
    discount: discountVal,
    lines: [{ cat, id: '', name, price: grossAmount, qty: 1 }],
    total,
    ...who(user),
  });
  return id;
}

/* Void a sale (refund). Product lines return to stock. */
// export async function voidSale(user, sale, reason = '') {
//   try {
//     await data.transaction(async (tx) => {
//       const cur = await tx.get('sales', sale.id);
//       if (!cur || cur.void) throw new Error('gone');
//       const back = {};
//       cur.lines.forEach((l) => { if (l.cat === 'product' && l.id) back[l.id] = (back[l.id] || 0) + l.qty; });
//       const prods = {};
//       for (const id of Object.keys(back)) prods[id] = await tx.get('products', id);
//       Object.keys(back).forEach((id) => {
//         const p = prods[id];
//         if (!p || !p.track) return;
//         const after = (Number(p.stock) || 0) + back[id];
//         tx.set('products', id, { ...p, stock: after, updatedAt: Date.now() });
//         tx.set('stockLog', newId(), { productId: id, name: p.name, delta: back[id], after, reason: 'void', ref: sale.id, ts: Date.now(), ...who(user) });
//       });
//       tx.set('sales', sale.id, { ...cur, void: true, voidedAt: Date.now(), voidReason: reason });
//     });
//     return { ok: true };
//   } catch {
//     return { ok: false, error: 'Could not void the sale.' };
//   }
// }
/* Void a sale (refund). Product lines return to stock; memberships are suspended. */
export async function voidSale(user, sale, reason = '') {
  try {
    await data.transaction(async (tx) => {
      const cur = await tx.get('sales', sale.id);
      if (!cur || cur.void) throw new Error('gone');
      const back = {};
      cur.lines.forEach((l) => {
        if (l.cat === 'product' && l.id) back[l.id] = (back[l.id] || 0) + l.qty;
      });
      const prods = {};
      for (const id of Object.keys(back)) prods[id] = await tx.get('products', id);
      Object.keys(back).forEach((id) => {
        const p = prods[id];
        if (!p || !p.track) return;
        const after = (Number(p.stock) || 0) + back[id];
        tx.set('products', id, { ...p, stock: after, updatedAt: Date.now() });
        tx.set('stockLog', newId(), {
          productId: id,
          name: p.name,
          delta: back[id],
          after,
          reason: 'void',
          ref: sale.id,
          ts: Date.now(),
          ...who(user),
        });
      });

      // Suspend any membership that was activated by this voided sale
      for (const l of cur.lines) {
        if (l.cat === 'membership' && l.id) {
          const mem = await tx.get('memberships', l.id);
          if (mem) {
            tx.set('memberships', l.id, {
              ...mem,
              status: 'suspended',
              voidedAt: Date.now(),
              voidReason: reason,
            });
          }
        }
      }

      tx.set('sales', sale.id, { ...cur, void: true, voidedAt: Date.now(), voidReason: reason });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not void the sale.' };
  }
}