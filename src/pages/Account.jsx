import { useState } from "react";
import { data } from "../data/index.js";
import { Link } from "../hub/links.jsx";
import { useAuth } from "../data/hooks.js";
import { ROLES } from "../auth/roles.js";
import { resizeCourts, useCourtStore } from "../court-queue/CourtQueue.jsx";
import { DEFAULT_SETTINGS, useSettings } from "../money/pricing.js";
import { uploadHubMedia } from "../data/storage.js"; // Adjust this import path to where your uploadHubMedia file lives

const COURT_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

export default function AccountPage() {
  const { user, role, mode, can, hub } = useAuth();
  const [s, update] = useCourtStore();
  const [logoUrl, setLogoUrl] = useState(hub?.logoUrl || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [bannerUrl, setBannerUrl] = useState(hub?.bannerUrl || "");
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const [uploadBannerProgress, setUploadBannerProgress] = useState(0);
  // courts
  const [cmsg, setCmsg] = useState("");
  const setCourts = (n) => {
    const removed = s.courts.slice(n).filter((c) => c.m);
    if (
      removed.length &&
      !window.confirm(
        `Court ${removed.map((c) => c.n).join(", ")} has a match in progress. Its players go back to the queue. Continue?`,
      )
    )
      return;
    update((x) => resizeCourts(x, n));
    setCmsg(`The club now has ${n} court${n > 1 ? "s" : ""}.`);
  };

  // rates
  const rates = useSettings();
  const [r, setR] = useState(null);
  const form = r || rates;
  const setRate = (k) => (e) => setR({ ...form, [k]: e.target.value });
  const [rmsg, setRmsg] = useState("");
  const saveRates = async () => {
    await data.setDoc("settings", "pricing", {
      currency: (form.currency || DEFAULT_SETTINGS.currency).trim(),
      rentalRate: +form.rentalRate || 0,
      peakRate: +form.peakRate || 0,
      peakStart: form.peakStart || "17:00",
      openPlayFee: +form.openPlayFee || 0,
    });
    setRmsg("Rates saved.");
    setR(null);
  };

  // Save Logo URL to Firestore
  const handleSaveLogo = async () => {
    if (!hub?.id) return;
    setSaving(true);
    setMsg("");
    try {
      await data.setDoc(
        "hubs",
        hub.id,
        { logoUrl: logoUrl.trim() },
        { merge: true },
      );
      setMsg("Hub logo updated successfully!");
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      console.error("Error saving logo:", err);
      setMsg("Failed to update hub logo.");
    } finally {
      setSaving(false);
    }
  };
  // Upload Logo File using your helper function
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !hub?.id) return;

    setSaving(true);
    setUploadProgress(0);
    setMsg("Uploading image...");

    try {
      const downloadUrl = await uploadHubMedia(file, hub.id, (pct) => {
        setUploadProgress(pct);
        setMsg(`Uploading image... ${pct}%`);
      });

      setLogoUrl(downloadUrl);
      setMsg('Image uploaded! Click "Save Hub Branding" to apply.');
    } catch (err) {
      console.error("Storage upload error:", err);
      setMsg("Failed to upload image file.");
    } finally {
      setSaving(false);
    }
  };
  // Upload Banner File using your helper function
  const handleSaveBanner = async () => {
    if (!hub?.id) return;
    setBannerSaving(true);
    setBannerMsg("");
    try {
      await data.setDoc(
        "hubs",
        hub.id,
        { bannerUrl: bannerUrl.trim() },
        { merge: true },
      );
      setBannerMsg("Hub banner updated successfully!");
      setTimeout(() => setBannerMsg(""), 4000);
    } catch (err) {
      console.error("Error saving banner:", err);
      setBannerMsg("Failed to update hub banner.");
    } finally {
      setBannerSaving(false);
    }
  };
  // Upload Banner File using your helper function
  const handleBannerFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !hub?.id) return;

    setBannerSaving(true);
    setUploadBannerProgress(0);
    setBannerMsg("Uploading image...");

    try {
      const downloadUrl = await uploadHubMedia(file, hub.id, (pct) => {
        setUploadBannerProgress(pct);
        setBannerMsg(`Uploading image... ${pct}%`);
      });

      setBannerUrl(downloadUrl);
      setBannerMsg('Image uploaded! Click "Save Hub Branding" to apply.');
    } catch (err) {
      console.error("Storage upload error:", err);
      setBannerMsg("Failed to upload image file.");
    } finally {
      setBannerSaving(false);
    }
  };

  return (
    <div className="cq">
      <div className="cq-head">
        <h1>Settings</h1>
      </div>

      {mode === "firebase" && user && (
        <div className="cq-card">
          <h2>Your account</h2>
          <div>
            {user.name || user.email} ·{" "}
            {ROLES[role] ? ROLES[role].label : "no role"}
          </div>
          <div className="cq-mut" style={{ marginTop: 6 }}>
            {ROLES[role]
              ? ROLES[role].desc
              : "Ask an owner to give you a role."}
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={() => data.auth.signOut()}>Sign out</button>
          </div>
        </div>
      )}

      {can("settings") && (
        <div className="cq-card">
          <h2>Courts</h2>
          <div className="cq-row">
            <label className="cq-check">
              Number of courts
              <select
                value={s.courts.length}
                onChange={(e) => setCourts(+e.target.value)}
                aria-label="Number of courts"
              >
                {COURT_COUNTS.concat(
                  COURT_COUNTS.includes(s.courts.length)
                    ? []
                    : [s.courts.length],
                )
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </label>
            {cmsg && (
              <span role="status" className="cq-mut">
                {cmsg}
              </span>
            )}
          </div>
          <div className="cq-mut" style={{ marginTop: 8 }}>
            This is how many courts the TV shows and the queue uses. Clients can
            book any of them. Lowering the number returns the players of a match
            in progress on a removed court to the queue.
          </div>
        </div>
      )}

      {can("settings") && (
        <div className="cq-card">
          <h2>Rates</h2>
          <div className="cq-row">
            <label className="cq-check">
              Currency{" "}
              <input
                type="text"
                value={form.currency}
                onChange={setRate("currency")}
                style={{ width: 40 }}
              />
            </label>
            <label className="cq-check">
              Court per hour{" "}
              <input
                type="number"
                min={0}
                value={form.rentalRate}
                onChange={setRate("rentalRate")}
                style={{ width: 70 }}
              />
            </label>
            <label className="cq-check">
              Peak per hour{" "}
              <input
                type="number"
                min={0}
                value={form.peakRate}
                onChange={setRate("peakRate")}
                style={{ width: 70 }}
              />
            </label>
            <label className="cq-check">
              Peak starts{" "}
              <input
                type="time"
                value={form.peakStart}
                onChange={setRate("peakStart")}
              />
            </label>
            <label className="cq-check">
              Open play fee{" "}
              <input
                type="number"
                min={0}
                value={form.openPlayFee}
                onChange={setRate("openPlayFee")}
                style={{ width: 70 }}
              />
            </label>
          </div>
          <div className="cq-row" style={{ marginTop: 10 }}>
            <button className="primary" onClick={saveRates}>
              Save rates
            </button>
            {rmsg && (
              <span role="status" className="cq-mut">
                {rmsg}
              </span>
            )}
          </div>
          <div className="cq-mut" style={{ marginTop: 8 }}>
            A rental costs the hourly rate for the time booked; from the peak
            start time the peak rate applies (0 = no peak rate). Clients see
            these prices when they book. An open play session can have its own
            fee.
          </div>
        </div>
      )}

      {/* <div className="cq-card">
        <h2>Database</h2>
        {mode === "firebase" ? (
          <div>
            Connected to <b>Firebase</b>: data is saved in Firestore and shared
            by every device. Login is required.
          </div>
        ) : (
          <div className="cq-mut">
            <b style={{ color: "var(--tx)" }}>Local mode:</b> Firebase is not
            set up, so data is saved only in this browser and there is no login
            or staff roles. To save to a real database with login and the client
            booking page, paste your Firebase config into
            <code> src/sync/firebaseConfig.js</code> (see the README).
          </div>
        )}
      </div> */}

      {can("staff") && (
        <div className="cq-card">
    
          <h2>Custom Hub Branding</h2>
          <div
            className="cq-row"
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label style={{ width: "100%" }}>
              <b>Logo Image URL:</b>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                style={{ width: "100%", marginTop: "4px" }}
              />
            </label>

            <label>
              <b>Or Upload Logo File:</b>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={saving}
                style={{ marginTop: "4px" }}
              />
            </label>

            {logoUrl && (
              <div style={{ marginTop: "8px" }}>
                <span className="cq-mut">Logo Preview:</span>
                <div style={{ marginTop: "4px" }}>
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    style={{
                      height: "40px",
                      objectFit: "contain",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            )}

            <button
              className="primary"
              onClick={handleSaveLogo}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Logo"}
            </button>
            {msg && <div className="cq-mut">{msg}</div>}
          </div>
          <div
            className="cq-row"
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label style={{ width: "100%" }}>
              <b>Banner Image URL:</b>
              <input
                type="text"
                placeholder="https://example.com/banner.png"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                style={{ width: "100%", marginTop: "4px" }}
              />
            </label>

            <label>
              <b> Upload Banner File:</b>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerFileUpload}
                disabled={bannerSaving}
                style={{ marginTop: "4px" }}
              />
            </label>

            {bannerUrl && (
              <div style={{ marginTop: "8px" }}>
                <span className="cq-mut">Banner Preview:</span>
                <div style={{ marginTop: "4px" }}>
                  <img
                    src={bannerUrl}
                    alt="Banner Preview"
                    style={{
                      height: "40px",
                      objectFit: "contain",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            )}

            <button
              className="primary"
              onClick={handleSaveBanner}
              disabled={bannerSaving}
            >
              {bannerSaving ? "Saving..." : "Save Banner"}
            </button>
            {bannerMsg && <div className="cq-mut">{bannerMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
