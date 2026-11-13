export default function ReceiptModals({
    hubName,
    money,
    pendingPrintSale,
    completedSale,
    onConfirmPrint,
    onSkipPrint,
    onCloseReceipt,
  }) {
    const overlayStyle = {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      backdropFilter: 'blur(3px)',
    };
  
    return (
      <>
        {pendingPrintSale && (
          <div style={{ ...overlayStyle, zIndex: 9998 }}>
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
                  type="button"
                  className="primary"
                  onClick={onConfirmPrint}
                  style={{ flex: 1, padding: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Yes, Preview & Print
                </button>
                <button
                  type="button"
                  onClick={onSkipPrint}
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
  
        {completedSale && (
          <div style={{ ...overlayStyle, zIndex: 9999 }}>
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
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '16px',
                  borderBottom: '1px dashed var(--bd, #9ca3af)',
                  paddingBottom: '12px',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: 'var(--primary, #111827)',
                  }}
                >
                  {hubName || "DRIVE 'N DINK"}
                </h2>
                <div style={{ fontSize: '0.8rem' }} className="cq-mut">
                  Official Receipt
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }} className="cq-mut">
                  Txn #: {completedSale.id}
                </div>
                <div style={{ fontSize: '0.75rem' }} className="cq-mut">
                  Date: {completedSale.date}
                </div>
                {completedSale.member && (
                  <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>
                    Member: {completedSale.member.memberName} ({completedSale.member.memberCode})
                  </div>
                )}
              </div>
  
              <div
                style={{
                  borderBottom: '1px dashed var(--bd, #9ca3af)',
                  paddingBottom: '12px',
                  marginBottom: '12px',
                }}
              >
                {completedSale.items.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                      }}
                    >
                      <span>{item.name}</span>
                      <span>{money(item.discountedLineTotal)}</span>
                    </div>
                    <div
                      style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}
                      className="cq-mut"
                    >
                      <span>
                        {item.qty} x {money(item.unitPriceAfterDiscount)}
                      </span>
                      {item.lineDiscountAmount > 0 && (
                        <span>(Disc: -{money(item.lineDiscountAmount)})</span>
                      )}
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      color: '#ea580c',
                    }}
                  >
                    <span>Discounts:</span>
                    <span>-{money(completedSale.totalDiscount)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    fontSize: '1.05rem',
                    borderTop: '1px solid var(--bd, #e5e7eb)',
                    paddingTop: '6px',
                    marginTop: '6px',
                    color: 'var(--primary, #111827)',
                  }}
                >
                  <span>TOTAL:</span>
                  <span>{money(completedSale.total)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    fontSize: '0.8rem',
                  }}
                  className="cq-mut"
                >
                  <span>Paid via ({completedSale.method}):</span>
                  <span>
                    {money(
                      completedSale.method === 'Cash' ? completedSale.tendered : completedSale.total
                    )}
                  </span>
                </div>
                {completedSale.method === 'Cash' && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      marginTop: '2px',
                    }}
                    className="cq-mut"
                  >
                    <span>Change:</span>
                    <span>{money(completedSale.change)}</span>
                  </div>
                )}
              </div>
  
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  borderTop: '1px dashed var(--bd, #9ca3af)',
                  paddingTop: '12px',
                  marginBottom: '16px',
                }}
                className="cq-mut"
              >
                Thank you for visiting!
                <br />
                Please retain receipt for entry verification.
              </div>
  
              <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="primary"
                  onClick={() => window.print()}
                  style={{ flex: 1, padding: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  type="button"
                  onClick={onCloseReceipt}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--bd, #d1d5db)',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }