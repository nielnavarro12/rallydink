const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { evaluateBenefit } = require('../utils/benefitEngine'); // Copy or share the JS file

admin.initializeApp();
const db = admin.firestore();

exports.processMemberBooking = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const uid = request.auth.uid;
  const { baseAmount, benefitCode } = request.data;

  // 1. Fetch user's actual tier from Firestore
  const userDoc = await db.collection('users').doc(uid).get();
  const membership = userDoc.data()?.membership;
  const tierId = membership?.status === 'active' ? membership.tierId : null;

  // 2. Fetch active rules from Firestore
  const rulesSnap = await db.collection('benefitRules').where('isActive', '==', true).get();
  const rules = rulesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 3. Re-evaluate securely on server
  const { value, appliedRules } = evaluateBenefit(rules, tierId, benefitCode);
  const discountAmount = (baseAmount * value) / 100;
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return {
    finalAmount,
    discountApplied: discountAmount,
    appliedRuleIds: appliedRules.map((r) => r.id),
  };
});