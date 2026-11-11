import { useState } from 'react';
import { useAuth, useCollection } from '../data/hooks.js';
import { useHub } from '../hub/HubProvider.jsx';
import { checkout } from '../money/domain.js';
import { METHODS, fmtMoney, useSettings } from '../money/pricing.js';

export default function PosPage() {
  const { user, role } = useAuth();
  const hub = useHub();
  const st = useSettings();
  const money = (n) => fmtMoney(n, st.currency);
  const products = useCollection('products').filter((p) => p.active !== false);

  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]);
  const [cartDiscountType, setCartDiscountType] = useState('amount');
  const [cartDiscountValue, setCartDiscountValue] = useState('');
  const [method, setMethod] = useState('Cash');
  const [tendered, setTendered] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  // Print Workflow States
  const [pendingPrintSale, setPendingPrintSale] = useState(null); // Triggers prompt dialog
  const [completedSale, setCompletedSale] = useState(null);       // Triggers receipt preview modal

  const cats = ['All', ...Array.from(new Set(products.map((p) => p.category || 'Other'))).sort()];
  const shown = products
    .filter(
      (p) =>
        (cat === 'All' || (p.category || 'Other') === cat) &&
        (!q || p.name.toLowerCase().includes(q.toLowerCase()))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const inCart = (key) => (cart.find((l) => l.key === key) || {}).qty || 0;

  // 1. Calculations
  const grossAmount = Math.round(cart.reduce((n, l) => n + l.price * l.qty, 0) * 100) / 100;
  const isStoreRole = typeof role === 'string' && role.startsWith('store_');

  const getItemUnitPrice = (l) => {
    const val = Math.max(0, Number(l.discountValue) || 0);
    if (l.discountType === 'percent') {
      const pct = Math.min(100, val);
      return Math.max(0, l.price * (1 - pct / 100));
    }
    return Math.max(0, l.price - val);
  };

  const subtotalAfterItemDiscounts =
    Math.round(cart.reduce((n, l) => n + getItemUnitPrice(l) * l.qty, 0) * 100) / 100;

  const itemDiscountsTotal = Math.round((grossAmount - subtotalAfterItemDiscounts) * 100) / 100;

  const cartDiscountAmount = (() => {
    const val = Math.max(0, Number(cartDiscountValue) || 0);
    if (cartDiscountType === 'percent') {
      const pct = Math.min(100, val);
      return Math.round(subtotalAfterItemDiscounts * (pct / 100) * 100) / 100;
    }
    return Math.min(subtotalAfterItemDiscounts, val);
  })();

  const totalDiscount = Math.round((itemDiscountsTotal + cartDiscountAmount) * 100) / 100;
  const total = Math.max(0, Math.round((grossAmount - totalDiscount) * 100) / 100);
  const change = Number(tendered) - total;

  // Quick cash preset values (deduplicated)
  const cashOptions = Array.from(new Set([total, 50, 100, 500, 1000].filter((v) => v > 0)));

  // Actions
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
    add(
      { key: p.id, cat: 'product', id: p.id, name: p.name, price: Number(p.price) || 0 },
      p.track ? Number(p.stock) || 0 : null
    );

  const setQty = (key, qty) =>
    setCart((c) => c.map((l) => (l.key === key ? { ...l, qty } : l)).filter((l) => l.qty > 0));

  const removeItem = (key) => setCart((c) => c.filter((l) => l.key !== key));

  const setItemDiscount = (key, type, val) =>
    setCart((c) =>
      c.map((l) =>
        l.key === key
          ? {
              ...l,
              discountType: type ?? l.discountType,
              discountValue: val ?? l.discountValue,
            }
          : l
      )
    );

  const clearCart = () => {
    setCart([]);
    setCartDiscountValue('');
    setTendered('');
    setNote('');
    setMsg(null);
  };

  const charge = async () => {
    if (!cart.length || busy) return;
    setBusy(true);

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

    const checkoutData = {
      method,
      tendered: Number(tendered) || 0,
      note,
      grossAmount,
      itemDiscountsTotal,
      cartDiscount: {
        type: cartDiscountType,
        value: Number(cartDiscountValue) || 0,
        amount: cartDiscountAmount,
      },
      discount: totalDiscount,
      total,
    };

    const r = await checkout(user, payloadCart, checkoutData);
    setBusy(false);

    if (r.ok) {
      const saleData = {
        id: r.id || `TXN-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleString(),
        items: payloadCart,
        grossAmount,
        totalDiscount,
        total,
        method,
        tendered: Number(tendered) || 0,
        change: method === 'Cash' ? Math.max(0, Number(tendered) - total) : 0,
        note,
        cashier: user?.name || user?.email || 'Staff',
      };

      // Open print prompt dialog first
      setPendingPrintSale(saleData);

      setMsg({
        bad: false,
        t: `Sale completed! Total Charged: ${money(r.total)}`,
      });

      setCart([]);
      setCartDiscountValue('');
      setTendered('');
      setNote('');
    } else {
      setMsg({ bad: true, t: r.error });
    }
  };

  const confirmPrint = () => {
    setCompletedSale(pendingPrintSale);
    setPendingPrintSale(null);
  };

  const skipPrint = () => {
    setPendingPrintSale(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cq pos-wrapper" style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-receipt-modal, #printable-receipt-modal * { visibility: visible; }
          #printable-receipt-modal {
            position: absolute; left: 0; top: 0; width: 100%;
            background: white !important; color: black !important;
            box-shadow: none !important; padding: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="cq-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Point of Sale</h1>
          <span style={{ fontSize: '0.875rem' }} className="cq-mut">
            Tap products to add to current ticket
          </span>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              background: '#fff1f2',
              color: '#e11d48',
              border: '1px solid #fecdd3',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Clear Ticket ({cart.reduce((sum, item) => sum + item.qty, 0)})
          </button>
        )}
      </div>

      <div className="pos-container" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Product Catalog */}
        <div className="cq-card pos-catalog-panel" style={{ padding: '18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              value={q}
              placeholder="🔍 Search items by name..."
              onChange={(e) => setQ(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem', borderRadius: '8px', border: '1px solid var(--bd, #d1d5db)' }}
            />
          </div>

          <div className="pos-categories" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`small ${cat === c ? 'on' : ''}`}
                style={{ borderRadius: '20px', padding: '6px 14px', whiteSpace: 'nowrap' }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {!isStoreRole && (
              <button
                className="pos-tile special"
                onClick={() => add({ key: 'openplay', cat: 'openplay', id: '', name: 'Open play entry', price: Number(st.openPlayFee) || 0 })}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px', height: '110px', textAlign: 'left', borderRadius: '10px', cursor: 'pointer' }}
              >
                <b style={{ fontSize: '0.95rem' }}>🎾 Open Play Entry</b>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{money(st.openPlayFee)}</span>
              </button>
            )}

            {shown.map((p) => {
              const available = p.track ? (Number(p.stock) || 0) - inCart(p.id) : null;
              const out = p.track && available <= 0;
              const isLow = p.track && (Number(p.stock) || 0) <= (Number(p.low) || 5);

              return (
                <button
                  key={p.id}
                  disabled={out}
                  onClick={() => addProduct(p)}
                  className="pos-tile"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px', height: '110px', textAlign: 'left', borderRadius: '10px', opacity: out ? 0.5 : 1, cursor: out ? 'not-allowed' : 'pointer' }}
                >
                  <b style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.name}
                  </b>
                  <div>
                    <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700 }}>{money(p.price)}</span>
                    {p.track && (
                      <small style={{ fontSize: '0.75rem', fontWeight: 600, color: out ? '#ef4444' : isLow ? '#d97706' : 'var(--mut, #6b7280)' }}>
                        {out ? 'Out of stock' : `${Number(p.stock) || 0} in stock`}
                      </small>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Ticket & Checkout */}
        <div className="cq-card pos-cart" style={{ padding: '18px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid var(--bd, #f3f4f6)' }}>
            Current Order
          </h2>

          {cart.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: '0.9rem' }} className="cq-mut">
              🛒 Ticket is currently empty. Tap items to start.
            </div>
          ) : (
            <div style={{ maxHeight: '340px', overflowY: 'auto', marginBottom: '16px' }}>
              {cart.map((l) => {
                const unitPrice = getItemUnitPrice(l);
                const lineTotal = unitPrice * l.qty;
                const hasDiscount = Number(l.discountValue) > 0;

                return (
                  <div key={l.key} style={{ padding: '10px 0', borderBottom: '1px solid var(--bd, #f3f4f6)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.name}</div>
                        <div style={{ fontSize: '0.8rem' }} className="cq-mut">
                          {money(l.price)} ea
                          {hasDiscount && (
                            <span style={{ color: '#ea580c', marginLeft: '6px', fontWeight: 600 }}>
                              (→ {money(unitPrice)})
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeItem(l.key)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--bd, #d1d5db)', borderRadius: '6px' }}>
                        <button onClick={() => setQty(l.key, l.qty - 1)} style={{ width: '28px', border: 'none', cursor: 'pointer' }}>−</button>
                        <span style={{ width: '32px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>{l.qty}</span>
                        <button onClick={() => setQty(l.key, l.qty + 1)} style={{ width: '28px', border: 'none', cursor: 'pointer' }}>+</button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem' }} className="cq-mut">Disc:</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={l.discountValue || ''}
                          onChange={(e) => setItemDiscount(l.key, l.discountType, e.target.value)}
                          style={{ width: '48px', padding: '2px 4px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--bd, #d1d5db)' }}
                        />
                        <button
                          className={`small ${l.discountType === 'amount' ? 'on' : ''}`}
                          onClick={() => setItemDiscount(l.key, 'amount', l.discountValue)}
                          style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                        >
                          {st.currency || '$'}
                        </button>
                        <button
                          className={`small ${l.discountType === 'percent' ? 'on' : ''}`}
                          onClick={() => setItemDiscount(l.key, 'percent', l.discountValue)}
                          style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                        >
                          %
                        </button>
                      </div>

                      <div style={{ fontWeight: 700 }}>{money(lineTotal)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {cart.length > 0 && (
            <div style={{ background: 'var(--bg, #f9fafb)', padding: '12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--bd, #e5e7eb)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span className="cq-mut">Gross Subtotal</span>
                <span>{money(grossAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span className="cq-mut">Cart Discount</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={cartDiscountValue}
                    onChange={(e) => setCartDiscountValue(e.target.value)}
                    style={{ width: '55px', padding: '2px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--bd, #d1d5db)' }}
                  />
                  <button
                    className={`small ${cartDiscountType === 'amount' ? 'on' : ''}`}
                    onClick={() => setCartDiscountType('amount')}
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    {st.currency || '$'}
                  </button>
                  <button
                    className={`small ${cartDiscountType === 'percent' ? 'on' : ''}`}
                    onClick={() => setCartDiscountType('percent')}
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    %
                  </button>
                </div>
              </div>

              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ea580c', fontWeight: 600 }}>
                  <span>Total Discount</span>
                  <span>- {money(totalDiscount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Total Banner */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--primary, #1e293b)',
              color: '#fff',
              borderRadius: '8px',
              marginBottom: '14px',
            }}
          >
            <span style={{ fontWeight: 600 }}>Total Due</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{money(total)}</span>
          </div>

          {/* Payment Method Selector */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${METHODS.length}, 1fr)`, gap: '6px' }}>
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`small ${method === m ? 'on' : ''}`}
                  style={{ padding: '8px 4px', fontWeight: 600 }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Details & Fixed Contrast Quick Preset Buttons */}
          {method === 'Cash' && (
            <div style={{ background: 'var(--bg, #f8fafc)', padding: '10px', borderRadius: '6px', border: '1px solid var(--bd, #e2e8f0)', marginBottom: '12px' }}>
              <input
                type="number"
                min="0"
                value={tendered}
                placeholder="Cash Received"
                onChange={(e) => setTendered(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.9rem', borderRadius: '6px', border: '1px solid var(--bd, #cbd5e1)' }}
              />
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {cashOptions.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTendered(amt.toString())}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#ffffff',
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    {amt === total ? 'Exact' : amt}
                  </button>
                ))}
              </div>
              {Number(tendered) > 0 && (
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: change >= 0 ? '#16a34a' : '#dc2626', marginTop: '6px', textAlign: 'right' }}>
                  {change >= 0 ? `Change: ${money(change)}` : `Short: ${money(-change)}`}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              value={note}
              placeholder="Note / Customer Name (Optional)"
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--bd, #d1d5db)' }}
            />
          </div>

          <button
            className="primary"
            disabled={!cart.length || busy || (method === 'Cash' && Number(tendered) > 0 && change < 0)}
            onClick={charge}
            style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 700, border: 'none', borderRadius: '8px' }}
          >
            {busy ? 'Processing Transaction…' : `Complete Sale • ${money(total)}`}
          </button>

          {msg && (
            <div className={`cq-msg ${msg.bad ? 'error' : ''}`} style={{ marginTop: '12px' }}>
              {msg.t}
            </div>
          )}
        </div>
      </div>

      {/* STEP 1: PRINT CONFIRMATION DIALOG */}
      {pendingPrintSale && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9998,
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--fg, #111827)',
              width: '360px',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--bd, #e5e7eb)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🧾</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700 }}>
              Transaction Completed!
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px' }} className="cq-mut">
              Total Charged: <b>{money(pendingPrintSale.total)}</b>
              <br />
              Would you like to preview and print the receipt?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="primary"
                onClick={confirmPrint}
                style={{ flex: 1, padding: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Yes, Preview & Print
              </button>
              <button
                onClick={skipPrint}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid var(--bd, #d1d5db)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                No, Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PRINTABLE RECEIPT PREVIEW MODAL */}
      {completedSale && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            id="printable-receipt-modal"
            style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--fg, #111827)',
              width: '340px',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--bd, #e5e7eb)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              fontFamily: 'monospace, sans-serif',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px dashed var(--bd, #9ca3af)', paddingBottom: '12px' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary, #111827)' }}>
                {hub?.doc?.name || 'DRIVE \'N DINK'}
              </h2>
              <div style={{ fontSize: '0.8rem' }} className="cq-mut">Official Receipt</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }} className="cq-mut">
                Txn #: {completedSale.id}
              </div>
              <div style={{ fontSize: '0.75rem' }} className="cq-mut">
                Date: {completedSale.date}
              </div>
            </div>

            <div style={{ borderBottom: '1px dashed var(--bd, #9ca3af)', paddingBottom: '12px', marginBottom: '12px' }}>
              {completedSale.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    <span>{item.name}</span>
                    <span>{money(item.discountedLineTotal)}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }} className="cq-mut">
                    <span>{item.qty} x {money(item.unitPriceAfterDiscount)}</span>
                    {item.lineDiscountAmount > 0 && <span>(Disc: -{money(item.lineDiscountAmount)})</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>{money(completedSale.grossAmount)}</span>
              </div>
              {completedSale.totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#ea580c' }}>
                  <span>Discounts:</span>
                  <span>-{money(completedSale.totalDiscount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem', borderTop: '1px solid var(--bd, #e5e7eb)', paddingTop: '6px', marginTop: '6px', color: 'var(--primary, #111827)' }}>
                <span>TOTAL:</span>
                <span>{money(completedSale.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem' }} className="cq-mut">
                <span>Paid via ({completedSale.method}):</span>
                <span>{money(completedSale.method === 'Cash' ? completedSale.tendered : completedSale.total)}</span>
              </div>
              {completedSale.method === 'Cash' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '2px' }} className="cq-mut">
                  <span>Change:</span>
                  <span>{money(completedSale.change)}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', borderTop: '1px dashed var(--bd, #9ca3af)', paddingTop: '12px', marginBottom: '16px' }} className="cq-mut">
              Thank you for visiting!
              <br />
              Please retain receipt for entry verification.
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
              <button className="primary" onClick={handlePrint} style={{ flex: 1, padding: '10px', fontWeight: 600, cursor: 'pointer' }}>
                🖨️ Print Receipt
              </button>
              <button onClick={() => setCompletedSale(null)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--bd, #d1d5db)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}