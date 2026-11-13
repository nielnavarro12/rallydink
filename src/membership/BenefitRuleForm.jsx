import React, { useState } from 'react';
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import {
  PlusCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Layers,
  Calendar,
  Tag,
  Eye,
} from 'lucide-react';
import { db } from '../sync/firebaseConfig';
import Icon from '../components/Icon.jsx';

const BENEFIT_OPTIONS = [
  { code: 'BOOKING_DISCOUNT', label: 'Court / Booking Discount' },
  { code: 'POS_DISCOUNT', label: 'POS / Merch Discount' },
  { code: 'GUEST_PASS', label: 'Free Guest Pass' },
  { code: 'PRIORITY_BOOKING', label: 'Priority Booking Window' },
];

const TIER_OPTIONS = [
  // { id: 'silver', label: 'Silver' },
  // { id: 'gold', label: 'Gold' },
  // { id: 'vip', label: 'VIP' },
];

const RESET_OPTIONS = [
  { id: 'MONTHLY', label: 'Monthly (1st of month)' },
  { id: 'WEEKLY', label: 'Weekly (Every Sunday)' },
  { id: 'CAMPAIGN', label: 'Once per campaign / lifetime' },
];

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function BenefitRuleForm({ hubId, onSuccess }) {
  const [title, setTitle] = useState('');
  const [benefitCode, setBenefitCode] = useState('BOOKING_DISCOUNT');
  const [ruleType, setRuleType] = useState('PERMANENT');
  const [targetTiers, setTargetTiers] = useState([]);
  const [valueType, setValueType] = useState('PERCENTAGE');
  const [value, setValue] = useState(10);
  const [resetPeriod, setResetPeriod] = useState('MONTHLY');
  const [validFrom, setValidFrom] = useState(getDefaultDateTimeLocal());
  const [validUntil, setValidUntil] = useState('');
  const [priority, setPriority] = useState(1);
  const [stackable, setStackable] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleTierToggle = (tierId) => {
    setTargetTiers((prev) =>
      prev.includes(tierId) ? prev.filter((id) => id !== tierId) : [...prev, tierId]
    );
  };

  const handleRuleTypeChange = (newType) => {
    setRuleType(newType);
    setMsg(null);
    if (newType === 'PERMANENT') {
      setValidUntil('');
      setPriority(1);
      if (valueType === 'QUOTA') setResetPeriod('MONTHLY');
    } else {
      setPriority(10);
      if (valueType === 'QUOTA') setResetPeriod('CAMPAIGN');
    }
  };

  const handleReset = () => {
    setTitle('');
    setBenefitCode('BOOKING_DISCOUNT');
    setRuleType('PERMANENT');
    setTargetTiers([]);
    setValueType('PERCENTAGE');
    setValue(10);
    setResetPeriod('MONTHLY');
    setValidFrom(getDefaultDateTimeLocal());
    setValidUntil('');
    setPriority(1);
    setStackable(false);
    setIsActive(true);
    setMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!hubId) {
      return setMsg({ bad: true, t: 'No active hub selected.' });
    }
    if (!title.trim()) {
      return setMsg({ bad: true, t: 'Display title is required.' });
    }
    if (valueType !== 'BOOLEAN' && (!value || Number(value) <= 0)) {
      return setMsg({ bad: true, t: 'Reward value must be greater than 0.' });
    }
    if (ruleType === 'PROMOTIONAL' && !validUntil) {
      return setMsg({ bad: true, t: 'Promotional campaigns require an expiration date.' });
    }

    const startDate = new Date(validFrom);
    const endDate = ruleType === 'PROMOTIONAL' && validUntil ? new Date(validUntil) : null;

    if (endDate && endDate <= startDate) {
      return setMsg({ bad: true, t: 'Expiration date must be after the start date.' });
    }

    setSubmitting(true);

    try {
      const payload = {
        hubId,
        title: title.trim(),
        benefitCode,
        ruleType,
        targetTiers,
        valueType,
        value: valueType === 'BOOLEAN' ? 1 : Number(value),
        ...(valueType === 'QUOTA' ? { resetPeriod } : {}),
        validFrom: Timestamp.fromDate(startDate),
        validUntil: endDate ? Timestamp.fromDate(endDate) : null,
        priority: Number(priority),
        stackable,
        isActive,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'benefitRules'), payload);

      setMsg({ t: `Saved "${title.trim()}" to this hub's benefit rules.` });
      setTitle('');
      if (ruleType === 'PROMOTIONAL') setValidUntil('');
      if (onSuccess) onSuccess(docRef.id, payload);
    } catch (err) {
      console.error('Failed to save benefit rule:', err);
      setMsg({ bad: true, t: 'Unable to save rule. Verify hub admin permissions.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!hubId) {
    return <div className="cq-mut">Select a hub before creating benefit rules.</div>;
  }

  const tierSummary =
    targetTiers.length === 0
      ? 'all active hub members'
      : `${targetTiers.map((t) => t.toUpperCase()).join(', ')} members`;

  const rewardSummary =
    valueType === 'PERCENTAGE'
      ? `${value || 0}% off`
      : valueType === 'FIXED'
      ? `₱${value || 0} off`
      : valueType === 'QUOTA'
      ? `${value || 0} free uses (${resetPeriod.toLowerCase()})`
      : 'feature access';

  return (
    <form onSubmit={handleSubmit} aria-label="Create Hub Membership Benefit Rule">
      <div className="cq-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Create Hub Benefit Rule</h3>
          <div className="cq-mut" style={{ marginTop: 2 }}>
            Configure permanent tier perks or scheduled promos for this hub.
          </div>
        </div>
        <button
          type="button"
          className="small"
          onClick={handleReset}
          disabled={submitting}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Icon icon={RotateCcw} size={14} />
          Reset
        </button>
      </div>

      {/* Section 1 */}
      <div style={{ marginTop: 16 }}>
        <div className="cq-mut" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon icon={Tag} size={14} />
          <span>1. Rule Classification &amp; Identity</span>
        </div>

        <div className="cq-row">
          <button
            type="button"
            className={ruleType === 'PERMANENT' ? 'primary' : 'small'}
            onClick={() => handleRuleTypeChange('PERMANENT')}
            aria-pressed={ruleType === 'PERMANENT'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Icon icon={ShieldCheck} size={16} />
            Permanent Tier Perk
          </button>
          <button
            type="button"
            className={ruleType === 'PROMOTIONAL' ? 'primary' : 'small'}
            onClick={() => handleRuleTypeChange('PROMOTIONAL')}
            aria-pressed={ruleType === 'PROMOTIONAL'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Icon icon={Sparkles} size={16} />
            Promotional Campaign
          </button>
        </div>

        <div className="cq-row" style={{ marginTop: 8 }}>
          <input
            type="text"
            placeholder={
              ruleType === 'PERMANENT'
                ? 'Customer-facing title (e.g., Gold Member 10% Perk)'
                : 'Campaign title (e.g., Weekend Flash Sale: 25% Off)'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Customer-facing title"
            style={{ flex: 2, minWidth: 220 }}
            required
          />

          <select
            value={benefitCode}
            onChange={(e) => setBenefitCode(e.target.value)}
            aria-label="Benefit category"
            style={{ flex: 1, minWidth: 180 }}
          >
            {BENEFIT_OPTIONS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 2 */}
      <div style={{ marginTop: 16 }}>
        <div className="cq-mut" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon icon={Layers} size={14} />
          <span>2. Reward Value &amp; Precedence</span>
        </div>

        <div className="cq-row">
          <select
            value={valueType}
            onChange={(e) => setValueType(e.target.value)}
            aria-label="Reward calculation type"
          >
            <option value="PERCENTAGE">Percentage Discount (%)</option>
            <option value="FIXED">Fixed Amount Discount (₱)</option>
            <option value="QUOTA">Usage Quota (Count)</option>
            <option value="BOOLEAN">Feature Unlock (Yes/No)</option>
          </select>

          {valueType !== 'BOOLEAN' && (
            <input
              type="number"
              min="1"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                valueType === 'PERCENTAGE'
                  ? 'Percent (%)'
                  : valueType === 'FIXED'
                  ? 'Amount (₱)'
                  : 'Quota count'
              }
              aria-label="Reward amount"
              style={{ width: 120 }}
              required
            />
          )}

          {valueType === 'QUOTA' && (
            <select
              value={resetPeriod}
              onChange={(e) => setResetPeriod(e.target.value)}
              aria-label="Quota reset period"
            >
              {RESET_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          )}

          <span className="cq-mut">Priority:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Rule priority"
            style={{ width: 72 }}
          />
        </div>
      </div>


      <div style={{ marginTop: 16 }}>
              {/* Section 3
        <div className="cq-mut" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon icon={Calendar} size={14} />
          <span>3. Target Tiers &amp; Active Schedule</span>
        </div>

        <div className="cq-row">
          <span className="cq-mut">Eligible Tiers:</span>
          {TIER_OPTIONS.map((tier) => {
            const selected = targetTiers.includes(tier.id);
            return (
              <button
                key={tier.id}
                type="button"
                className={`small${selected ? ' primary' : ''}`}
                aria-pressed={selected}
                onClick={() => handleTierToggle(tier.id)}
              >
                {tier.label}
              </button>
            );
          })}
          <span className="cq-mut">
            {targetTiers.length === 0 ? 'All tiers included' : `${targetTiers.length} selected`}
          </span>
        </div>

 */}
        <div className="cq-row" style={{ marginTop: 8 }}>
          <span className="cq-mut">Starts:</span>
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            aria-label="Start date and time"
            required
          />

          {ruleType === 'PROMOTIONAL' && (
            <>
              <span className="cq-mut">Expires:</span>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                aria-label="Expiration date and time"
                required
              />
            </>
          )}
        </div>
      </div>
      {/* Live Preview */}
      <div className="cq-sel" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon={Eye} size={16} />
        <span>
          <strong>Summary:</strong> Grants <b>{rewardSummary}</b> on{' '}
          <b>{BENEFIT_OPTIONS.find((b) => b.code === benefitCode)?.label}</b> for{' '}
          <b>{tierSummary}</b> ({stackable ? 'stacks with other perks' : `priority ${priority}`}).
        </span>
      </div>

      {/* Flags & Submit */}
      <div className="cq-row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <div className="cq-row">
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={stackable}
              onChange={(e) => setStackable(e.target.checked)}
            />
            <span>Stackable with other rules</span>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Publish immediately</span>
          </label>
        </div>

        <button
          type="submit"
          className="primary"
          disabled={submitting}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Icon icon={PlusCircle} size={18} />
          {submitting ? 'Publishing…' : 'Create Benefit Rule'}
        </button>
      </div>

      {msg && (
        <div
          role="status"
          className="cq-msg"
          style={msg.bad ? { color: '#d9480f' } : undefined}
        >
          {msg.t}
        </div>
      )}
    </form>
  );
}