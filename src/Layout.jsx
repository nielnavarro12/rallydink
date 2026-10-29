import { Outlet } from 'react-router-dom';
import { NavLink, useHubHref } from './hub/links.jsx';
import { useAuth } from './data/hooks.js';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/queue', label: 'Queue', perm: 'queue' },
  { to: '/rentals', label: 'Rentals', perm: 'bookings' },
  { to: '/open-play', label: 'Open play', perm: 'bookings' },
  { to: '/pos', label: 'POS', perm: 'pos' },
  { to: '/inventory', label: 'Inventory', perm: 'inventory' },
  { to: '/income', label: 'Income', perm: 'income' },
  { to: '/players', label: 'Players', perm: 'players' },
  { to: '/users', label: 'Users', perm: 'staff' },
  { to: '/stats', label: 'Stats', perm: 'queue' },
  { to: '/ads', label: 'TV & ads', perm: 'tv' },
  { to: '/account', label: 'Settings' },
];

export default function Layout() {
  const { mode, can, isSuper, hub } = useAuth();
  const hh = useHubHref();

  return (
    <>
      <nav className="cq-nav" aria-label="Main">
        <div className="cq-nav-in">
          <div className="cq-nav-brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {hub?.logoUrl ? (
              <img
                src={hub.logoUrl}
                alt={`${hub.name || 'Hub'} Logo`}
               className="logo"
              />
            ) : (
              <span>🏸</span>
            )}
            <b>{hub ? hub.name : 'Court Queue'}</b>
          </div>

          {links
            .filter((l) => !l.perm || can(l.perm))
            .map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {l.label}
              </NavLink>
            ))}

          <NavLink to="/c" className="cq-nav-tv">
            Client page
          </NavLink>
          {isSuper && mode === 'firebase' && <NavLink to="/platform">Platform</NavLink>}
          <a href={hh('/tv')} target="_blank" rel="noreferrer">
            📺 TV
          </a>
        </div>
      </nav>
      <Outlet />
    </>
  );
}