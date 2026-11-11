import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { data, setHub } from '../data/index.js';
import { AuthContext, dropHubStores, useAuth } from '../data/hooks.js';
import { can as roleCan, normalizeRole } from '../auth/roles.js';
import { applyTheme } from '../platform/domain.js';

export const HubContext = createContext({ id: '', doc: null });
export const useHub = () => useContext(HubContext);

async function ensureProfile(user) {
  try {
    const p = await data.getDoc('players', user.uid);
    if (!p) {
      await data.setDoc('players', user.uid, {
        uid: user.uid,
        name: user.name || (user.email || 'Player').split('@')[0],
        email: user.email,
        createdAt: Date.now(),
      });
    }
  } catch {
    /* Profile can be created later */
  }
}

export function HubProvider({ children }) {
  const { hubId } = useParams();
  const parent = useAuth();
  const [hub, setHubDoc] = useState({ loading: true, doc: null });
  const [staff, setStaff] = useState({ loading: true, doc: null });

  const uid = parent.user && parent.user.uid;

  // 1. Point data layer and watch current hub document
  useEffect(() => {
    setHub(hubId);
    const off = data.watchDoc(
      'hubs',
      hubId,
      (doc) => setHubDoc({ loading: false, doc }),
      () => setHubDoc({ loading: false, doc: null })
    );
    return () => {
      off();
      dropHubStores(hubId);
    };
  }, [hubId]);

  // 2. Synchronously apply visual theme
  const theme = hub.doc && hub.doc.theme;
  useLayoutEffect(() => {
    if (theme) {
      applyTheme(theme);
    }
  }, [theme]);

  // 3. Resolve permissions (Super Admin > Multi-Hub/Group Admin > Local Staff)
  const isSuper = parent.isSuper;
  const isGroupAdmin = Array.isArray(parent.user?.assignedHubs) && parent.user.assignedHubs.includes(hubId);

  useEffect(() => {
    if (!uid) {
      setStaff({ loading: false, doc: null });
      return;
    }
    // Bypasses local staff fetch if user is platform Super Admin or has Group Admin rights to this hub
    if (data.mode === 'local' || isSuper || isGroupAdmin) {
      setStaff({ loading: false, doc: { role: 'owner' } });
      return;
    }
    setStaff({ loading: true, doc: null });
    return data.watchDoc(
      'admins',
      uid,
      (doc) => setStaff({ loading: false, doc }),
      () => setStaff({ loading: false, doc: null })
    );
  }, [hubId, uid, isSuper, isGroupAdmin]);

  // 4. Auto-create player profile on first visit
  useEffect(() => {
    if (data.mode === 'firebase' && parent.user && hub.doc && hub.doc.active !== false) {
      ensureProfile(parent.user);
    }
  }, [hubId, uid, hub.doc]);

  // 5. Cache last visited hub
  useEffect(() => {
    try {
      if (hub.doc) localStorage.setItem('cq-last-hub', hubId);
    } catch {
      /* Private browsing fallback */
    }
  }, [hubId, hub.doc]);

  if (hub.loading) return <div className="cq" role="status">Loading…</div>;

  if (!hub.doc) {
    return (
      <div className="cq auth">
        <div className="cq-card">
          <h1>Hub not found</h1>
          <div className="cq-mut" style={{ margin: '8px 0 12px' }}>
            There is no hub with the code “{hubId}”. Check the link you were given.
          </div>
          <Link className="cq-btn" to="/">Enter another hub code</Link>
        </div>
      </div>
    );
  }

  // SUSPENSION CHECK: ONLY Platform Super Admins can access a suspended hub
  if (hub.doc.active === false && !isSuper) {
    return (
      <div className="cq auth">
        <div className="cq-card">
          <h1>{hub.doc.name}</h1>
          <div className="cq-mut" style={{ margin: '8px 0 14px' }}>
            This venue account is currently suspended or inactive. Please contact support or the venue administrator.
          </div>
          <Link className="cq-btn" to="/">
            Back to Hub Chooser
          </Link>
        </div>
      </div>
    );
  }

  // 6. Compute overall access control flags
  const isAdmin = isSuper || isGroupAdmin || !!staff.doc;
  const role = (isSuper || isGroupAdmin)
    ? 'owner'
    : staff.doc
      ? normalizeRole(staff.doc.role)
      : '';

  const can = (perm) => (data.mode === 'local' ? true : isAdmin && roleCan(role, perm));

  const auth = {
    ...parent,
    loading: parent.loading || staff.loading,
    isAdmin,
    isGroupAdmin,
    role,
    can,
    hub: hub.doc,
  };

  return (
    <HubContext.Provider value={{ id: hubId, doc: hub.doc }}>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </HubContext.Provider>
  );
}