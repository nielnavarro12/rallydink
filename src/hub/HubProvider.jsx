import { createContext, useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { data, setHub } from '../data/index.js';
import { AuthContext, dropHubStores, useAuth } from '../data/hooks.js';
import { can as roleCan, normalizeRole } from '../auth/roles.js';

export const HubContext = createContext({ id: '', doc: null });
export const useHub = () => useContext(HubContext);

async function ensureProfile(user) {
  try {
    const p = await data.getDoc('players', user.uid);
    if (!p) await data.setDoc('players', user.uid, { uid: user.uid, name: user.name || (user.email || 'Player').split('@')[0], email: user.email, createdAt: Date.now() });
  } catch { /* the profile can be created later */ }
}

/* Everything under /h/:hubId lives here: it points the data layer at that hub, loads the hub (name, theme, active),
   works out the signed-in person's role IN THIS HUB, and applies the hub's theme. */
export function HubProvider({ children }) {
  const { hubId } = useParams();
  setHub(hubId); // before the children render, so their data comes from this hub
  const parent = useAuth();
  const [hub, setHubDoc] = useState({ loading: true, doc: null });
  const [staff, setStaff] = useState({ loading: true, doc: null });
  const uid = parent.user && parent.user.uid;

  // the hub itself
  useEffect(() => {
    const off = data.watchDoc('hubs', hubId, (doc) => setHubDoc({ loading: false, doc }), () => setHubDoc({ loading: false, doc: null }));
    return () => { off(); dropHubStores(hubId); };
  }, [hubId]);

  // this person's staff role in this hub (the platform super admin counts as owner everywhere)
  useEffect(() => {
    if (!uid) { setStaff({ loading: false, doc: null }); return undefined; }
    if (data.mode === 'local' || parent.isSuper) { setStaff({ loading: false, doc: { role: 'owner' } }); return undefined; }
    setStaff({ loading: true, doc: null });
    return data.watchDoc('admins', uid, (doc) => setStaff({ loading: false, doc }), () => setStaff({ loading: false, doc: null }));
  }, [hubId, uid, parent.isSuper]);

  // a signed-in person gets a profile in this hub the first time they visit
  useEffect(() => {
    if (data.mode === 'firebase' && parent.user && hub.doc && hub.doc.active !== false) ensureProfile(parent.user);
  }, [hubId, uid, hub.doc && hub.doc.active]); // eslint-disable-line react-hooks/exhaustive-deps

  // theme + remember the hub on this device
  const theme = hub.doc && hub.doc.theme;
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.cqTheme = theme || 'candy';
    try { if (hub.doc) localStorage.setItem('cq-last-hub', hubId); } catch { /* private mode */ }
    return () => { delete el.dataset.cqTheme; };
  }, [theme, hubId, !!hub.doc]); // eslint-disable-line react-hooks/exhaustive-deps

  if (hub.loading) return <div className="cq" role="status">Loading…</div>;
  if (!hub.doc) {
    return (
      <div className="cq auth"><div className="cq-card">
        <h1>Hub not found</h1>
        <div className="cq-mut" style={{ margin: '8px 0 12px' }}>There is no hub with the code “{hubId}”. Check the link you were given.</div>
        <Link className="cq-btn" to="/">Enter another hub code</Link>
      </div></div>
    );
  }
  if (hub.doc.active === false && !parent.isSuper) {
    return (
      <div className="cq auth"><div className="cq-card">
        <h1>{hub.doc.name}</h1>
        <div className="cq-mut">This hub is not active right now. Please contact the venue.</div>
      </div></div>
    );
  }

  const isAdmin = parent.isSuper || !!staff.doc;
  const role = parent.isSuper ? 'owner' : staff.doc ? normalizeRole(staff.doc.role) : '';
  const can = (perm) => (data.mode === 'local' ? true : isAdmin && roleCan(role, perm));
  const auth = { ...parent, loading: parent.loading || staff.loading, isAdmin, role, can, hub: hub.doc };

  return (
    <HubContext.Provider value={{ id: hubId, doc: hub.doc }}>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </HubContext.Provider>
  );
}
