import { getItemUnitPrice } from './posPerks.js';

export default function CartItemRow({
  line,
  currency,
  money,
  onSetQty,
  onRemove,
  onSetDiscount,
}) {
  const unitPrice = getItemUnitPrice(line);
  const lineTotal = unitPrice * line.qty;
  const hasDiscount = Number(line.discountValue) > 0;

  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: '1px solid var(--bd, #f3f4f6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {line.name}
            {line.memberPerkApplied && (
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#2b8a3e',
                  background: 'rgba(43, 138, 62, 0.12)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                Member Perk
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem' }} className="cq-mut">
            {money(line.price)} ea
            {hasDiscount && (
              <span style={{ color: '#ea580c', marginLeft: '6px', fontWeight: 600 }}>
                (→ {money(unitPrice)})
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(line.key)}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid var(--bd, #d1d5db)',
            borderRadius: '6px',
          }}
        >
          <button
            type="button"
            onClick={() => onSetQty(line.key, line.qty - 1)}
            style={{ width: '28px', border: 'none', cursor: 'pointer' }}
          >
            −
          </button>
          <span style={{ width: '32px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
            {line.qty}
          </span>
          <button
            type="button"
            onClick={() => onSetQty(line.key, line.qty + 1)}
            style={{ width: '28px', border: 'none', cursor: 'pointer' }}
          >
            +
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem' }} className="cq-mut">
            Disc:
          </span>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={line.discountValue || ''}
            onChange={(e) => onSetDiscount(line.key, line.discountType, e.target.value)}
            style={{
              width: '48px',
              padding: '2px 4px',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: '1px solid var(--bd, #d1d5db)',
            }}
          />
          <button
            type="button"
            className={`small ${line.discountType === 'amount' ? 'on' : ''}`}
            onClick={() => onSetDiscount(line.key, 'amount', line.discountValue)}
            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
          >
            {currency || '$'}
          </button>
          <button
            type="button"
            className={`small ${line.discountType === 'percent' ? 'on' : ''}`}
            onClick={() => onSetDiscount(line.key, 'percent', line.discountValue)}
            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
          >
            %
          </button>
        </div>

        <div style={{ fontWeight: 700 }}>{money(lineTotal)}</div>
      </div>
    </div>
  );
}