import "../themes.css";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import { data } from "../data/index.js";
import { useAuth, useCollection, useDocument } from "../data/hooks.js";
import { ROLES, normalizeRole } from "../auth/roles.js";
import {
  THEMES,
  addHubStaff,
  applyTheme,
  createHub,
  deleteHub,
  findUserByEmail,
  removeHubStaff,
  setHubActive,
  setHubStaffRole,
  setSuperAdmin,
  slugify,
  updateHub,
  validSlug,
} from "./domain.js";
import { Ban, CheckCircle, Play, PlayOff } from "lucide-react";
import Icon from "../components/Icon.jsx";
const banner = "./images/logo.jpeg";
const origin = () => window.location.href.split("#")[0];
const copy = (t) => {
  try {
    navigator.clipboard.writeText(t);
  } catch {
    /* fallback silently */
  }
};

/* Platform console container */
export function PlatformLayout() {
  const { user, mode } = useAuth();
  useEffect(() => {
    applyTheme("professional");
  }, []);

  return (
    <>
      <nav className="cq-nav" aria-label="Platform">
        <div className="cq-nav-in">
          <img src={banner} alt="Banner" className="logo" />
          <NavLink
            to="/platform"
            end
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            Hubs
          </NavLink>
          <NavLink
            to="/platform/admins"
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            Super & Group Admins
          </NavLink>
          <span className="cq-nav-tv" />
          <NavLink to="/">Hub chooser</NavLink>
          {mode === "firebase" && user && (
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                data.auth.signOut();
              }}
            >
              Sign out
            </a>
          )}
        </div>
      </nav>
      <Outlet />
    </>
  );
}

export function ThemePicker({ value, onChange }) {
  const handleSelect = (k) => {
    applyTheme(k);
    onChange(k);
  };

  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme">
      {Object.entries(THEMES).map(([k, t]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          className={`theme-opt${value === k ? " on" : ""}`}
          onClick={() => handleSelect(k)}
        >
          <span className="theme-sw" style={{ background: t.swatch }} />
          <b>{t.label}</b>
          <span className="cq-mut">{t.desc}</span>
        </button>
      ))}
    </div>
  );
}

function Created({ r }) {
  if (!r) return null;
  if (!r.ok)
    return (
      <div role="alert" className="cq-msg" style={{ color: "#c2255c" }}>
        {r.error}
      </div>
    );
  const o = r.owner;
  return (
    <div role="status" className="cq-msg">
      Hub <b>{r.id}</b> created.{" "}
      {o === null && "No owner yet: add one on the hub page."}
      {o && !o.ok && (
        <span style={{ color: "#c2255c" }}>
          The owner could not be added: {o.error}
        </span>
      )}
      {o && o.ok && !o.created && (
        <>{o.name} already had an account and is now the owner.</>
      )}
      {o && o.ok && o.created && (
        <>
          The owner account for {o.name} was created.{" "}
          {o.emailed
            ? "A reset-password email was sent."
            : "The reset email could not be sent."}{" "}
          Temporary password: <code>{o.password}</code> (shown once).
        </>
      )}
    </div>
  );
}

