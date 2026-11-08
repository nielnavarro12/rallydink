import { NavLink, useHubHref } from "./hub/links.jsx";
import { useAuth } from "./data/hooks.js";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/queue", label: "Queue", perm: "queue" },
  { to: "/rentals", label: "Rentals", perm: "bookings" },
  { to: "/open-play", label: "Open play", perm: "bookings" },
  { to: "/pos", label: "POS", perm: "pos" },
  { to: "/inventory", label: "Inventory", perm: "inventory" },
  { to: "/income", label: "Income", perm: "income" },
  { to: "/players", label: "Players", perm: "players" },
  { to: "/users", label: "Users", perm: "staff" },
  { to: "/stats", label: "Stats", perm: "queue" },
  { to: "/ads", label: "TV & ads", perm: "tv" },
  { to: "/account", label: "Settings" },
];

const Navbar = () => {
  const { mode, can, isSuper } = useAuth();
  const hh = useHubHref();

  return (
    <nav className="cq-nav" aria-label="Main">
      <div className="cq-nav-in">
        <div className="cq-nav-links">
          {links
            .filter((l) => !l.perm || can(l.perm))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                {l.label}
              </NavLink>
            ))}
          {/* <NavLink to="/c" className="cq-nav-tv">
            Client page
          </NavLink> */}
          {isSuper && mode === "firebase" && (
            <NavLink
              to="/platform"
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              Platform
            </NavLink>
          )}
       
          <a
            href={hh("/tv")}
            target="_blank"
            rel="noreferrer"
            className="cq-nav-tv"
          >
            📺 TV
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
