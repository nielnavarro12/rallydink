import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Make sure this points to your Firebase db export
import { evaluateBenefit } from '../utils/benefitEngine';

export function useMemberBenefits(userTierId) {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'benefitRules'), where('isActive', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRules(data);
    });

    return () => unsubscribe();
  }, []);

  const getBenefit = (benefitCode) => evaluateBenefit(rules, userTierId, benefitCode);

  return { getBenefit };
}