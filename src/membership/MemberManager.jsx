import React, { useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Crown,
  UserPlus,
  UserCheck,
  UserX,
  Calendar,
  CreditCard,
  Save,
  X,
  Link2,
  Trash2,
} from 'lucide-react';
import { db } from '../sync/firebaseConfig';
import Icon from '../components/Icon.jsx';

const TIER_OPTIONS = [
//   { id: 'silver', label: 'Silver', defaultPrice: 500 },
//   { id: 'gold', label: 'Gold', defaultPrice: 1000 },
  { id: 'vip', label: 'VIP', defaultPrice: 2000 },
];

const FILTER_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'UNPAID', label: 'Unpaid (POS)' },
//   { id: 'silver', label: 'Silver' },
//   { id: 'gold', label: 'Gold' },
  { id: 'vip', label: 'VIP' },
];

// --- Pure Date & Formatting Utilities ---

const toLocalDateStr = (dateObj) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const addMonthsDateStr = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return toLocalDateStr(d);
};

const parseTimestampToDate = (ts) => {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
};

const formatExpiry = (ts) => {
  const d = parseTimestampToDate(ts);
  if (!d) return 'No expiration';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeHubPrefix = (hubCode, hubId) => {
  const raw = (hubCode || hubId || 'MEM').toString().trim().toUpperCase();
  return raw.replace(/[^A-Z0-9]/g, '') || 'MEM';
};

const formatMemberCode = (prefix, seq, year = new Date().getFullYear()) =>
  `${prefix}-${year}-${String(seq).padStart(4, '0')}`;

const getUserDisplayName = (u, fallback = '') =>
  u?.displayName || u?.name || u?.fullName || fallback;

const getUserPhone = (u, fallback = null) =>
  u?.phone || u?.phoneNumber || u?.mobile || fallback;

const getMembershipState = (m) => {
  const tierLabel = m.tierId?.toUpperCase() || 'TIER';

  if (m.status === 'pending_payment') {
    return { isActive: false, isPendingPayment: true, label: `${tierLabel} (Unpaid)`, color: '#e67700' };
  }
  if (m.status !== 'active') {
    return { isActive: false, label: `${m.tierId?.toUpperCase() || 'NONE'} (${m.status})`, color: '#868e96' };
  }
  const end = parseTimestampToDate(m.validUntil);
  if (end && new Date() > end) {
    return { isActive: false, expired: true, label: `${tierLabel} (Expired)`, color: '#d9480f' };
  }
  return { isActive: true, label: tierLabel, color: '#2b8a3e' };
};

// --- Subcomponent: New Member Registration Form ---

function NewMemberForm({
  hubId,
  hubPrefix,
  users,
  existingCodesSet,
  highestExistingSeq,
  nextPreviewCode,
  onCreated,
  onError,
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    customCode: '',
    linkedUserId: '',
    tierId: 'gold',
    fee: 1000,
    validUntil: addMonthsDateStr(1),
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  const patch = (updates) => setForm((prev) => ({ ...prev, ...updates }));

  const isCustomCodeDuplicate = useMemo(() => {
    const normalized = form.customCode.trim().toUpperCase();
    return normalized.length > 0 && existingCodesSet.has(normalized);
  }, [form.customCode, existingCodesSet]);

  const handleSelectLinkedUser = (uid) => {
    if (!uid) {
      patch({ linkedUserId: '', name: '', email: '', phone: '' });
      return;
    }
    const found = users.find((u) => u.id === uid);
    patch({
      linkedUserId: uid,
      name: getUserDisplayName(found, ''),
      email: found?.email || '',
      phone: getUserPhone(found, '') || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError(null);

    if (!hubId) return onError('No active hub selected.');
    if (!form.name.trim()) return onError('Member name is required.');

    const normalizedCustomCode = form.customCode.trim().toUpperCase();
    if (normalizedCustomCode && existingCodesSet.has(normalizedCustomCode)) {
      return onError(`Member code "${normalizedCustomCode}" is already in use at this hub.`);
    }

    const feeAmount = Number(form.fee) || 0;
    const requiresPayment = feeAmount > 0;

    setCreating(true);
    try {
      const endOfDay = form.validUntil ? new Date(`${form.validUntil}T23:59:59`) : null;
      const currentYear = new Date().getFullYear();
      const counterRef = doc(db, 'hubCounters', `${hubId}_${currentYear}`);
      const newMemberRef = doc(collection(db, 'memberships'));

      const assignedCode = await runTransaction(db, async (tx) => {
        const counterSnap = await tx.get(counterRef);
        const currentSeq = counterSnap.exists()
          ? counterSnap.data().memberSeq || 0
          : highestExistingSeq;

        let nextSeq = Math.max(currentSeq, highestExistingSeq) + 1;
        let finalCode = normalizedCustomCode;

        if (!finalCode) {
          finalCode = formatMemberCode(hubPrefix, nextSeq, currentYear);
          while (existingCodesSet.has(finalCode)) {
            nextSeq += 1;
            finalCode = formatMemberCode(hubPrefix, nextSeq, currentYear);
          }
        }

        const safeCodeKey = finalCode.replace(/[^A-Z0-9_-]/g, '_');
        const codeLockRef = doc(db, 'hubMemberCodes', `${hubId}_${safeCodeKey}`);
        const codeLockSnap = await tx.get(codeLockRef);

        if (codeLockSnap.exists()) {
          throw new Error(`DUPLICATE_CODE:${finalCode}`);
        }

        const yearPrefix = `${hubPrefix}-${currentYear}-`;
        let effectiveSeq = currentSeq;
        if (!normalizedCustomCode) {
          effectiveSeq = nextSeq;
        } else if (finalCode.startsWith(yearPrefix)) {
          const parsedCustomSeq = parseInt(finalCode.slice(yearPrefix.length), 10);
          if (!Number.isNaN(parsedCustomSeq)) {
            effectiveSeq = Math.max(currentSeq, parsedCustomSeq);
          }
        }

        tx.set(
          counterRef,
          { hubId, hubCode: hubPrefix, year: currentYear, memberSeq: effectiveSeq, updatedAt: serverTimestamp() },
          { merge: true }
        );

        tx.set(codeLockRef, {
          hubId,
          hubCode: hubPrefix,
          memberCode: finalCode,
          membershipId: newMemberRef.id,
          createdAt: serverTimestamp(),
        });

        tx.set(newMemberRef, {
          hubId,
          hubCode: hubPrefix,
          memberSeq: !normalizedCustomCode ? nextSeq : null,
          memberCode: finalCode,
          memberName: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim().toLowerCase() || null,
          userId: form.linkedUserId || null,
          tierId: form.tierId,
          status: requiresPayment ? 'pending_payment' : 'active',
          feeAmount,
          validFrom: Timestamp.now(),
          validUntil: endOfDay ? Timestamp.fromDate(endOfDay) : null,
          notes: form.notes.trim() || null,
          createdAt: serverTimestamp(),
        });

        return finalCode;
      });

      onCreated({
        requiresPayment,
        assignedCode,
        memberName: form.name.trim(),
        tierId: form.tierId,
        posPayload: {
          type: 'MEMBERSHIP_REGISTRATION',
          hubId,
          membershipId: newMemberRef.id,
          memberCode: assignedCode,
          memberName: form.name.trim(),
          tierId: form.tierId,
          amount: feeAmount,
          validUntil: form.validUntil || null,
          description: `${form.tierId.toUpperCase()} Membership (${assignedCode}) - ${form.name.trim()}`,
        },
      });
    } catch (err) {
      console.error('Failed to create membership:', err);
      if (err.message?.startsWith('DUPLICATE_CODE:')) {
        const dupCode = err.message.split(':')[1];
        onError(`Member code "${dupCode}" has already been used. Please choose a different code.`);
      } else {
        onError('Failed to create membership. Verify hub admin permissions.');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="cq-sel"
      style={{ marginTop: 14 }}
      aria-label="Register new hub member"
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Register New Hub Membership</div>

      <div className="cq-row">
        <input
          type="text"
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Full name *"
          aria-label="Member full name"
          required
        />
        <input
          type="text"
          value={form.phone}
          onChange={(e) => patch({ phone: e.target.value })}
          placeholder="Phone number (optional)"
          aria-label="Member phone"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => patch({ email: e.target.value })}
          placeholder="Email (optional)"
          aria-label="Member email"
        />
        <input
          type="text"
          value={form.customCode}
          onChange={(e) => patch({ customCode: e.target.value.toUpperCase() })}
          placeholder={`Auto: ${nextPreviewCode}`}
          title="Leave blank for automatic 4-digit sequential ID"
          aria-label="Member code"
          aria-invalid={isCustomCodeDuplicate}
          style={{ width: 195, ...(isCustomCodeDuplicate ? { borderColor: '#d9480f' } : {}) }}
        />
      </div>

      {isCustomCodeDuplicate && (
        <div className="cq-msg" style={{ color: '#d9480f', marginTop: 6 }}>
          Member code <b>{form.customCode.trim().toUpperCase()}</b> is already in use at this hub.
        </div>
      )}

      {users.length > 0 && (
        <div className="cq-row" style={{ marginTop: 8 }}>
          <span className="cq-mut" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon icon={Link2} size={14} />
            Link online account:
          </span>
          <select
            value={form.linkedUserId}
            onChange={(e) => handleSelectLinkedUser(e.target.value)}
            aria-label="Link online user account"
          >
            <option value="">Walk-in only (No online account linked)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {getUserDisplayName(u, 'User')} ({u.email || u.id})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="cq-row" style={{ marginTop: 8 }}>
        <span className="cq-mut">Tier:</span>
        {TIER_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`small${form.tierId === t.id ? ' primary' : ''}`}
            onClick={() => patch({ tierId: t.id, fee: t.defaultPrice })}
          >
            {t.label}
          </button>
        ))}

        <span className="cq-mut" style={{ marginLeft: 8 }}>Fee (₱):</span>
        <input
          type="number"
          min="0"
          step="1"
          value={form.fee}
          onChange={(e) => patch({ fee: e.target.value })}
          aria-label="Membership fee"
          style={{ width: 95 }}
        />

        <span className="cq-mut" style={{ marginLeft: 8 }}>Expires:</span>
        <input
          type="date"
          value={form.validUntil}
          onChange={(e) => patch({ validUntil: e.target.value })}
          aria-label="Membership expiration date"
        />
        <button type="button" className="small" onClick={() => patch({ validUntil: addMonthsDateStr(12) })}>
          +1 Yr
        </button>
        <button type="button" className="small" onClick={() => patch({ validUntil: '' })}>
          No Expiry
        </button>
      </div>

      <div className="cq-row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Front-desk note (optional)"
          aria-label="Notes"
          style={{ flex: 1, minWidth: 220 }}
        />
        <button
          type="submit"
          className="primary"
          disabled={creating || isCustomCodeDuplicate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon icon={Number(form.fee) > 0 ? CreditCard : Save} size={16} />
          {creating
            ? 'Saving…'
            : Number(form.fee) > 0
            ? `Save & Pay at POS (₱${Number(form.fee).toLocaleString()})`
            : `Save Free Member (${form.customCode.trim().toUpperCase() || nextPreviewCode})`}
        </button>
      </div>
    </form>
  );
}

// --- Subcomponent: Inline Member Edit / Renewal Row ---

function MemberEditRow({ member, hubId, users, onCancel, onSaved, onError }) {
  const initialTier = TIER_OPTIONS.find((t) => t.id === member.tierId) || TIER_OPTIONS[1];
  const initialDate = parseTimestampToDate(member.validUntil);

  const [tierId, setTierId] = useState(initialTier.id);
  const [status, setStatus] = useState(member.status || 'active');
  const [validUntil, setValidUntil] = useState(initialDate ? toLocalDateStr(initialDate) : '');
  const [linkedUserId, setLinkedUserId] = useState(member.userId || '');
  const [renewFee, setRenewFee] = useState(member.feeAmount ?? initialTier.defaultPrice);
  const [saving, setSaving] = useState(false);

  const handleSave = async (goToPOS = false) => {
    setSaving(true);
    onError(null);
    try {
      const endOfDay = validUntil ? new Date(`${validUntil}T23:59:59`) : null;
      const linkedUser = linkedUserId ? users.find((u) => u.id === linkedUserId) : null;
      const resolvedName = getUserDisplayName(linkedUser, member.memberName);

      await updateDoc(doc(db, 'memberships', member.id), {
        tierId,
        status: goToPOS ? 'pending_payment' : status,
        userId: linkedUserId || null,
        ...(linkedUser
          ? {
              memberName: resolvedName,
              email: (linkedUser.email || member.email || '').toLowerCase() || null,
              phone: getUserPhone(linkedUser, member.phone),
            }
          : {}),
        validUntil: endOfDay ? Timestamp.fromDate(endOfDay) : null,
        updatedAt: serverTimestamp(),
      });

      onSaved({
        goToPOS,
        resolvedName,
        posPayload: {
          type: 'MEMBERSHIP_RENEWAL',
          hubId,
          membershipId: member.id,
          memberCode: member.memberCode,
          memberName: resolvedName,
          tierId,
          amount: Number(renewFee) || 0,
          validUntil: validUntil || null,
          description: `${tierId.toUpperCase()} Renewal (${member.memberCode}) - ${resolvedName}`,
        },
      });
    } catch (err) {
      console.error('Failed to update membership:', err);
      onError('Failed to update membership.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr style={{ borderBottom: '1px solid rgba(128, 128, 128, 0.2)' }}>
      <td colSpan={5} style={{ padding: '12px' }}>
        <div className="cq-sel">
          <div className="cq-row" style={{ marginBottom: 8 }}>
            <span className="cq-mut">Tier:</span>
            {TIER_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`small${tierId === t.id ? ' primary' : ''}`}
                onClick={() => {
                  setTierId(t.id);
                  setRenewFee(t.defaultPrice);
                }}
              >
                {t.label}
              </button>
            ))}

            <span className="cq-mut" style={{ marginLeft: 8 }}>Status:</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="suspended">Suspended</option>
            </select>

            {users.length > 0 && (
              <>
                <span className="cq-mut" style={{ marginLeft: 8 }}>App Account:</span>
                <select value={linkedUserId} onChange={(e) => setLinkedUserId(e.target.value)}>
                  <option value="">Walk-in (Unlinked)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getUserDisplayName(u, u.email || u.id)}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="cq-row">
            <span className="cq-mut" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon icon={Calendar} size={14} />
              Expires:
            </span>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            <button type="button" className="small" onClick={() => setValidUntil(addMonthsDateStr(12))}>
              +1 Yr
            </button>
            <button type="button" className="small" onClick={() => setValidUntil('')}>
              No Expiry
            </button>

            <span className="cq-mut" style={{ marginLeft: 8 }}>Renewal Fee (₱):</span>
            <input
              type="number"
              min="0"
              step="1"
              value={renewFee}
              onChange={(e) => setRenewFee(e.target.value)}
              style={{ width: 90 }}
            />

            <div className="cq-row" style={{ marginLeft: 'auto' }}>
              <button type="button" className="small" onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="small" onClick={() => handleSave(false)} disabled={saving}>
                Save Only
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => handleSave(true)}
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Icon icon={CreditCard} size={15} />
                {saving ? 'Saving…' : 'Renew & Pay at POS'}
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// --- Main Component ---

export default function MemberManager({ hubId, hubCode, onProceedToPOS }) {
  const [memberships, setMemberships] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');
  const [msg, setMsg] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const hubPrefix = useMemo(() => normalizeHubPrefix(hubCode, hubId), [hubCode, hubId]);

  useEffect(() => {
    if (!hubId) {
      setMemberships([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'memberships'), where('hubId', '==', hubId));

    return onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setMemberships(fetched);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading hub memberships:', err);
        setMsg({ bad: true, t: 'Unable to load hub memberships. Check Firestore permissions.' });
        setLoading(false);
      }
    );
  }, [hubId]);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}
    );
  }, []);

  const existingCodesSet = useMemo(
    () => new Set(memberships.map((m) => (m.memberCode || '').trim().toUpperCase()).filter(Boolean)),
    [memberships]
  );

  const highestExistingSeq = useMemo(() => {
    const yearPrefix = `${hubPrefix}-${new Date().getFullYear()}-`;
    return memberships.reduce((max, m) => {
      if (typeof m.memberSeq === 'number') return Math.max(max, m.memberSeq);
      if (typeof m.memberCode === 'string' && m.memberCode.toUpperCase().startsWith(yearPrefix)) {
        const parsed = parseInt(m.memberCode.slice(yearPrefix.length), 10);
        if (!Number.isNaN(parsed)) return Math.max(max, parsed);
      }
      return max;
    }, 0);
  }, [memberships, hubPrefix]);

  const nextPreviewCode = useMemo(() => {
    const year = new Date().getFullYear();
    let candidateSeq = highestExistingSeq + 1;
    while (existingCodesSet.has(formatMemberCode(hubPrefix, candidateSeq, year))) {
      candidateSeq += 1;
    }
    return formatMemberCode(hubPrefix, candidateSeq, year);
  }, [hubPrefix, highestExistingSeq, existingCodesSet]);

  const sendToPOS = (payload) => {
    if (typeof onProceedToPOS === 'function') {
      onProceedToPOS(payload);
      return;
    }
    sessionStorage.setItem('pending_pos_membership', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('navigate-to-pos', { detail: payload }));
  };

  const handlePayNow = (m) => {
    const tierObj = TIER_OPTIONS.find((t) => t.id === m.tierId);
    sendToPOS({
      type: 'MEMBERSHIP_PAYMENT',
      hubId,
      membershipId: m.id,
      memberCode: m.memberCode,
      memberName: m.memberName,
      tierId: m.tierId,
      amount: Number(m.feeAmount) || tierObj?.defaultPrice || 0,
      validUntil: null,
      description: `${(m.tierId || '').toUpperCase()} Membership (${m.memberCode}) - ${m.memberName}`,
    });
  };

  const handleRevoke = async (m) => {
    if (!window.confirm(`Suspend membership for ${m.memberName}?`)) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'memberships', m.id), {
        status: 'suspended',
        updatedAt: serverTimestamp(),
      });
      setMsg({ t: `Suspended membership for ${m.memberName}.` });
    } catch (err) {
      console.error('Failed to suspend membership:', err);
      setMsg({ bad: true, t: 'Failed to suspend membership.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Permanently delete membership record for ${m.memberName}?`)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'memberships', m.id));
      if (m.memberCode) {
        const safeCodeKey = m.memberCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
        await deleteDoc(doc(db, 'hubMemberCodes', `${hubId}_${safeCodeKey}`)).catch(() => {});
      }
      setMsg({ t: `Deleted membership record for ${m.memberName}.` });
    } catch (err) {
      console.error('Failed to delete membership:', err);
      setMsg({ bad: true, t: 'Failed to delete membership.' });
    } finally {
      setBusy(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return memberships.filter((m) => {
      const state = getMembershipState(m);
      if (filterTier === 'ACTIVE' && !state.isActive) return false;
      if (filterTier === 'UNPAID' && !state.isPendingPayment) return false;
      if (['silver', 'gold', 'vip'].includes(filterTier) && m.tierId !== filterTier) return false;

      if (!q) return true;
      return (
        (m.memberName || '').toLowerCase().includes(q) ||
        (m.memberCode || '').toLowerCase().includes(q) ||
        (m.phone || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
      );
    });
  }, [memberships, filterTier, searchTerm]);

  if (!hubId) return <div className="cq-mut">Select a hub to manage its memberships.</div>;
  if (loading) return <div className="cq-mut">Loading hub memberships…</div>;

  return (
    <div>
      {/* Header & Actions */}
      <div className="cq-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>
            Hub Members ({memberships.length}) · <span className="cq-mut">{hubPrefix}</span>
          </h3>
          <div className="cq-mut" style={{ marginTop: 2 }}>
            Register walk-in members or link online user accounts and collect payment at POS.
          </div>
        </div>

        <div className="cq-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, code, phone…"
            aria-label="Search hub members"
          />
          <button
            type="button"
            className="primary"
            onClick={() => setShowAddForm((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Icon icon={showAddForm ? X : UserPlus} size={17} />
            {showAddForm ? 'Close Form' : 'New Member'}
          </button>
        </div>
      </div>

      {/* Collapsible New Member Form */}
      {showAddForm && (
        <NewMemberForm
          hubId={hubId}
          hubPrefix={hubPrefix}
          users={users}
          existingCodesSet={existingCodesSet}
          highestExistingSeq={highestExistingSeq}
          nextPreviewCode={nextPreviewCode}
          onError={(text) => setMsg(text ? { bad: true, t: text } : null)}
          onCreated={({ requiresPayment, assignedCode, memberName, tierId, posPayload }) => {
            setShowAddForm(false);
            if (requiresPayment) {
              sendToPOS(posPayload);
            } else {
              setMsg({
                t: `Registered complimentary ${memberName} (${assignedCode}) as ${tierId.toUpperCase()}.`,
              });
            }
          }}
        />
      )}

      {/* Filter Pills */}
      <div className="cq-row" style={{ marginTop: 12 }}>
        <span className="cq-mut">Filter:</span>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`small${filterTier === tab.id ? ' primary' : ''}`}
            aria-pressed={filterTier === tab.id}
            onClick={() => setFilterTier(tab.id)}
          >
            {tab.id === 'ALL' ? `All (${memberships.length})` : tab.label}
          </button>
        ))}
      </div>

      {msg && (
        <div
          role="status"
          className="cq-msg"
          style={{ marginTop: 10, ...(msg.bad ? { color: '#d9480f' } : {}) }}
        >
          {msg.t}
        </div>
      )}

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <div className="cq-sel" style={{ marginTop: 12 }}>
          <span className="cq-mut">
            {memberships.length === 0
              ? 'No members registered at this hub yet. Click "New Member" above to add one.'
              : 'No members match your current filter.'}
          </span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid currentColor', opacity: 0.75 }}>
                <th style={{ padding: '8px 10px' }}>Member &amp; Code</th>
                <th style={{ padding: '8px 10px' }}>Account Link</th>
                <th style={{ padding: '8px 10px' }}>Tier &amp; Status</th>
                <th style={{ padding: '8px 10px' }}>Valid Until</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => {
                const state = getMembershipState(m);
                const isEditing = editingId === m.id;

                return (
                  <React.Fragment key={m.id}>
                    <tr style={{ borderBottom: '1px solid rgba(128, 128, 128, 0.2)' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 600 }}>{m.memberName}</div>
                        <div className="cq-mut">
                          <b>{m.memberCode}</b>
                          {m.phone ? ` · ${m.phone}` : ''}
                          {m.email ? ` · ${m.email}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '10px' }}>
                        {m.userId ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon icon={UserCheck} size={14} />
                            Linked App User
                          </span>
                        ) : (
                          <span className="cq-mut">Walk-in Only</span>
                        )}
                      </td>

                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontWeight: 600,
                            color: state.color,
                          }}
                        >
                          <Icon icon={Crown} size={14} />
                          {state.label}
                        </span>
                      </td>

                      <td style={{ padding: '10px' }}>{formatExpiry(m.validUntil)}</td>

                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <div className="cq-row" style={{ justifyContent: 'flex-end' }}>
                          {state.isPendingPayment && !isEditing && (
                            <button
                              type="button"
                              className="small primary"
                              disabled={busy}
                              onClick={() => handlePayNow(m)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Icon icon={CreditCard} size={14} />
                              Pay at POS
                            </button>
                          )}

                          <button
                            type="button"
                            className={`small${isEditing ? ' primary' : ''}`}
                            disabled={busy}
                            onClick={() => {
                              setMsg(null);
                              setEditingId(isEditing ? null : m.id);
                            }}
                          >
                            {isEditing ? 'Close' : 'Edit / Renew'}
                          </button>

                          {state.isActive && !isEditing && (
                            <button
                              type="button"
                              className="small"
                              disabled={busy}
                              onClick={() => handleRevoke(m)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Icon icon={UserX} size={14} />
                              Suspend
                            </button>
                          )}

                          {!isEditing && (
                            <button
                              type="button"
                              className="small"
                              disabled={busy}
                              onClick={() => handleDelete(m)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                color: '#d9480f',
                              }}
                            >
                              <Icon icon={Trash2} size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isEditing && (
                      <MemberEditRow
                        member={m}
                        hubId={hubId}
                        users={users}
                        onCancel={() => setEditingId(null)}
                        onError={(text) => setMsg(text ? { bad: true, t: text } : null)}
                        onSaved={({ goToPOS, resolvedName, posPayload }) => {
                          setEditingId(null);
                          if (goToPOS) {
                            sendToPOS(posPayload);
                          } else {
                            setMsg({ t: `Updated membership for ${resolvedName}.` });
                          }
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}