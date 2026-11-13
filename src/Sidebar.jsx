import { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useHubHref } from "./hub/links.jsx";
import { useAuth } from "./data/hooks.js";
import { data } from "./data/index.js";

import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  ShoppingBag,
  Package,
  DollarSign,
  UserCheck,
  Shield,
  BarChart3,
  Tv,
  Settings,
  Layers,
  Menu,
  X,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import Icon from "./components/Icon.jsx";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/queue", label: "Queue", icon: Users, perm: "queue" },
  { to: "/rentals", label: "Rentals", icon: Calendar, perm: "bookings" },
  { to: "/open-play", label: "Open play", icon: Trophy, perm: "bookings" },
  { to: "/pos", label: "POS", icon: ShoppingBag, perm: "pos" },
  { to: "/inventory", label: "Inventory", icon: Package, perm: "inventory" },
  { to: "/income", label: "Income", icon: DollarSign, perm: "income" },
  { to: "/players", label: "Players", icon: UserCheck, perm: "players" },
  { to: "/users", label: "Users", icon: Shield, perm: "staff" },
  { to: "/stats", label: "Stats", icon: BarChart3, perm: "queue" },
  { to: "/ads", label: "TV & ads", icon: Tv, perm: "tv" },
  { to: "/account", label: "Settings", icon: Settings , perm: "settings" },
  { to: "/membership", label: "Membership", icon: Settings , perm: "membership" },
];

const Sidebar = () => {
  const { mode, can, isSuper, hub, user, role, assignedHubs } = useAuth();
  const hh = useHubHref();
  const [isOpen, setIsOpen] = useState(false);
  const hasPlatformAccess = isSuper || (Array.isArray(assignedHubs) && assignedHubs.length > 0);
  const toggleMobileMenu = () => setIsOpen((prev) => !prev);
  const closeMobileMenu = () => setIsOpen(false);

  // Derive display name and role with safe fallbacks
  const displayName = user?.name || user?.displayName || data?.auth?.name|| user?.email || "User";
  const displayRole = role || (isSuper ? "Super Admin" : "Staff");

  return (
    <>
      {/* Burger Button Portal */}
      {!isOpen &&
        createPortal(
          <button
            type="button"
            className="cq-sidebar-burger"
            onClick={toggleMobileMenu}
            aria-label="Open Menu"
          >
            <Icon icon={Menu} size={22} />
          </button>,
          document.body
        )}

      {/* Backdrop Portal */}
      {isOpen &&
        createPortal(
          <div className="cq-sidebar-backdrop" onClick={closeMobileMenu} />,
          document.body
        )}

      {/* Sidebar Drawer */}
      <aside
        className={`cq-sidebar ${isOpen ? "open" : ""}`}
        aria-label="Main Navigation"
      >
        <div className="cq-sidebar-in">
          {/* Mobile Header */}
          <div className="cq-sidebar-header">
            <span className="cq-sidebar-brand">{hub?.name || "Drive 'N Dink"}</span>
            <button
              type="button"
              className="cq-sidebar-close"
              onClick={closeMobileMenu}
              aria-label="Close Menu"
            >
              <Icon icon={X} size={20} />
            </button>
          </div>
          <div className="cq-sidebar-footer">
            
          </div>
          {/* Navigation Items */}
          <nav className="cq-sidebar-links">
            
            {links
              .filter((l) => !l.perm || can(l.perm))
              .map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `cq-sidebar-link ${isActive ? "active" : ""}`
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                  }}
                >
                  <Icon icon={l.icon} className="cq-sidebar-icon" size={18} />
                  <span>{l.label}</span>
                </NavLink>
              ))}

            {hasPlatformAccess && mode === "firebase" && (
              <NavLink
                to="/platform"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `cq-sidebar-link ${isActive ? "active" : ""}`
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                }}
              >
                <Icon icon={Layers} className="cq-sidebar-icon" size={18} />
                <span>Hubs/Store</span>
              </NavLink>
            )}

            <a
              href={hh("/tv")}
              target="_blank"
              rel="noreferrer"
              onClick={closeMobileMenu}
              className="cq-sidebar-link cq-sidebar-tv"
              style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
            >
              <Icon icon={Tv} className="cq-sidebar-icon" size={18} />
              <span>TV</span>
            </a>
            <a
              href="#logout"
              onClick={(e) => {
                e.preventDefault();
                closeMobileMenu();
                data.auth.signOut();
              }}
              className="cq-sidebar-link cq-sidebar-logout"
              style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
            >
              <Icon icon={LogOut} className="cq-sidebar-icon" size={18} />
              <span>Sign out</span>
            </a>
          </nav>

          {/* User Profile & Sign Out Footer */}
          <div className="cq-sidebar-footer">
            <div className="cq-sidebar-user">
              <div className="cq-sidebar-avatar">
                <Icon icon={UserIcon} size={16} />
              </div>
              <div className="cq-sidebar-user-info">
                <span className="cq-sidebar-user-name">{displayName}</span>
                <span className="cq-sidebar-user-role">{displayRole}</span>
              </div>
            </div>

           
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;