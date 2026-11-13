import React, { useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ShieldCheck,
  Sparkles,
  Power,
  Trash2,
  Layers,
} from 'lucide-react';
import { db } from '../sync/firebaseConfig';
import Icon from '../components/Icon.jsx';

export default function BenefitRulesList({ hubId }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!hubId) {
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMsg(null);

    const q = query(collection(db, 'benefitRules'), where('hubId', '==', hubId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1));

        setRules(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching hub benefit rules:', error);
        setMsg({
          bad: true,
          t:
            error.code === 'permission-denied'
              ? 'Firestore permission denied on "benefitRules". Check hub admin rules.'
              : `Unable to load benefit rules: ${error.message}`,
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hubId]);

  const getScheduleState = (rule) => {
    if (!rule.isActive) return { key: 'DISABLED', text: 'Disabled', color: '#868e96' };

    const now = new Date();
    const start = rule.validFrom?.toDate ? rule.validFrom.toDate() : new Date(rule.validFrom);
    const end = rule.validUntil?.toDate ? rule.validUntil.toDate() : null;

    if (now < start) return { key: 'SCHEDULED', text: 'Scheduled', color: '#e67700' };
    if (end && now > end) return { key: 'EXPIRED', text: 'Expired', color: '#d9480f' };
    return { key: 'LIVE', text: 'Live Now', color: '#2b8a3e' };
  };

  const handleToggleActive = async (rule) => {
    setBusyId(rule.id);
    setMsg(null);
    const nextState = !rule.isActive;
    try {
      await updateDoc(doc(db, 'benefitRules', rule.id), {
        isActive: nextState,
      });
      setMsg({
        t: `"${rule.title}" ${nextState ? 'enabled' : 'disabled'}.`,
      });
    } catch (err) {
      console.error('Failed to update rule status:', err);
      setMsg({ bad: true, t: 'Failed to update rule status. Verify hub admin permissions.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (rule) => {
    const confirmed = window.confirm(
      `Permanently delete "${rule.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(rule.id);
    setMsg(null);
    try {
      await deleteDoc(doc(db, 'benefitRules', rule.id));
      setMsg({ t: `Deleted "${rule.title}".` });
    } catch (err) {
      console.error('Failed to delete rule:', err);
      setMsg({ bad: true, t: 'Failed to delete rule. Verify hub admin permissions.' });
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'No expiration';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatReward = (rule) => {
    if (rule.valueType === 'PERCENTAGE') return `${rule.value}% Off`;
    if (rule.valueType === 'FIXED') return `₱${rule.value} Off`;
    if (rule.valueType === 'QUOTA') {
      const period = rule.resetPeriod ? ` / ${rule.resetPeriod.toLowerCase()}` : '';
      return `${rule.value} Uses${period}`;
    }
    return 'Feature Unlocked';
  };

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const state = getScheduleState(rule);
      if (filterType === 'PERMANENT' && rule.ruleType !== 'PERMANENT') return false;
      if (filterType === 'PROMOTIONAL' && rule.ruleType !== 'PROMOTIONAL') return false;
      if (filterType === 'LIVE' && state.key !== 'LIVE') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = rule.title?.toLowerCase().includes(q);
        const matchCode = rule.benefitCode?.toLowerCase().includes(q);
        const matchTier = rule.targetTiers?.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchCode || matchTier;
      }

      return true;
    });
  }, [rules, filterType, searchTerm]);

  if (!hubId) {
    return <div className="cq-mut">Select a hub to view its benefit rules.</div>;
  }

  if (loading) {
    return <div className="cq-mut">Loading hub benefit rules…</div>;
  }

  return (
    <div>
      {/* Header & Search */}
      <div className="cq-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Configured Hub Benefit Rules ({rules.length})</h3>
          <div className="cq-mut" style={{ marginTop: 2 }}>
            Manage active perks, promotional schedules, and rule precedence for this hub.
          </div>
        </div>

        <div className="cq-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, code, or tier…"
            aria-label="Search benefit rules"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="cq-row" style={{ marginTop: 12 }}>
        <span className="cq-mut">Filter:</span>
        {[
          { id: 'ALL', label: `All (${rules.length})` },
          { id: 'LIVE', label: 'Live Now' },
          { id: 'PERMANENT', label: 'Permanent' },
          { id: 'PROMOTIONAL', label: 'Promotional' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`small${filterType === tab.id ? ' primary' : ''}`}
            aria-pressed={filterType === tab.id}
            onClick={() => setFilterType(tab.id)}
          >
            {tab.label}
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

      {/* Rules List */}
      {filteredRules.length === 0 ? (
        <div className="cq-sel" style={{ marginTop: 12 }}>
          <span className="cq-mut">
            {rules.length === 0
              ? 'No benefit rules configured for this hub yet.'
              : 'No benefit rules match your current filter.'}
          </span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid currentColor', opacity: 0.75 }}>
                <th style={{ padding: '8px 10px' }}>Rule &amp; Classification</th>
                <th style={{ padding: '8px 10px' }}>Reward</th>
                <th style={{ padding: '8px 10px' }}>Eligible Tiers</th>
                <th style={{ padding: '8px 10px' }}>Schedule</th>
                <th style={{ padding: '8px 10px' }}>Priority</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => {
                const status = getScheduleState(rule);
                const isBusy = busyId === rule.id;
                const isPromo = rule.ruleType === 'PROMOTIONAL';

                return (
                  <tr
                    key={rule.id}
                    style={{
                      borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
                      opacity: rule.isActive ? 1 : 0.6,
                    }}
                  >
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 600 }}>{rule.title}</div>
                      <div
                        className="cq-mut"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        <Icon icon={isPromo ? Sparkles : ShieldCheck} size={13} />
                        <span>{isPromo ? 'Promotional' : 'Permanent'}</span>
                        {rule.stackable && (
                          <>
                            <span>·</span>
                            <Icon icon={Layers} size={13} />
                            <span>Stackable</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 600 }}>{formatReward(rule)}</div>
                      <div className="cq-mut">{rule.benefitCode}</div>
                    </td>

                    <td style={{ padding: '10px' }}>
                      {!rule.targetTiers || rule.targetTiers.length === 0 ? (
                        <span className="cq-mut">All Tiers</span>
                      ) : (
                        <b>{rule.targetTiers.map((t) => t.toUpperCase()).join(', ')}</b>
                      )}
                    </td>

                    <td style={{ padding: '10px' }}>
                      <div>
                        <span className="cq-mut">From: </span>
                        {formatDate(rule.validFrom)}
                      </div>
                      <div>
                        <span className="cq-mut">Until: </span>
                        {formatDate(rule.validUntil)}
                      </div>
                    </td>

                    <td style={{ padding: '10px' }}>
                      <b>{rule.priority ?? 1}</b>
                    </td>

                    <td style={{ padding: '10px' }}>
                      <span style={{ fontWeight: 600, color: status.color }}>
                        ● {status.text}
                      </span>
                    </td>

                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div className="cq-row" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className={`small${!rule.isActive ? ' primary' : ''}`}
                          disabled={isBusy}
                          onClick={() => handleToggleActive(rule)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Icon icon={Power} size={14} />
                          {rule.isActive ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          type="button"
                          className="small"
                          disabled={isBusy}
                          onClick={() => handleDelete(rule)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#d9480f',
                          }}
                        >
                          <Icon icon={Trash2} size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}