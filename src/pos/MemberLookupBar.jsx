import { formatPerkLabel } from './posPerks.js';

export default function MemberLookupBar({
  selectedMember,
  memberSearch,
  onSearchChange,
  memberMatches,
  totalAvailableCount,
  perks,
  onSelectMember,
  onClearMember,
}) {
  if (selectedMember) {
    const isInactive = selectedMember._isActive === false;
    const accent = isInactive ? '#e67700' : '#2b8a3e';
    const bg = isInactive ? 'rgba(230, 119, 0, 0.12)' : 'rgba(43, 138, 62, 0.12)';
    const border = isInactive ? 'rgba(230, 119, 0, 0.35)' : 'rgba(43, 138, 62, 0.35)';

    return (
      <div
        style={{
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: '8px',
          background: bg,
          border: `1px solid ${border}`,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: accent }}>
            👑 {selectedMember.memberName}
            {isInactive ? ' · Inactive/Unpaid (No Perks)' : ' · Active Member'}
          </div>
          <div style={{ fontSize: '0.75rem' }} className="cq-mut">
            {selectedMember.memberCode}
            {formatPerkLabel(perks.product, 'POS')}
            {formatPerkLabel(perks.court, 'Booking')}
          </div>
        </div>
        <button
          type="button"
          onClick={onClearMember}
          title="Remove member from order"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            padding: '4px 6px',
            color: 'inherit',
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '14px', position: 'relative' }}>
      <input
        type="text"
        value={memberSearch}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={`👑 Lookup Member (${totalAvailableCount} available)…`}
        aria-label="Lookup member"
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: '0.85rem',
          borderRadius: '6px',
          border: '1px solid var(--bd, #d1d5db)',
        }}
      />
      {memberSearch.trim() && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            marginTop: '4px',
            background: '#0b1e2d',
            color: '#f1f5f9',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '8px',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.45)',
            zIndex: 50,
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {memberMatches.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: '0.82rem', color: '#94a3b8' }}>
              No hub member found matching "{memberSearch}".
            </div>
          ) : (
            memberMatches.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMember(m)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'transparent',
                  color: 'inherit',
                  border: 'none',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.memberName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {m.memberCode}
                    {m.phone ? ` · ${m.phone}` : ''}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: m._isActive ? '#4ade80' : '#fbbf24',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: m._isActive
                      ? 'rgba(74, 222, 128, 0.15)'
                      : 'rgba(251, 191, 36, 0.15)',
                  }}
                >
                  {m._isActive ? 'ACTIVE' : m._isExpired ? 'EXPIRED' : (m.status || 'PENDING').toUpperCase()}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}