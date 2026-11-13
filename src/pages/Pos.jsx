import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../sync/firebaseConfig';
import { useAuth, useCollection } from '../data/hooks.js';
import { useHub } from '../hub/HubProvider.jsx';
import { checkout } from '../money/domain.js';
import { METHODS, fmtMoney, useSettings } from '../money/pricing.js';

import {
  normalizeDoc,
  parseDateValue,
  evaluateMemberPerk,
  applyMemberPerkToLine,
  getItemUnitPrice,
} from '../pos/posPerks.js';
import MemberLookupBar from '../pos/MemberLookupBar.jsx';
import CatalogPanel from '../pos/CatalogPanel.jsx';
import CartItemRow from '../pos/CartItemRow.jsx';
import ReceiptModals from '../pos/ReceiptModals.jsx';

export default function PosPage() {
  const { user, role } = useAuth();
  const hub = useHub();
  const st = useSettings();
  const money = useCallback((n) => fmtMoney(n, st.currency), [st.currency]);

  const rawProducts = useCollection('products');
  const products = useMemo(
    () => rawProducts.map(normalizeDoc).filter((p) => p && p.active !== false),
    [rawProducts]
  );

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

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  const [pendingPrintSale, setPendingPrintSale] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);

  const [hubMemberships, setHubMemberships] = useState([]);
  const [hubRules, setHubRules] = useState([]);

  // Resolve active hubId reliably across HubProvider, selected member, or products
  const activeHubId =
    hub?.id ||
    hub?.doc?.id ||
    hub?.hubId ||
    hub?.currentHubId ||
    selectedMember?.hubId ||
    products[0]?.hubId ||
    null;

  // 1. Direct Firestore Subscriptions
  useEffect(() => {
    if (!activeHubId) {
      setHubMemberships([]);
      return;
    }
    const qMembers = query(collection(db, 'memberships'), where('hubId', '==', activeHubId));
    return onSnapshot(
      qMembers,
      (snap) => setHubMemberships(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('POS memberships listener error:', err)
    );
  }, [activeHubId]);

  useEffect(() => {
    if (!activeHubId) {
      setHubRules([]);
      return;
    }
    const qRules = query(collection(db, 'benefitRules'), where('hubId', '==', activeHubId));
    return onSnapshot(
      qRules,
      (snap) =>
        setHubRules(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((r) => r.isActive !== false && r.active !== false)
        ),
      (err) => console.error('POS benefitRules listener error:', err)
    );
  }, [activeHubId]);

  const unpaidMemberships = useMemo(
    () => hubMemberships.filter((m) => m.status === 'pending_payment'),
    [hubMemberships]
  );

  const searchableMembers = useMemo(() => {
    const now = new Date();
    return hubMemberships
      .filter((m) => (m.status || '').toLowerCase() !== 'suspended')
      .map((m) => {
        const expiry = parseDateValue(m.validUntil);
        const isExpired = Boolean(expiry && now > expiry);
        const isActive = (m.status || '').toLowerCase() === 'active' && !isExpired;
        return { ...m, _isActive: isActive, _isExpired: isExpired };
      });
  }, [hubMemberships]);

  const memberMatches = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return [];
    return searchableMembers
      .filter(
        (m) =>
          (m.memberCode || '').toLowerCase().includes(term) ||
          (m.memberName || '').toLowerCase().includes(term) ||
          (m.phone || '').toLowerCase().includes(term) ||
          (m.email || '').toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [searchableMembers, memberSearch]);

  // 2. Reactive Firestore Member Perks (zero hardcoded fallbacks)
  const activePerks = useMemo(() => {
    if (!selectedMember || selectedMember._isActive === false) {
      return { product: null, openplay: null, court: null };
    }
    const posRule = evaluateMemberPerk(hubRules, [
      'POS_DISCOUNT',
      'PRODUCT_DISCOUNT',
      'OPEN_PLAY_DISCOUNT',
    ]);
    const bookingRule = evaluateMemberPerk(hubRules, ['BOOKING_DISCOUNT', 'COURT_DISCOUNT']);

    return {
      product: posRule,
      openplay: posRule,
      court: bookingRule,
    };
  }, [hubRules, selectedMember]);

  useEffect(() => {
    setCart((prevCart) =>
      prevCart.map((line) => {
        if (Number(line.discountValue) > 0 && !line.memberPerkApplied) {
          return line;
        }
        return applyMemberPerkToLine(line, selectedMember ? activePerks : null);
      })
    );
  }, [selectedMember, activePerks]);

  const selectMember = (member) => {
    setSelectedMember(member);
    setMemberSearch('');
  };

  const clearSelectedMember = () => {
    setSelectedMember(null);
    setMemberSearch('');
  };

  // 3. External POS Payloads (Court Booking & Membership)
  useEffect(() => {
    const ingestPayload = (item) => {
      if (!item) return;

      if (item.type === 'COURT_BOOKING') {
        const key = `court_${
          item.bookingId || `${item.membershipId || 'walkin'}_${item.bookingDate}_${item.startTime}`
        }`;
        const basePrice = Number(item.originalAmount ?? item.amount) || 0;
        const discountAmt = Number(item.discountAmount) || 0;

        setCart((c) => {
          if (c.some((l) => l.key === key)) return c;
          return [
            ...c,
            {
              key,
              cat: 'court',
              id: item.bookingId || item.membershipId || '',
              bookingId: item.bookingId || null,
              membershipId: item.membershipId || null,
              memberCode: item.memberCode || null,
              courtBooking: {
                courtName: item.courtName,
                bookingDate: item.bookingDate,
                startTime: item.startTime,
                endTime: item.endTime || null,
                durationHours: item.durationHours,
                hourlyRate: item.hourlyRate,
                appliedRuleId: item.appliedRuleId || null,
              },
              name:
                item.description ||
                `${item.courtName} (${item.bookingDate} ${item.startTime})`,
              price: basePrice,
              qty: 1,
              discountType: 'amount',
              discountValue: discountAmt,
              memberPerkApplied: discountAmt > 0,
            },
          ];
        });

        if (item.memberName || item.membershipId) {
          setSelectedMember((prev) => {
            if (prev) return prev;
            return {
              id: item.membershipId || null,
              hubId: item.hubId || activeHubId || null,
              memberCode: item.memberCode || '',
              memberName: item.memberName || 'Member',
              _isActive: true,
            };
          });
          if (item.memberName) {
            setNote((prev) => prev || `${item.memberName} (${item.memberCode || ''})`.trim());
          }
        }
        return;
      }

      const key = `membership_${item.membershipId}`;
      setCart((c) => {
        if (c.some((l) => l.key === key)) return c;
        return [
          ...c,
          {
            key,
            cat: 'membership',
            id: item.membershipId,
            membershipId: item.membershipId,
            memberCode: item.memberCode,
            name: item.description || `Membership (${item.memberCode})`,
            price: Number(item.amount) || 0,
            qty: 1,
            discountType: 'amount',
            discountValue: 0,
          },
        ];
      });
      if (item.memberName) {
        setNote((prev) => prev || `${item.memberName} (${item.memberCode})`);
      }
    };

    const raw = sessionStorage.getItem('pending_pos_membership');
    if (raw) {
      try {
        const item = JSON.parse(raw);
        sessionStorage.removeItem('pending_pos_membership');
        ingestPayload(item);
      } catch (err) {
        console.error('Failed to load pending POS item:', err);
      }
    }

    const onNavigateToPos = (e) => {
      if (e?.detail) {
        sessionStorage.removeItem('pending_pos_membership');
        ingestPayload(e.detail);
      }
    };
    window.addEventListener('navigate-to-pos', onNavigateToPos);
    return () => window.removeEventListener('navigate-to-pos', onNavigateToPos);
  }, [activeHubId]);

  // 4. Catalog & Totals
  const cats = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category || 'Other'))).sort()],
    [products]
  );

  const shown = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (cat === 'All' || (p.category || 'Other') === cat) &&
            (!q || p.name.toLowerCase().includes(q.toLowerCase()))
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products, cat, q]
  );

  const inCart = (key) => (cart.find((l) => l.key === key) || {}).qty || 0;

  const totals = useMemo(() => {
    const gross = Math.round(cart.reduce((n, l) => n + l.price * l.qty, 0) * 100) / 100;
    const afterItemDiscounts =
      Math.round(cart.reduce((n, l) => n + getItemUnitPrice(l) * l.qty, 0) * 100) / 100;
    const itemDiscounts = Math.round((gross - afterItemDiscounts) * 100) / 100;

    const val = Math.max(0, Number(cartDiscountValue) || 0);
    const cartDiscount =
      cartDiscountType === 'percent'
        ? Math.round(afterItemDiscounts * (Math.min(100, val) / 100) * 100) / 100
        : Math.min(afterItemDiscounts, val);

    const discount = Math.round((itemDiscounts + cartDiscount) * 100) / 100;
    const net = Math.max(0, Math.round((gross - discount) * 100) / 100);

    return { gross, itemDiscounts, cartDiscount, discount, net };
  }, [cart, cartDiscountType, cartDiscountValue]);

  const change = Number(tendered) - totals.net;
  const isStoreRole = typeof role === 'string' && role.startsWith('store_');
  const cashOptions = Array.from(new Set([totals.net, 50, 100, 500, 1000].filter((v) => v > 0)));

  // 5. Cart Mutations
  const add = (line, max) => {
    setMsg(null);
    setCart((c) => {
      const cur = c.find((l) => l.key === line.key);
      if (cur) {
        if (max != null && cur.qty >= max) return c;
        return c.map((l) => (l.key === line.key ? { ...l, qty: l.qty + 1 } : l));
      }
      const baseLine = { ...line, qty: 1, discountType: 'amount', discountValue: 0 };
      const withPerk = selectedMember ? applyMemberPerkToLine(baseLine, activePerks) : baseLine;
      return [...c, withPerk];
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
              memberPerkApplied: false,
            }
          : l
      )
    );

  const clearCart = () => {
    setCart([]);
    setCartDiscountValue('');
    setTendered('');
    setNote('');
    setSelectedMember(null);
    setMemberSearch('');
    setMsg(null);
  };

  // 6. Checkout Handler
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

    const memberTag = selectedMember
      ? `Member: ${selectedMember.memberName} (${selectedMember.memberCode})`
      : '';
    const combinedNote = [memberTag, note.trim()].filter(Boolean).join(' · ');

    const checkoutData = {
      method,
      tendered: Number(tendered) || 0,
      note: combinedNote,
      memberId: selectedMember?.id || null,
      memberCode: selectedMember?.memberCode || null,
      grossAmount: totals.gross,
      itemDiscountsTotal: totals.itemDiscounts,
      cartDiscount: {
        type: cartDiscountType,
        value: Number(cartDiscountValue) || 0,
        amount: totals.cartDiscount,
      },
      discount: totals.discount,
      total: totals.net,
    };

    const r = await checkout(user, payloadCart, checkoutData);
    setBusy(false);

    if (!r.ok) {
      setMsg({ bad: true, t: r.error });
      return;
    }

    const saleId = r.id || `TXN-${Date.now().toString().slice(-6)}`;
    const saleData = {
      id: saleId,
      date: new Date().toLocaleString(),
      items: payloadCart,
      grossAmount: totals.gross,
      totalDiscount: totals.discount,
      total: totals.net,
      method,
      tendered: Number(tendered) || 0,
      change: method === 'Cash' ? Math.max(0, Number(tendered) - totals.net) : 0,
      note: combinedNote,
      member: selectedMember,
      cashier: user?.name || user?.email || 'Staff',
    };

    const membershipItems = payloadCart.filter(
      (item) => item.cat === 'membership' && item.membershipId
    );
    if (membershipItems.length > 0) {
      await Promise.all(
        membershipItems.map((item) =>
          updateDoc(doc(db, 'memberships', item.membershipId), {
            status: 'active',
            paidAt: serverTimestamp(),
            posSaleId: saleId,
          }).catch((err) =>
            console.error(`Failed to activate membership ${item.membershipId}:`, err)
          )
        )
      );
    }

    const courtItems = payloadCart.filter((item) => item.cat === 'court' && item.courtBooking);
    if (courtItems.length > 0) {
      await Promise.all(
        courtItems.map((item) => {
          if (item.bookingId) {
            return updateDoc(doc(db, 'rentals', item.bookingId), {
              paymentStatus: 'paid',
              paidAmount: item.discountedLineTotal,
              discountAmount: item.lineDiscountAmount,
              posSaleId: saleId,
              updatedAt: serverTimestamp(),
            }).catch((err) => console.error('Failed to mark booking paid:', err));
          }
          return addDoc(collection(db, 'courtBookings'), {
            hubId: activeHubId,
            membershipId: item.membershipId || null,
            memberCode: item.memberCode || null,
            memberName: selectedMember?.memberName || note.trim() || 'Walk-in',
            ...item.courtBooking,
            originalAmount: item.originalLineTotal,
            discountAmount: item.lineDiscountAmount,
            paidAmount: item.discountedLineTotal,
            status: 'confirmed',
            posSaleId: saleId,
            createdAt: serverTimestamp(),
          }).catch((err) => console.error('Failed to record POS court booking:', err));
        })
      );
    }

    setPendingPrintSale(saleData);
    clearCart();
    setMsg({ bad: false, t: `Sale completed! Total Charged: ${money(r.total)}` });
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
      <div
        className="cq-head"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Point of Sale</h1>
          <span style={{ fontSize: '0.875rem' }} className="cq-mut">
            Tap products to add to current ticket
          </span>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
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

      <div
        className="pos-container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Product Catalog */}
        <CatalogPanel
          queryStr={q}
          onQueryChange={setQ}
          categories={cats}
          activeCat={cat}
          onSelectCat={setCat}
          isStoreRole={isStoreRole}
          openPlayFee={st.openPlayFee}
          unpaidMemberships={unpaidMemberships}
          products={shown}
          inCart={inCart}
          money={money}
          onAddLine={add}
          onAddProduct={addProduct}
        />

        {/* Right Column: Order Ticket & Checkout */}
        <div className="cq-card pos-cart" style={{ padding: '18px', borderRadius: '12px' }}>
          <h2
            style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              margin: '0 0 12px 0',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--bd, #f3f4f6)',
            }}
          >
            Current Order
          </h2>

          <MemberLookupBar
            selectedMember={selectedMember}
            memberSearch={memberSearch}
            onSearchChange={setMemberSearch}
            memberMatches={memberMatches}
            totalAvailableCount={searchableMembers.length}
            perks={activePerks}
            onSelectMember={selectMember}
            onClearMember={clearSelectedMember}
          />

          {cart.length === 0 ? (
            <div
              style={{ padding: '40px 20px', textAlign: 'center', fontSize: '0.9rem' }}
              className="cq-mut"
            >
              🛒 Ticket is currently empty. Tap items to start.
            </div>
          ) : (
            <div style={{ maxHeight: '340px', overflowY: 'auto', marginBottom: '16px' }}>
              {cart.map((line) => (
                <CartItemRow
                  key={line.key}
                  line={line}
                  currency={st.currency}
                  money={money}
                  onSetQty={setQty}
                  onRemove={removeItem}
                  onSetDiscount={setItemDiscount}
                />
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div
              style={{
                background: 'var(--bg, #f9fafb)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '14px',
                border: '1px solid var(--bd, #e5e7eb)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: '6px',
                }}
              >
                <span className="cq-mut">Gross Subtotal</span>
                <span>{money(totals.gross)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  marginBottom: '6px',
                }}
              >
                <span className="cq-mut">Cart Discount</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={cartDiscountValue}
                    onChange={(e) => setCartDiscountValue(e.target.value)}
                    style={{
                      width: '55px',
                      padding: '2px 6px',
                      fontSize: '0.8rem',
                      borderRadius: '4px',
                      border: '1px solid var(--bd, #d1d5db)',
                    }}
                  />
                  <button
                    type="button"
                    className={`small ${cartDiscountType === 'amount' ? 'on' : ''}`}
                    onClick={() => setCartDiscountType('amount')}
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    {st.currency || '$'}
                  </button>
                  <button
                    type="button"
                    className={`small ${cartDiscountType === 'percent' ? 'on' : ''}`}
                    onClick={() => setCartDiscountType('percent')}
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    %
                  </button>
                </div>
              </div>

              {totals.discount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    color: '#ea580c',
                    fontWeight: 600,
                  }}
                >
                  <span>Total Discount</span>
                  <span>- {money(totals.discount)}</span>
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
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{money(totals.net)}</span>
          </div>

          {/* Payment Method Selector */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${METHODS.length}, 1fr)`,
                gap: '6px',
              }}
            >
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

          {/* Cash Details */}
          {method === 'Cash' && (
            <div
              style={{
                background: 'var(--bg, #f8fafc)',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--bd, #e2e8f0)',
                marginBottom: '12px',
              }}
            >
              <input
                type="number"
                min="0"
                value={tendered}
                placeholder="Cash Received"
                onChange={(e) => setTendered(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '0.9rem',
                  borderRadius: '6px',
                  border: '1px solid var(--bd, #cbd5e1)',
                }}
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
                    {amt === totals.net ? 'Exact' : amt}
                  </button>
                ))}
              </div>
              {Number(tendered) > 0 && (
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: change >= 0 ? '#16a34a' : '#dc2626',
                    marginTop: '6px',
                    textAlign: 'right',
                  }}
                >
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
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--bd, #d1d5db)',
              }}
            />
          </div>

          <button
            type="button"
            className="primary"
            disabled={
              !cart.length || busy || (method === 'Cash' && Number(tendered) > 0 && change < 0)
            }
            onClick={charge}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: 700,
              border: 'none',
              borderRadius: '8px',
            }}
          >
            {busy ? 'Processing Transaction…' : `Complete Sale • ${money(totals.net)}`}
          </button>

          {msg && (
            <div className={`cq-msg ${msg.bad ? 'error' : ''}`} style={{ marginTop: '12px' }}>
              {msg.t}
            </div>
          )}
        </div>
      </div>

      <ReceiptModals
        hubName={hub?.doc?.name}
        money={money}
        pendingPrintSale={pendingPrintSale}
        completedSale={completedSale}
        onConfirmPrint={() => {
          setCompletedSale(pendingPrintSale);
          setPendingPrintSale(null);
        }}
        onSkipPrint={() => setPendingPrintSale(null)}
        onCloseReceipt={() => setCompletedSale(null)}
      />
    </div>
  );
}