/* Multi-Hub Scope Assignment Component */
export function HubAssignmentManager({ user }) {
  const hubs = useCollection("hubs") || [];
  const [assigned, setAssigned] = useState(user?.assignedHubs || []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setAssigned(user?.assignedHubs || []);
  }, [user?.assignedHubs]);

  const toggleHub = (hubId) => {
    setAssigned((prev) =>
      prev.includes(hubId)
        ? prev.filter((id) => id !== hubId)
        : [...prev, hubId]
    );
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    setMsg("");
    try {
      await data.setDoc(
        "users",
        user.uid,
        { assignedHubs: assigned },
        { merge: true }
      );
      setMsg("Hub assignments saved.");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Failed to save hub assignments:", err);
      setMsg("Failed to save hub assignments.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cq-card" style={{ marginTop: 16 }}>
      <h2>Assigned Hub Scope for {user?.name || user?.email}</h2>
      <div className="cq-mut" style={{ margin: "6px 0 12px" }}>
        Check the hubs this user is allowed to manage as a Group Admin:
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {hubs.map((h) => {
          const isChecked = assigned.includes(h.id);
          return (
            <label
              key={h.id}
              className="cq-check"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                border: "1px solid var(--bd)",
                borderRadius: "6px",
                background: isChecked ? "var(--bg)" : "transparent",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleHub(h.id)}
              />
              <div>
                <b>{h.name || h.id}</b>
                <div style={{ fontSize: "0.75rem" }} className="cq-mut">
                  Code: {h.id}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <div className="cq-row">
        <button
          type="button"
          className="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Assigned Hubs"}
        </button>
        {msg && <span role="status" className="cq-mut">{msg}</span>}
      </div>
    </div>
  );
}

export function HubsPage() {
  const { user, isSuper, assignedHubs } = useAuth();
  const allHubs = useCollection("hubs") || [];

  // Super admins see all hubs; group admins see assigned hubs
  const hubs = isSuper
    ? allHubs
    : allHubs.filter((h) => assignedHubs.includes(h.id));

  const [f, setF] = useState({
    name: "",
    slug: "",
    theme: "candy",
    ownerName: "",
    ownerEmail: "",
  });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const onName = (e) => {
    const name = e.target.value;
    setF((v) => ({ ...v, name, slug: touched ? v.slug : slugify(name) }));
  };

  const create = async () => {
    setBusy(true);
    setRes(null);
    const r = await createHub(user, f);
    setBusy(false);
    setRes(r);
    if (r.ok) {
      setF({
        name: "",
        slug: "",
        theme: f.theme,
        ownerName: "",
        ownerEmail: "",
      });
      setTouched(false);
    }
  };

  const handleToggleSuspend = async (hub) => {
    const nextState = hub.active === false;
    const actionLabel = nextState ? "activate" : "suspend";
    if (window.confirm(`Are you sure you want to ${actionLabel} "${hub.name}"?`)) {
      await setHubActive(hub.id, nextState);
    }
  };

  const handleDeleteHub = async (hub) => {
    if (
      window.confirm(
        `DANGER: Permanently delete "${hub.name}" (${hub.id})? This action cannot be undone.`
      )
    ) {
      await deleteHub(hub.id);
    }
  };

  return (
    <div className="cq">
      <div className="cq-head">
        <h1>Hubs</h1>
      </div>

      {isSuper && (
        <div className="cq-card">
          <h2>Create a Hub/Store</h2>
          <div className="cq-row">
            <input
              type="text"
              value={f.name}
              placeholder="Hub/Store name (e.g. My Sports Club Caloocan)"
              onChange={onName}
            />
            <input
              type="text"
              value={f.slug}
              placeholder="Hub/Store code"
              onChange={(e) => {
                setTouched(true);
                setF((v) => ({ ...v, slug: slugify(e.target.value) }));
              }}
              style={{ maxWidth: 220 }}
              aria-label="Hub code"
            />
          </div>
          <div className="cq-mut" style={{ margin: "6px 0 10px" }}>
            The code is part of every link of this hub: {origin()}#/h/
            <b>{f.slug || "code"}</b>
          </div>
          <ThemePicker
            value={f.theme}
            onChange={(theme) => setF((v) => ({ ...v, theme }))}
          />
          <div className="cq-row" style={{ marginTop: 12 }}>
            <input
              type="text"
              value={f.ownerName}
              placeholder="Owner name"
              onChange={set("ownerName")}
            />
            <input
              type="text"
              value={f.ownerEmail}
              placeholder="Owner email (optional now)"
              onChange={set("ownerEmail")}
            />
            <button
              className="primary"
              disabled={busy || !f.name.trim() || !validSlug(f.slug)}
              onClick={create}
            >
              {busy ? "Creating…" : "Create hub"}
            </button>
          </div>
          <div className="cq-mut" style={{ marginTop: 8 }}>
            The owner runs the hub: staff, rates, courts, bookings and sales.
          </div>
          <Created r={res} />
        </div>
      )}

      <div className="cq-card">
        <h2>{isSuper ? `All hubs (${hubs.length})` : `My Hubs (${hubs.length})`}</h2>
        {hubs.length === 0 && (
          <div className="cq-mut">No hubs available.</div>
        )}
        {[...hubs]
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
          .map((h) => {
            const isSuspended = h.active === false;
            return (
              <div
                className="cq-item"
                key={h.id}
                style={isSuspended ? { opacity: 0.7, background: "rgba(239, 68, 68, 0.04)" } : undefined}
              >
                <span>
                  <b>{h.name}</b>{" "}
                  <span className="cq-mut">
                    · {h.id} · {THEMES[h.theme] ? THEMES[h.theme].label : h.theme}
                  </span>{" "}
                  {isSuspended ? (
                  <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#dc2626",
                    fontWeight: "600",
                    fontSize: "0.8rem",
                    marginLeft: "6px",
                  }}
                >
                  <Icon icon={Ban} size={14} />
                  <span>[SUSPENDED]</span>
                </span>
                  ) : ( <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "#16a34a",
                      fontWeight: "600",
                      fontSize: "0.8rem",
                      marginLeft: "6px",
                    }}
                  >
                    <Icon icon={CheckCircle} size={14} />
                    <span>[ACTIVE]</span>
                      
                    </span>
                  )}
                </span>

                <span className="cq-row" style={{ flexWrap: "nowrap", gap: "6px" }}>
                  <Link className="cq-btn" to={`/platform/hubs/${h.id}`}>
                    Manage
                  </Link>
                  <Link className="cq-btn" to={`/h/${h.id}`}>
                    Open
                  </Link>
                  
                  {/* Super Admin Lifecycle Actions */}
                  {isSuper && (
                    <>
                      <button
                        className="cq-btn"
                        onClick={() => handleToggleSuspend(h)}
                        style={{
                          color: isSuspended ? "#16a34a" : "#d97706" ,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >

  <Icon icon={isSuspended ? Play : PlayOff} size={20} />
  <span>{isSuspended ? "Unsuspend" : "Suspend"}</span>
                      </button>
                      <button
                        className="cq-btn"
                        style={{ color: "#dc2626" }}
                        onClick={() => handleDeleteHub(h)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export function HubDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isSuper } = useAuth();
  const hub = useDocument("hubs", id);
  const staff = useCollection("admins", undefined, id);
  const players = useCollection("players", undefined, id);
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState("");
  const [add, setAdd] = useState({ name: "", email: "", role: "owner" });
  const [res, setRes] = useState(null);

  useEffect(() => {
    if (hub && !f)
      setF({
        name: hub.name || "",
        theme: hub.theme || "candy",
        active: hub.active !== false,
      });
  }, [hub]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hub)
    return (
      <div className="cq" role="status">
        Loading… <Link to="/platform">Back to hubs</Link>
      </div>
    );

  const nameOf = (uid) =>
    (players.find((p) => p.uid === uid || p.id === uid) || {}).name || uid;

  const base = `${origin()}#/h/${id}`;
  const links = [
    ["Staff area", base],
    ["Client booking page", `${base}/c`],
    ["TV display", `${base}/tv`],
  ];

  const save = async () => {
    await updateHub(id, {
      name: f.name.trim() || hub.name,
      theme: f.theme,
      active: f.active,
    });
    setMsg("Saved.");
  };

  const handleDeleteCurrentHub = async () => {
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY DELETE "${hub.name}" (${id})? All settings and data for this hub will be deleted.`
      )
    ) {
      await deleteHub(id);
      nav("/platform");
    }
  };

  const addStaff = async () => {
    setRes(null);
    const r = await addHubStaff(id, add);
    setRes(r);
    if (r.ok) setAdd({ name: "", email: "", role: add.role });
  };

  return (
    <div className="cq">
      <div className="cq-head">
        <h1>{hub.name}</h1>
        <Link
          className="cq-btn"
          to="/platform"
          onClick={() => nav("/platform")}
        >
          ← All hubs
        </Link>
      </div>

      <div className="cq-card">
        <h2>Hub settings & Status</h2>
        {f && (
          <>
            <div className="cq-row">
              <input
                type="text"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                aria-label="Hub name"
                disabled={!isSuper}
              />
              <label className="cq-check">
                <input
                  type="checkbox"
                  checked={f.active}
                  onChange={(e) => setF({ ...f, active: e.target.checked })}
                  disabled={!isSuper}
                />{" "}
                Active (Uncheck to suspend client & staff access)
              </label>
            </div>
            <div style={{ marginTop: 10 }}>
              <ThemePicker
                value={f.theme}
                onChange={(theme) => setF({ ...f, theme })}
              />
            </div>
            <div className="cq-row" style={{ marginTop: 12, justifyContent: "space-between" }}>
              <div>
                <button className="primary" onClick={save}>
                  Save Settings
                </button>
                {msg && (
                  <span role="status" className="cq-mut" style={{ marginLeft: "8px" }}>
                    {msg}
                  </span>
                )}
              </div>

              {/* Danger Zone: Permanent Delete */}
              {isSuper && (
                <button
                  type="button"
                  className="small"
                  style={{ color: "#dc2626", border: "1px solid #fecaca", background: "#fef2f2" }}
                  onClick={handleDeleteCurrentHub}
                >
                  Delete Hub
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="cq-card">
        <h2>Links</h2>
        {links.map(([l, u]) => (
          <div className="cq-item" key={l}>
            <span>
              {l}
              <div className="cq-mut" style={{ wordBreak: "break-all" }}>
                {u}
              </div>
            </span>
            <button className="small" onClick={() => copy(u)}>
              Copy
            </button>
          </div>
        ))}
      </div>

      <div className="cq-card">
        <h2>Staff of this hub ({staff.length})</h2>
        {staff.length === 0 && (
          <div className="cq-mut">No staff yet. Add the owner below.</div>
        )}
        {staff.map((a) => (
          <div className="cq-item" key={a.id}>
            <span>{nameOf(a.id)}</span>
            <span className="cq-row" style={{ flexWrap: "nowrap" }}>
              <select
                className="cq-select-readable"
                value={normalizeRole(a.role)}
                onChange={(e) => setHubStaffRole(id, a.id, e.target.value)}
                aria-label={`Role of ${nameOf(a.id)}`}
              >
                {Object.entries(ROLES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <button
                className="small"
                onClick={() =>
                  window.confirm("Remove this person from the hub?") &&
                  removeHubStaff(id, a.id)
                }
              >
                Remove
              </button>
            </span>
          </div>
        ))}
        <div className="cq-row" style={{ marginTop: 12 }}>
          <input
            type="text"
            value={add.name}
            placeholder="Name (for a new account)"
            onChange={(e) => setAdd({ ...add, name: e.target.value })}
          />
          <input
            type="text"
            value={add.email}
            placeholder="Email"
            onChange={(e) => setAdd({ ...add, email: e.target.value })}
          />
          <select
            className="cq-select-readable"
            value={add.role}
            onChange={(e) => setAdd({ ...add, role: e.target.value })}
            aria-label="Role"
          >
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            className="primary"
            disabled={!add.email.trim()}
            onClick={addStaff}
          >
            Add
          </button>
        </div>
        {res && res.ok && (
          <div role="status" className="cq-msg">
            {res.name} added.
          </div>
        )}
      </div>
    </div>
  );
}

export function SuperAdminsPage() {
  const { user, isSuper } = useAuth();
  const admins = useCollection("platformAdmins") || [];
  const users = useCollection("users") || [];
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const nameOf = (u) =>
    `${u.name || u.email}${u.name && u.email ? ` · ${u.email}` : ""}`;

  const grant = async () => {
    const u = await findUserByEmail(email);
    if (!u) {
      setMsg(
        "No account with that email has signed in to this app yet. Ask them to sign in once first."
      );
      return;
    }
    await setSuperAdmin(u.uid, true);
    setMsg(`${u.name || u.email} is now a super admin.`);
    setEmail("");
  };

  return (
    <div className="cq">
      <div className="cq-head">
        <h1>{isSuper ? "Super & Group Admins" : "Group Admins"}</h1>
      </div>

      {/* RESTRICTED: Only Platform Super Admins can see/grant Super Admin privileges */}
      {isSuper && (
        <div className="cq-card">
          <h2>Super Admins ({admins.length})</h2>
          {admins.map((a) => {
            const u = users.find((x) => x.uid === a.id || x.id === a.id) || { uid: a.id };
            return (
              <div className="cq-item" key={a.id}>
                <span>
                  {u.name || u.email || a.id}
                  {user && a.id === user.uid ? " (you)" : ""}
                </span>
                {user && a.id !== user.uid && admins.length > 1 && (
                  <button
                    className="small"
                    onClick={() =>
                      window.confirm("Remove this super admin?") &&
                      setSuperAdmin(a.id, false)
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
          <div className="cq-row" style={{ marginTop: 12 }}>
            <input
              type="text"
              value={email}
              placeholder="Email of an existing account"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="primary" disabled={!email.trim()} onClick={grant}>
              Make super admin
            </button>
          </div>
          {msg && (
            <div role="status" className="cq-msg">
              {msg}
            </div>
          )}
        </div>
      )}

      {/* ACCESSIBLE TO SUPER & GROUP ADMINS: Assign hub scopes to users */}
      <div className="cq-card" style={{ marginTop: 16 }}>
        <h2>Manage User Hub Assignments (Group Admins)</h2>
        <div className="cq-mut" style={{ marginBottom: 12 }}>
          Select a user below to assign specific hubs they are permitted to manage:
        </div>
        <select
          className="cq-select-readable"
          value={selectedUser?.uid || ""}
          onChange={(e) => {
            const u = users.find((x) => (x.uid || x.id) === e.target.value);
            setSelectedUser(u || null);
          }}
        >
          <option value="">-- Choose User to Assign Hubs --</option>
          {users.map((u) => (
            <option key={u.uid || u.id} value={u.uid || u.id}>
              {nameOf(u)}
            </option>
          ))}
        </select>

        {selectedUser && <HubAssignmentManager user={selectedUser} />}
      </div>
    </div>
  );
}