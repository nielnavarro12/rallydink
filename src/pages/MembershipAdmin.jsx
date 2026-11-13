import React, { useState } from 'react';
import { Users, ListChecks, PlusCircle } from 'lucide-react';
import MemberManager from '../membership/MemberManager';
import BenefitRulesList from '../membership/BenefitRulesList';
import BenefitRuleForm from '../membership/BenefitRuleForm';
import Icon from '../components/Icon.jsx';

import { useAuth, useCollection } from "../data/hooks.js";
const TABS = [
  { id: 'members', label: 'Members & Tiers', icon: Users },
  { id: 'rules', label: 'Benefit Rules', icon: ListChecks },
  { id: 'create', label: 'Create Rule', icon: PlusCircle },
];

export default function MembershipAdminPage() {
  const { user, can , hub} = useAuth();
  const hubId = hub.id
  const [activeTab, setActiveTab] = useState('members');
  return (
    <div className="cq">
      <div className="cq-head">
        <h1>Membership & Promotions Manager</h1>
      </div>

       {/* Tab Navigation */}
      <div
        className="cq-row"
        role="tablist"
        aria-label="Membership admin sections"
        style={{
          marginTop: 16,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(128, 128, 128, 0.25)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? 'primary' : 'small'}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Icon icon={tab.icon} size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" style={{ marginTop: 16 }}>
      {activeTab === 'members' && <MemberManager hubId={hubId} />}
        {activeTab === 'rules' && <BenefitRulesList hubId={hubId} />}
        {activeTab === 'create' && (
          <BenefitRuleForm
            hubId={hubId}
            onSuccess={() => setActiveTab('rules')}
          />
        )}
      </div>
    </div>
  );
}
