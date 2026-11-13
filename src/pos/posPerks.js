export function normalizeDoc(item) {
    if (!item) return null;
    return item.doc && typeof item.doc === 'object' ? { id: item.id, ...item.doc } : item;
  }
  
  export function parseDateValue(val) {
    if (!val) return null;
    const d = val.toDate ? val.toDate() : new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  
  /**
   * Evaluates active Firestore benefitRules (`POS_DISCOUNT`, `BOOKING_DISCOUNT`, etc.)
   * without tier restrictions, honoring priority, date windows, and `stackable: true`.
   */
  export function evaluateMemberPerk(rules, acceptedCodes) {
    if (!Array.isArray(rules) || rules.length === 0) return null;
    const now = new Date();
    const codeSet = new Set(Array.isArray(acceptedCodes) ? acceptedCodes : [acceptedCodes]);
  
    const matching = rules
      .filter((r) => {
        if (r.isActive === false || r.active === false) return false;
        const code = r.benefitCode || r.benefitType;
        if (!codeSet.has(code)) return false;
  
        const vType = r.valueType || r.discountType;
        if (vType !== 'PERCENTAGE' && vType !== 'PERCENT' && vType !== 'FIXED' && vType !== 'AMOUNT') {
          return false;
        }
  
        const start = parseDateValue(r.validFrom);
        if (start && now < start) return false;
  
        const end = parseDateValue(r.validUntil);
        if (end && now > end) return false;
  
        return true;
      })
      .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));
  
    if (matching.length === 0) return null;
  
    const primary = matching[0];
    const stackableRules = matching.slice(1).filter((r) => r.stackable === true);
  
    if (stackableRules.length === 0) return primary;
  
    const primaryType = primary.valueType || primary.discountType;
    const isPrimaryPct = primaryType === 'PERCENTAGE' || primaryType === 'PERCENT';
    let combinedValue = Number(primary.value ?? primary.discountValue) || 0;
    const titles = [primary.title].filter(Boolean);
  
    for (const r of stackableRules) {
      const rType = r.valueType || r.discountType;
      const isRPct = rType === 'PERCENTAGE' || rType === 'PERCENT';
      if (isRPct === isPrimaryPct) {
        combinedValue += Number(r.value ?? r.discountValue) || 0;
        if (r.title) titles.push(r.title);
      }
    }
  
    return {
      ...primary,
      title: titles.join(' + '),
      valueType: isPrimaryPct ? 'PERCENTAGE' : 'FIXED',
      value: isPrimaryPct ? Math.min(100, combinedValue) : combinedValue,
    };
  }
  
  export function formatPerkLabel(perk, prefix) {
    if (!perk) return '';
    const val = perk.value ?? perk.discountValue ?? 0;
    const type = perk.valueType || perk.discountType;
    const isPct = type === 'PERCENTAGE' || type === 'PERCENT';
    return ` · ${prefix}: ${val}${isPct ? '%' : ''} off`;
  }
  
  export function applyMemberPerkToLine(line, perksByCat) {
    const matchedPerk = perksByCat?.[line.cat] || null;
    if (matchedPerk) {
      const valType = matchedPerk.valueType || matchedPerk.discountType;
      const isPct = valType === 'PERCENTAGE' || valType === 'PERCENT';
      return {
        ...line,
        discountType: isPct ? 'percent' : 'amount',
        discountValue: Number(matchedPerk.value ?? matchedPerk.discountValue) || 0,
        memberPerkApplied: true,
      };
    }
    if (line.memberPerkApplied) {
      return {
        ...line,
        discountType: 'amount',
        discountValue: 0,
        memberPerkApplied: false,
      };
    }
    return line;
  }
  
  export function getItemUnitPrice(line) {
    const val = Math.max(0, Number(line.discountValue) || 0);
    if (line.discountType === 'percent') {
      const pct = Math.min(100, val);
      return Math.max(0, line.price * (1 - pct / 100));
    }
    return Math.max(0, line.price - val);
  }