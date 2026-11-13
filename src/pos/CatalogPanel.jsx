export default function CatalogPanel({
    queryStr,
    onQueryChange,
    categories,
    activeCat,
    onSelectCat,
    isStoreRole,
    openPlayFee,
    unpaidMemberships,
    products,
    inCart,
    money,
    onAddLine,
    onAddProduct,
  }) {
    return (
      <div className="cq-card pos-catalog-panel" style={{ padding: '18px' }}>
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            value={queryStr}
            placeholder="🔍 Search items by name..."
            onChange={(e) => onQueryChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.95rem',
              borderRadius: '8px',
              border: '1px solid var(--bd, #d1d5db)',
            }}
          />
        </div>
  
        <div
          className="pos-categories"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '16px',
          }}
        >
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onSelectCat(c)}
              className={`small ${activeCat === c ? 'on' : ''}`}
              style={{ borderRadius: '20px', padding: '6px 14px', whiteSpace: 'nowrap' }}
            >
              {c}
            </button>
          ))}
        </div>
  
        <div
          className="pos-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
          }}
        >
          {!isStoreRole && (
            <button
              type="button"
              className="pos-tile special"
              onClick={() =>
                onAddLine({
                  key: 'openplay',
                  cat: 'openplay',
                  id: '',
                  name: 'Open play entry',
                  price: Number(openPlayFee) || 0,
                })
              }
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '14px',
                height: '110px',
                textAlign: 'left',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              <b style={{ fontSize: '0.95rem' }}>🎾 Open Play Entry</b>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{money(openPlayFee)}</span>
            </button>
          )}
  
          {unpaidMemberships.map((m) => (
            <button
              key={m.id}
              type="button"
              className="pos-tile special"
              onClick={() =>
                onAddLine({
                  key: `membership_${m.id}`,
                  cat: 'membership',
                  id: m.id,
                  membershipId: m.id,
                  memberCode: m.memberCode,
                  name: `Membership (${m.memberCode})`,
                  price: Number(m.feeAmount) || 0,
                })
              }
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px',
                height: '110px',
                textAlign: 'left',
                borderRadius: '10px',
                cursor: 'pointer',
                border: '1px dashed #e67700',
              }}
            >
              <div>
                <b style={{ fontSize: '0.88rem', display: 'block' }}>👑 {m.memberName}</b>
                <small className="cq-mut">{m.memberCode} · Pending</small>
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {money(m.feeAmount || 0)}
              </span>
            </button>
          ))}
  
          {products.map((p) => {
            const available = p.track ? (Number(p.stock) || 0) - inCart(p.id) : null;
            const out = p.track && available <= 0;
            const isLow = p.track && (Number(p.stock) || 0) <= (Number(p.low) || 5);
  
            return (
              <button
                key={p.id}
                type="button"
                disabled={out}
                onClick={() => onAddProduct(p)}
                className="pos-tile"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '12px',
                  height: '110px',
                  textAlign: 'left',
                  borderRadius: '10px',
                  opacity: out ? 0.5 : 1,
                  cursor: out ? 'not-allowed' : 'pointer',
                }}
              >
                <b
                  style={{
                    fontSize: '0.9rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {p.name}
                </b>
                <div>
                  <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700 }}>
                    {money(p.price)}
                  </span>
                  {p.track && (
                    <small
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: out ? '#ef4444' : isLow ? '#d97706' : 'var(--mut, #6b7280)',
                      }}
                    >
                      {out ? 'Out of stock' : `${Number(p.stock) || 0} in stock`}
                    </small>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }