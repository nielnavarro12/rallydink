import { Outlet } from 'react-router-dom';
import { NavLink } from '../hub/links.jsx';
import { data } from '../data/index.js';
import { useAuth } from '../data/hooks.js';

const links = [
  { to: '/c', label: 'Book a court', end: true },
  { to: '/c/open-play', label: 'Open play' },
  { to: '/c/profile', label: 'My profile' },
];

/* the page for clients (players): book courts, join open play, edit their profile */
export default function ClientLayout() {
  const { user, isAdmin, mode, hub } = useAuth();
  return (
    <>
      <nav className="cq-nav" aria-label="Main">
        <div className="cq-nav-in">
          <b>🏸 {hub ? hub.name : 'Court Queue'}</b>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>{l.label}</NavLink>
          ))}
          <span className="cq-nav-tv" />
          {isAdmin && mode === 'firebase' && <NavLink to="/">Staff area</NavLink>}
          {mode === 'firebase' && user && <a href="#/" onClick={(e) => { e.preventDefault(); data.auth.signOut(); }}>Sign out</a>}
        </div>
      </nav>
      <Outlet />
    </>
  );
}
