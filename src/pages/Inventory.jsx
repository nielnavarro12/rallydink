import { useState } from 'react';
import { useAuth, useCollection } from '../data/hooks.js';
import { changeStock, deleteProduct, saveProduct } from '../money/domain.js';
import { dayStartMs } from '../money/dates.js';
import { fmtMoney, useSettings } from '../money/pricing.js';

const EMPTY = { id: '', name: '', category: '', price: '', cost: '', stock: '', track: true, low: 5 };
const REASON = { sale: 'Sale', restock: 'Restock', adjust: 'Count', void: 'Refund' };
const time = (ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function InventoryPage() {
  const { user } = useAuth();
  const st = useSettings();
  const money = (n) => fmtMoney(n, st.currency);
  const products = useCollection('products');
  const log = useCollection('stockLog', { where: ['ts', '>=', dayStartMs(14)] });
  const [form, setForm] = useState(EMPTY);
  const [qty, setQty] = useState({}); // per product: restock amount
  const [count, setCount] = useState({}); // per product: counted total
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    if (!form.name.trim() || form.price === '') return;
    const p = { ...form, name: form.name.trim(), category: form.category.trim(), price: +form.price, cost: form.cost === '' ? '' : +form.cost, low: +form.low || 0, active: true };
    const editing = !!p.id;
    if (!editing) { p.stock = p.track ? +form.stock || 0 : 0; } else { delete p.stock; } // stock changes go through restock / count
    if (!p.id) delete p.id;
    const id = await saveProduct(p);
    if (!editing && p.track && p.stock > 0) await changeStock(user, id, { setTo: p.stock, reason: 'restock' });
    setMsg(`Saved ${p.name}.`);
    setForm(EMPTY);
  };
  const act = async (p, args) => {
    const r = await changeStock(user, p.id, args);
    setMsg(r.ok ? `Updated ${p.name}.` : r.error);
    return r.ok;
  };

  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
  const lowCount = products.filter((p) => p.track && (Number(p.stock) || 0) <= (Number(p.low) || 0)).length;
  const value = products.reduce((n, p) => n + (p.track ? (Number(p.stock) || 0) * (Number(p.cost) || 0) : 0), 0);

  return (
    <div className="cq">
      <div className="cq-head"><h1>Inventory</h1></div>

      <div className="cq-stats">
        <div className="cq-stat"><span>{products.length}</span>products</div>
        <div className="cq-stat"><span>{lowCount}</span>low or out of stock</div>
        <div className="cq-stat"><span>{money(value)}</span>stock value (at cost)</div>
      </div>

      <div className="cq-card">
        <h2>{form.id ? `Edit ${form.name}` : 'Add a product'}</h2>
        <div className="cq-row">
          <input type="text" value={form.name} placeholder="Name (required)" onChange={set('name')} />
          <input type="text" value={form.category} placeholder="Category (e.g. Drinks)" onChange={set('category')} />
        </div>
        <div className="cq-row" style={{ marginTop: 8 }}>
          <input type="number" min={0} step="0.01" value={form.price} placeholder={`Price (${st.currency})`} onChange={set('price')} style={{ maxWidth: 150 }} aria-label="Price" />
          <input type="number" min={0} step="0.01" value={form.cost} placeholder={`Cost (${st.currency})`} onChange={set('cost')} style={{ maxWidth: 150 }} aria-label="Cost" />
          {!form.id && <input type="number" min={0} value={form.stock} placeholder="Starting stock" onChange={set('stock')} style={{ maxWidth: 150 }} aria-label="Starting stock" disabled={!form.track} />}
          <input type="number" min={0} value={form.low} placeholder="Low at" onChange={set('low')} style={{ maxWidth: 110 }} aria-label="Low stock level" disabled={!form.track} />
          <label className="cq-check"><input type="checkbox" checked={form.track} onChange={set('track')} /> Track stock</label>
        </div>
        <div className="cq-row" style={{ marginTop: 10 }}>
          <button className="primary" disabled={!form.name.trim() || form.price === ''} onClick={save}>{form.id ? 'Save changes' : 'Add product'}</button>
          {form.id && <button onClick={() => setForm(EMPTY)}>Cancel</button>}
          {msg && <span role="status" className="cq-mut">{msg}</span>}
        </div>
      </div>

      <div className="cq-card">
        <h2>Products</h2>
        {sorted.length === 0 && <div className="cq-mut">No products yet.</div>}
        {sorted.map((p) => {
          const low = p.track && (Number(p.stock) || 0) <= (Number(p.low) || 0);
          return (
            <div className="cq-item inv-row" key={p.id}>
              <span>
                <b>{p.name}</b> <span className="cq-mut">{p.category || 'Other'} · {money(p.price)}{p.cost !== '' && p.cost != null ? ` · cost ${money(p.cost)}` : ''}</span>
                <div>{p.track ? <span className={low ? 'low' : ''}>{Number(p.stock) || 0} in stock{low ? ' (low)' : ''}</span> : <span className="cq-mut">Stock not tracked</span>}</div>
              </span>
              <span className="cq-row" style={{ gap: 6 }}>
                {p.track && (
                  <>
                    <input type="number" min={1} value={qty[p.id] || ''} placeholder="+ qty" onChange={(e) => setQty((s) => ({ ...s, [p.id]: e.target.value }))} style={{ width: 80 }} aria-label={`Restock ${p.name}`} />
                    <button className="small" disabled={!(+qty[p.id] > 0)} onClick={async () => { if (await act(p, { delta: +qty[p.id], reason: 'restock' })) setQty((s) => ({ ...s, [p.id]: '' })); }}>Restock</button>
                    <input type="number" min={0} value={count[p.id] ?? ''} placeholder="count" onChange={(e) => setCount((s) => ({ ...s, [p.id]: e.target.value }))} style={{ width: 80 }} aria-label={`Counted stock for ${p.name}`} />
                    <button className="small" disabled={count[p.id] === undefined || count[p.id] === ''} onClick={async () => { if (await act(p, { setTo: +count[p.id], reason: 'adjust' })) setCount((s) => ({ ...s, [p.id]: '' })); }}>Set count</button>
                  </>
                )}
                <button className="small" onClick={() => { setForm({ ...EMPTY, ...p, cost: p.cost ?? '', stock: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                <button className="small" aria-label={`Delete ${p.name}`} onClick={() => window.confirm(`Delete ${p.name}?`) && deleteProduct(p.id)}>✕</button>
              </span>
            </div>
          );
        })}
      </div>

      <div className="cq-card">
        <h2>Stock history (last 14 days)</h2>
        {log.length === 0 && <div className="cq-mut">No stock changes yet.</div>}
        {[...log].sort((a, b) => b.ts - a.ts).slice(0, 25).map((e) => (
          <div className="cq-item" key={e.id}>
            <span>{e.name} <span className="cq-mut">· {REASON[e.reason] || e.reason}</span></span>
            <span className="cq-mut"><b style={{ color: e.delta < 0 ? '#d9480f' : 'var(--ac)' }}>{e.delta > 0 ? '+' : ''}{e.delta}</b> → {e.after} · {time(e.ts)}{e.byName ? ` · ${e.byName}` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
