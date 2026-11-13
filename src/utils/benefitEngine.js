export function evaluateBenefit(rules, userTierId, benefitCode) {
    if (!userTierId || !rules.length) return { value: 0, title: null };
  
    const now = new Date();
  
    const validRules = rules
      .filter((r) => r.isActive && r.benefitCode === benefitCode)
      .filter((r) => r.targetTiers.length === 0 || r.targetTiers.includes(userTierId))
      .filter((r) => {
        const start = r.validFrom?.toDate ? r.validFrom.toDate() : new Date(r.validFrom);
        const end = r.validUntil?.toDate ? r.validUntil.toDate() : null;
        return now >= start && (!end || now <= end);
      })
      .sort((a, b) => b.priority - a.priority);
  
    if (!validRules.length) return { value: 0, title: null };
  
    // Return the highest priority rule (or sum if stackable)
    const top = validRules[0];
    if (!top.stackable) {
      return { value: top.value, title: top.title };
    }
  
    const stackable = validRules.filter((r) => r.stackable);
    return {
      value: stackable.reduce((sum, r) => sum + r.value, 0),
      title: stackable.map((r) => r.title).join(' + '),
    };
  }