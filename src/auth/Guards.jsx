import { Navigate as RNavigate, useLocation } from 'react-router-dom';
import { Navigate } from '../hub/links.jsx';
import { useAuth } from '../data/hooks.js';

/* admin: only staff may enter; everyone else goes to the client area. Signed-out visitors go to the login page. */
export function RequireAuth({ admin = false, children }) {
  const { loading, user, isAdmin } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="cq" role="status">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname.replace(/^\/h\/[^/]+/, '') || '/' }} />;
  if (admin && !isAdmin) return <Navigate to="/c" replace />;
  return children;
}

/* a staff page that needs a permission (see auth/roles.js); without it the visitor goes back to the dashboard */
export function RequirePerm({ perm, children }) {
  const { can } = useAuth();
  return can(perm) ? children : <Navigate to="/" replace />;
}

/* the platform console: super admins only */
export function RequireSuper({ children }) {
  const { loading, user, isSuper } = useAuth();
  if (loading) return <div className="cq" role="status">Loading…</div>;
  if (!user) return <RNavigate to="/login" replace />;
  if (!isSuper) return <RNavigate to="/" replace />;
  return children;
}
