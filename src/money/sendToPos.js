export function sendBookingToPos({
    bookingId = null,
    courtName,
    bookingDate,
    startTime,
    endTime = null,
    durationHours = 1,
    hourlyRate = 0,
    originalAmount,
    member = null,
    onNavigate = null, // pass your router/tab setter e.g. () => setTab('pos')
  }) {
    const payload = {
      type: 'COURT_BOOKING',
      bookingId,
      courtName,
      bookingDate,
      startTime,
      endTime,
      durationHours,
      hourlyRate,
      originalAmount: Number(originalAmount) || 0,
      discountAmount: 0, // PosPage will auto-calculate from Firestore benefitRules if member is active
      membershipId: member?.id || null,
      memberCode: member?.memberCode || null,
      memberName: member?.memberName || null,
      description: `${courtName} (${bookingDate} ${startTime}${endTime ? ` - ${endTime}` : ''})`,
    };
  
    sessionStorage.setItem('pending_pos_membership', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('navigate-to-pos', { detail: payload }));
  
    if (typeof onNavigate === 'function') {
      onNavigate();
    }
  }