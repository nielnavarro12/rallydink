import { Navigate as RNavigate, useLocation } from 'react-router-dom';
import { Navigate } from '../hub/links.jsx';
import { useAuth } from '../data/hooks.js';

/* admin: only staff/group admins may enter; everyone else goes to the client area. Signed-out visitors go to login. */
export function RequireAuth({ admin = false, children }) {
  const { loading, user, isAdmin, isGroupAdmin } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="cq" role="status">Loading…</div>;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: loc.pathname.replace(/^\/h\/[^/]+/, '') || '/' }}
      />
    );
  }

  // Allow access if they are a hub staff member (isAdmin) OR a multi-hub Group Admin
  if (admin && !isAdmin && !isGroupAdmin) {
    return <Navigate to="/c" replace />;
  }

  return children;
}

/* a staff page that needs a permission; without it the visitor goes back to the dashboard */
export function RequirePerm({ perm, children }) {
  const { can } = useAuth();
  return can(perm) ? children : <Navigate to="/" replace />;
}

/* Platform console: Super Admins OR Group Admins (users with assigned hubs) */
export function RequireSuper({ children }) {
  const { loading, user, isSuper, assignedHubs } = useAuth();

  if (loading) return <div className="cq" role="status">Loading…</div>;

  if (!user) return <RNavigate to="/" replace />;

  const hasGroupAccess = isSuper || (Array.isArray(assignedHubs) && assignedHubs.length > 0);

  // If user is neither Super Admin nor Group Admin, redirect them to their home/login
  if (!hasGroupAccess) {
    return <RNavigate to="/" replace />;
  }

  return children;
}