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
  const { user, isAdmin, loading, mode, isSuper } = useAuth();
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
  if (user && !loading) {
    if (!hub.id) return <Navigate to={isSuper ? "/platform" : "/"} replace />;
    return (
      <Navigate
        to={isAdmin ? (loc.state && loc.state.from) || "/" : "/c"}
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

          <button className="auth-submit-btn" type="submit" disabled={busy} style={{ marginTop: "10px" }} >
            {busy ? (
              <span className="auth-spinner" aria-hidden="true" />
            ) : tab === "in" ? (
              "Sign in"
            ) : tab === "up" ? (
              "Create account"
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        {/* Social Authentication 
        {tab !== "reset" && (
          <>
            <div className="auth-divider" >
              <span>or</span>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              disabled={busy}
              onClick={() => run(() => data.auth.signInGoogle())}
            >
              <svg
                className="google-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}
*/}
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
