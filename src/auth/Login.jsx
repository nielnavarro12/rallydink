import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Navigate } from "../hub/links.jsx";
import { useHub } from "../hub/HubProvider.jsx";
import { data } from "../data/index.js";
import { useAuth } from "../data/hooks.js";

const banner = "./images/banner.jpeg";

const MESSAGES = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "No account with that email.",
  "auth/email-already-in-use":
    "An account with that email already exists. Sign in instead.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/invalid-email": "That email address does not look right.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/popup-closed-by-user": "The Google window was closed.",
  "auth/unauthorized-domain":
    "This site is not on the Firebase authorized domains list (see the README).",
};

const explain = (e) =>
  MESSAGES[e && e.code] ||
  (e && e.message) ||
  "Something went wrong. Try again.";

export default function LoginPage() {
  const { user, isAdmin, isGroupAdmin, assignedHubs, loading, mode, isSuper } = useAuth();
  const hub = useHub();
  const loc = useLocation();

  const [tab, setTab] = useState("in");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  useEffect(() => {
    setMsg(null);
  }, [tab]);

  if (mode === "local") return <Navigate to="/" replace />;

  // Redirect handling once authentication resolves
  if (user && !loading) {
    const hasGroupAccess = isSuper || isGroupAdmin || (Array.isArray(assignedHubs) && assignedHubs.length > 0);

    // 1. Root-level Login (/login or /)
    if (!hub.id) {
      if (hasGroupAccess) return <Navigate to="/platform" replace />;
      return <Navigate to="/" replace />;
    }

    // 2. Hub-level Login (/h/:hubId/login)
    const canAccessHubAdmin = isAdmin || hasGroupAccess;
    return (
      <Navigate
        to={canAccessHubAdmin ? (loc.state && loc.state.from) || `/h/${hub.id}` : `/h/${hub.id}/c`}
        replace
      />
    );
  }

  const run = async (fn) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ bad: true, t: explain(e) });
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (tab === "in") {
      run(() => data.auth.signIn(f.email.trim(), f.password));
    } else if (tab === "up") {
      run(() => data.auth.signUp(f.email.trim(), f.password, f.name.trim()));
    } else {
      run(async () => {
        await data.auth.resetPassword(f.email.trim());
        setMsg({
          bad: false,
          t: "If that email has an account, a reset link is on its way.",
        });
      });
    }
  };

  return (
    <div className="cq auth-wrapper">
      <div className="auth-card">
        {/* Header Section */}
        <div className="auth-header">
          <div className="auth-brand">
            {hub?.doc?.bannerUrl ? (
              <img
                src={hub.doc.bannerUrl}
                alt="Banner"
                className="banner auth-field"
              />
            ) : (
              <img src={banner} alt="Banner" className="banner" />
            )}
            <h1 className="auth-title">{hub?.doc?.name || "Drive n Dink"}</h1>
          </div>
          <p className="auth-subtitle">
            {tab === "in" &&
              "Sign in to manage courts, book slots, and join open play."}
            {tab === "up" && "Create your account to start playing."}
            {tab === "reset" &&
              "Enter your email to receive a password reset link."}
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div
          className="auth-tabs"
          role="tablist"
          style={{ display: "flex", gap: "8px" }}
        >
          {[
            ["in", "Sign in"],
            ["up", "Create account"],
            ["reset", "Forgot password"],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`auth-tab-btn ${tab === k ? "active" : ""}`}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <form onSubmit={submit} className="auth-form">
          {tab === "up" && (
            <div className="auth-field" style={{ marginTop: "15px" }}>
              <input
                id="auth-name"
                type="text"
                value={f.name}
                onChange={set("name")}
                placeholder="Name"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="auth-field" style={{ marginTop: "10px" }}>
            <input
              id="auth-email"
              type="email"
              value={f.email}
              onChange={set("email")}
              placeholder="Email address (name@example.com)"
              autoComplete="email"
              required
            />
          </div>

          {tab !== "reset" && (
            <div className="auth-field" style={{ marginTop: "10px" }}>
              <input
                id="auth-password"
                type="password"
                value={f.password}
                onChange={set("password")}
                placeholder="Password"
                autoComplete={
                  tab === "up" ? "new-password" : "current-password"
                }
                required
                minLength={6}
              />
            </div>
          )}

          <button
            className="auth-submit-btn"
            type="submit"
            disabled={busy}
            style={{ marginTop: "10px" }}
          >
            {busy ? (
              <span className="auth-btn-loading">
                <svg
                  className="auth-spinner"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.25"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>
                  {tab === "in"
                    ? "Signing in…"
                    : tab === "up"
                      ? "Creating account…"
                      : "Sending reset link…"}
                </span>
              </span>
            ) : tab === "in" ? (
              "Sign in"
            ) : tab === "up" ? (
              "Create account"
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        {/* Feedback Messages */}
        {msg && (
          <div
            role="alert"
            className={`auth-alert ${msg.bad ? "error" : "success"}`}
          >
            {msg.t}
          </div>
        )}
      </div>
    </div>
  );
}