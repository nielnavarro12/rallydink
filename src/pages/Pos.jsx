import { useState } from 'react';
import { useAuth, useCollection } from '../data/hooks.js';
import { checkout } from '../money/domain.js';
import { METHODS, fmtMoney, useSettings } from '../money/pricing.js';

/* Point of sale: tap products, take payment, stock goes down automatically */
export default function PosPage() {
  const { user, role } = useAuth();
  const st = useSettings();
  const money = (n) => fmtMoney(n, st.currency);
  const products = useCollection('products').filter((p) => p.active !== false);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]); // { key, cat, id, name, price, qty, discountType: 'amount'|'percent', discountValue }
  const [cartDiscountType, setCartDiscountType] = useState('amount'); // 'amount' | 'percent'
  const [cartDiscountValue, setCartDiscountValue] = useState('');
  const [method, setMethod] = useState('Cash');
  const [tendered, setTendered] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const cats = ['All', ...Array.from(new Set(products.map((p) => p.category || 'Other'))).sort()];
  const shown = products
    .filter((p) => (cat === 'All' || (p.category || 'Other') === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name));
  const inCart = (key) => (cart.find((l) => l.key === key) || {}).qty || 0;

  // 1. Gross original amount (before any item or cart discounts)
  const grossAmount = Math.round(cart.reduce((n, l) => n + (l.price * l.qty), 0) * 100) / 100;
  const isStoreRole = typeof role === 'string' && role.startsWith('store_');
  // Helper to calculate discounted unit price for an item
  const getItemUnitPrice = (l) => {
    const val = Math.max(0, Number(l.discountValue) || 0);
    if (l.discountType === 'percent') {
      const pct = Math.min(100, val);
      return Math.max(0, l.price * (1 - pct / 100));
    }
    return Math.max(0, l.price - val);
  };

  // Subtotal of all items after per-item discounts
  const subtotalAfterItemDiscounts = Math.round(cart.reduce((n, l) => n + getItemUnitPrice(l) * l.qty, 0) * 100) / 100;
  
  // Total sum of all per-item discounts
  const itemDiscountsTotal = Math.round((grossAmount - subtotalAfterItemDiscounts) * 100) / 100;

  // Calculate cart-level discount amount
  const cartDiscountAmount = (() => {
    const val = Math.max(0, Number(cartDiscountValue) || 0);
    if (cartDiscountType === 'percent') {
      const pct = Math.min(100, val);
      return Math.round(subtotalAfterItemDiscounts * (pct / 100) * 100) / 100;
    }
    return Math.min(subtotalAfterItemDiscounts, val);
  })();

  // 2. Total discount combined (Item discounts + Cart discount)
  const totalDiscount = Math.round((itemDiscountsTotal + cartDiscountAmount) * 100) / 100;

  // 3. Net total amount after all discounts
  const total = Math.max(0, Math.round((grossAmount - totalDiscount) * 100) / 100);
  const change = Number(tendered) - total;

  const add = (line, max) => {
    setMsg(null);
    setCart((c) => {
      const cur = c.find((l) => l.key === line.key);
      if (cur) {
        if (max != null && cur.qty >= max) return c;
        return c.map((l) => (l.key === line.key ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...c, { ...line, qty: 1, discountType: 'amount', discountValue: 0 }];
    });
  };

  const addProduct = (p) =>
    add({ key: p.id, cat: 'product', id: p.id, name: p.name, price: Number(p.price) || 0 }, p.track ? Number(p.stock) || 0 : null);

  const setQty = (key, qty) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty } : l)).filter((l) => l.qty > 0));

  const setItemDiscount = (key, type, val) =>
    setCart((c) => c.map((l) => (l.key === key ? { ...l, discountType: type ?? l.discountType, discountValue: val ?? l.discountValue } : l)));

  const charge = async () => {
    if (!cart.length || busy) return;
    setBusy(true);

    // Pass detailed discount metadata into checkout payload
    const payloadCart = cart.map((l) => {
      const unitPriceAfterDiscount = getItemUnitPrice(l);
      const originalLineTotal = l.price * l.qty;
      const discountedLineTotal = unitPriceAfterDiscount * l.qty;
      return {
        ...l,
        originalLineTotal,
        discountedLineTotal,
        lineDiscountAmount: Math.round((originalLineTotal - discountedLineTotal) * 100) / 100,
        unitPriceAfterDiscount,
      };
    });

    const r = await checkout(user, payloadCart, {
      method,
      tendered,
      note,
      grossAmount,       // Original Amount before discount
      itemDiscountsTotal,// Sum of item discounts
      cartDiscount: { type: cartDiscountType, value: Number(cartDiscountValue) || 0, amount: cartDiscountAmount },
      discount: totalDiscount, // Total Discount Amount
      total,            // Amount after discount
    });
    setBusy(false);

    if (r.ok) {
      setMsg({ t: `Sale complete: ${money(r.total)}${method === 'Cash' && Number(tendered) > r.total ? `. Change: ${money(Number(tendered) - r.total)}` : ''}.` });
      setCart([]);
      setCartDiscountValue('');
      setTendered('');
      setNote('');
    } else {
      setMsg({ bad: true, t: r.error });
    }
  };

  return (
    <div className="cq">
      <div className="cq-head"><h1>Point of sale</h1></div>
      <div className="pos">
        <div className="cq-card">
          <div className="cq-row" style={{ marginBottom: 10 }}>
            <input type="text" value={q} placeholder="Search products" onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="cq-row" style={{ marginBottom: 10 }} role="group" aria-label="Category">
            {cats.map((c) => <button key={c} className={`small${cat === c ? ' on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div className="pos-grid">
          {!isStoreRole && (
            <button className="pos-tile special" onClick={() => add({ key: 'openplay', cat: 'openplay', id: '', name: 'Open play entry', price: Number(st.openPlayFee) || 0 })}>
              <b>Open play entry</b><span>{money(st.openPlayFee)}</span>
            </button>
          )}
            {shown.map((p) => {
              const out = p.track && (Number(p.stock) || 0) - inCart(p.id) <= 0;
              return (
                <button key={p.id} className="pos-tile" disabled={out} onClick={() => addProduct(p)}>
                  <b>{p.name}</b>
                  <span>{money(p.price)}</span>
                  {p.track && <small className={(Number(p.stock) || 0) <= (Number(p.low) || 5) ? 'low' : ''}>{Number(p.stock) || 0} in stock</small>}
                </button>
              );
            })}
          </div>
          {products.length === 0 && <div className="cq-mut" style={{ marginTop: 10 }}>No products yet. Add them on the Inventory page.</div>}
        </div>

        <div className="cq-card pos-cart">
          <h2>Cart</h2>
          {cart.length === 0 && <div className="cq-mut">Tap a product to add it.</div>}
          {cart.map((l) => {
            const unitPrice = getItemUnitPrice(l);
            const lineTotal = unitPrice * l.qty;
            return (
              <div className="cq-item" key={l.key} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
                <div className="cq-row" style={{ justifyContent: 'space-between' }}>
                  <span>
                    {l.name}
                    <span className="cq-mut"> · {money(l.price)}</span>
                    {Number(l.discountValue) > 0 && <small style={{ color: '#d9480f', marginLeft: 4 }}>(→ {money(unitPrice)} ea)</small>}
                  </span>
                  <span className="cq-row" style={{ flexWrap: 'nowrap', gap: 4 }}>
                    <button className="small" onClick={() => setQty(l.key, l.qty - 1)} aria-label={`Fewer ${l.name}`}>−</button>
                    <b style={{ minWidth: 22, textAlign: 'center' }}>{l.qty}</b>
                    <button className="small" disabled={l.cat === 'product' && l.qty >= (products.find((p) => p.id === l.id) || { track: false }).stock && (products.find((p) => p.id === l.id) || {}).track} onClick={() => setQty(l.key, l.qty + 1)} aria-label={`More ${l.name}`}>+</button>
                  </span>
                </div>
                <div className="cq-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="cq-row" style={{ gap: 4, alignItems: 'center' }}>
                    <small className="cq-mut">Item Disc:</small>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={l.discountValue || ''}
                      onChange={(e) => setItemDiscount(l.key, l.discountType, e.target.value)}
                      style={{ width: 60, padding: '2px 4px', fontSize: '0.85rem' }}
                      aria-label={`Discount amount for ${l.name}`}
                    />
                    <button className={`small${l.discountType === 'amount' ? ' on' : ''}`} onClick={() => setItemDiscount(l.key, 'amount', l.discountValue)}>{st.currency || '$'}</button>
                    <button className={`small${l.discountType === 'percent' ? ' on' : ''}`} onClick={() => setItemDiscount(l.key, 'percent', l.discountValue)}>%</button>
                  </div>
                  <b>{money(lineTotal)}</b>
                </div>
              </div>
            );
          })}

          {cart.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px solid #ccc' }}>
              <div className="cq-row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <small className="cq-mut">Gross Amount</small>
                <span>{money(grossAmount)}</span>
              </div>
              <div className="cq-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <small className="cq-mut">Cart Discount</small>
                <div className="cq-row" style={{ gap: 4, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={cartDiscountValue}
                    onChange={(e) => setCartDiscountValue(e.target.value)}
                    style={{ width: 65, padding: '2px 6px', fontSize: '0.85rem' }}
                    aria-label="Cart discount value"
                  />
                  <button className={`small${cartDiscountType === 'amount' ? ' on' : ''}`} onClick={() => setCartDiscountType('amount')}>{st.currency || '$'}</button>
                  <button className={`small${cartDiscountType === 'percent' ? ' on' : ''}`} onClick={() => setCartDiscountType('percent')}>%</button>
                </div>
              </div>
              {totalDiscount > 0 && (
                <div className="cq-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                  <small className="cq-mut" style={{ color: '#d9480f' }}>Total Discount</small>
                  <span style={{ color: '#d9480f' }}>- {money(totalDiscount)}</span>
                </div>
              )}
            </div>
          )}

          <div className="pos-total">Total <b>{money(total)}</b></div>

          <div className="cq-row" role="group" aria-label="Payment method" style={{ marginTop: 8 }}>
            {METHODS.map((m) => <button key={m} className={`small${method === m ? ' on' : ''}`} aria-pressed={method === m} onClick={() => setMethod(m)}>{m}</button>)}
          </div>
          {method === 'Cash' && (
            <div className="cq-row" style={{ marginTop: 8 }}>
              <input type="number" min={0} value={tendered} placeholder="Cash received" onChange={(e) => setTendered(e.target.value)} aria-label="Cash received" />
              {Number(tendered) > 0 && <span className="cq-mut">{change >= 0 ? `Change ${money(change)}` : `Short ${money(-change)}`}</span>}
            </div>
          )}
          <div className="cq-row" style={{ marginTop: 8 }}>
            <input type="text" value={note} placeholder="Note / customer (optional)" onChange={(e) => setNote(e.target.value)} />
          </div>
          <div style={{ marginTop: 10 }}>
            <button className="primary" style={{ width: '100%' }} disabled={!cart.length || busy || (method === 'Cash' && Number(tendered) > 0 && change < 0)} onClick={charge}>
              {busy ? 'Processing…' : `Charge ${money(total)}`}
            </button>
          </div>
          {msg && <div role="status" className="cq-msg" style={msg.bad ? { color: '#d9480f' } : undefined}>{msg.t}</div>}
        </div>
      </div>
    </div>
  );
}