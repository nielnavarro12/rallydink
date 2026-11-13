import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../sync/firebaseConfig';
import { evaluateBenefit } from '../utils/benefitEngine';

export function useHubMembership(hubId, userId) {
  const [membership, setMembership] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen to the user's active membership at THIS specific hub
  useEffect(() => {
    if (!hubId || !userId) {
      setMembership(null);
      return;
    }

    const q = query(
      collection(db, 'memberships'),
      where('hubId', '==', hubId),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const activeDoc = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((m) => {
          if (!m.validUntil) return true;
          const expiry = m.validUntil.toDate ? m.validUntil.toDate() : new Date(m.validUntil);
          return now <= expiry;
        });

      setMembership(activeDoc || null);
    });

    return () => unsubscribe();
  }, [hubId, userId]);

  // 2. Listen to active benefit rules configured for THIS specific hub
  useEffect(() => {
    if (!hubId) {
      setRules([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'benefitRules'),
      where('hubId', '==', hubId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRules(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hubId]);

  const tierId = membership?.tierId || null;

  const getBenefit = useMemo(() => {
    return (benefitCode) => evaluateBenefit(rules, tierId, benefitCode);
  }, [rules, tierId]);

  return {
    membership,
    tierId,
    getBenefit,
    loading,
  };
}