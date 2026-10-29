import { useState } from "react";
import { useHubHref } from "../hub/links.jsx";
import { useCourtStore } from "../court-queue/CourtQueue.jsx";
import { detectAdType } from "../court-queue/TvAds.jsx";
import VoicePicker from "../components/VoicePicker.jsx";
import { useSpeech } from "../speech/useSpeech.js";

const TYPE_LABEL = { video: "Video", youtube: "YouTube", image: "Image" };

export default function AdsPage() {
  const hh = useHubHref();
  const [s, update] = useCourtStore();
  const set = (patch) => update((x) => ({ ...x, ...patch }));
  const setSpeech = (patch) =>
    update((x) => ({ ...x, speech: { ...x.speech, ...patch } }));
  const { speak, unlock } = useSpeech(s.speech);
  
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [seconds, setSeconds] = useState(15);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const ads = s.ads || [];
  const notes = s.announcements || [];

  const addAd = (customUrl, customTitle, customType) => {
    const u = (customUrl || url).trim();
    if (!u) return;

    const adType = customType || detectAdType(u);

    update((x) => ({
      ...x,
      ads: [
        ...(x.ads || []),
        {
          id: Date.now(),
          type: adType,
          url: u,
          title: (customTitle || title).trim() || "Local File Ad",
          seconds: +seconds || 15,
        },
      ],
    }));

    if (!customUrl) {
      setUrl("");
      setTitle("");
    }
  };

  // Handles direct local video/image file uploads per Hub
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const fileDataUrl = event.target.result;
      const fileType = file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("image/")
        ? "image"
        : detectAdType(file.name);

      addAd(fileDataUrl, file.name, fileType);
      setUploading(false);
      e.target.value = ""; // reset file input
    };

    reader.onerror = () => {
      alert("Failed to read file.");
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const moveAd = (i) =>
    update((x) => {
      const a = [...x.ads];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return { ...x, ads: a };
    });

  const addNote = () => {
    const t = text.trim();
    if (!t) return;
    update((x) => ({
      ...x,
      announcements: [...(x.announcements || []), { id: Date.now(), text: t }],
    }));
    setText("");
  };

  return (
    <div className="cq">
      <div className="cq-head">
        <h1>TV &amp; ads</h1>
        <a className="cq-btn" href={hh("/tv")} target="_blank" rel="noreferrer">
          Open TV display
        </a>
      </div>

      <div className="cq-card">
        <h2>TV layout</h2>
        <div className="cq-row">
          <input
            type="text"
            value={s.club || ""}
            placeholder="Header title (e.g. your club name)"
            onChange={(e) => set({ club: e.target.value })}
          />
        </div>
        <div className="cq-row" style={{ marginTop: 10 }}>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.adsOn !== false}
              onChange={(e) => set({ adsOn: e.target.checked })}
            />{" "}
            Show ads panel (left)
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={!!s.adFill}
              onChange={(e) => set({ adFill: e.target.checked })}
            />{" "}
            Fill panel (crop to fit)
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={!!s.adSound}
              onChange={(e) => set({ adSound: e.target.checked })}
            />{" "}
            Play ad sound
          </label>
          <select
            value={s.adsPct || 30}
            onChange={(e) => set({ adsPct: +e.target.value })}
            aria-label="Ads panel width"
            style={{ width: 200, maxWidth: 500 }}
          >
            <option value={25}>Panel width: 25%</option>
            <option value={30}>Panel width: 30%</option>
            <option value={35}>Panel width: 35%</option>
            <option value={40}>Panel width: 40%</option>
            <option value={45}>Panel width: 45%</option>
            <option value={50}>Panel width: 50%</option>
          </select>

          <select
            value={s.tickerSpeed || 12}
            onChange={(e) => set({ tickerSpeed: +e.target.value })}
            aria-label="Ticker speed"
            style={{ width: 200, maxWidth: 500 }}
          >
            <option value={8}>Ticker: slow</option>
            <option value={12}>Ticker: normal</option>
            <option value={18}>Ticker: fast</option>
          </select>
        </div>
        <div className="cq-mut" style={{ marginTop: 8 }}>
          The TV shows a header, the ads panel on the left, the courts on the
          right, and scrolling announcements at the bottom.
        </div>
      </div>

      <div className="cq-card">
        <h2>Voice &amp; ad volume</h2>
        <VoicePicker
          speech={s.speech}
          onChange={setSpeech}
          speakHere={(t) => {
            unlock();
            speak(t);
          }}
          speakOnTv={(t) =>
            update((x) => ({
              ...x,
              ev: { id: Date.now(), type: "say", text: t },
            }))
          }
        />
      </div>

      <div className="cq-card">
        <h2>Ad playlist ({ads.length})</h2>

        {/* Upload Local Media File */}
        <div className="cq-row" style={{ marginBottom: 15 }}>
          <label className="cq-btn" style={{ cursor: "pointer", display: "inline-block" }}>
            📁 {uploading ? "Processing video..." : "Upload Local Video or Image File"}
            <input
              type="file"
              accept="video/*,image/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          <span className="cq-mut">Uploaded videos/images are stored and displayed for this Hub only.</span>
        </div>

        {/* Or Paste Direct Web Link */}
        <div className="cq-row">
          <input
            type="text"
            value={url}
            placeholder="Or paste video, image, or YouTube URL"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAd()}
          />
          <input
            type="text"
            value={title}
            placeholder="Title (optional)"
            onChange={(e) => setTitle(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <label className="cq-check">
            Seconds{" "}
            <input
              type="number"
              min={3}
              max={600}
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              style={{ width: 70 }}
            />
          </label>
          <button className="primary" onClick={() => addAd()} disabled={!url.trim()}>
            Add URL
          </button>
        </div>

        {ads.length === 0 && (
          <div className="cq-mut" style={{ marginTop: 10 }}>
            No ads yet for this hub. The TV shows the courts full width until you add one.
          </div>
        )}

        {ads.map((a, i) => (
          <div className="cq-item" key={a.id}>
            <span>
              <span className="cq-mut">{i + 1}&nbsp;&nbsp;</span>
              <b>{a.title || (a.url.length > 40 ? `${a.url.slice(0, 40)}...` : a.url)}</b>
              <span className="cq-mut">
                {" "}
                · {TYPE_LABEL[a.type] || "Media"}
                {a.type !== "video" ? ` · ${a.seconds}s` : ""}
              </span>
            </span>
            <span>
              <button
                className="small"
                disabled={!i}
                onClick={() => moveAd(i)}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                className="small"
                onClick={() =>
                  update((x) => ({
                    ...x,
                    ads: x.ads.filter((y) => y.id !== a.id),
                  }))
                }
                aria-label="Remove ad"
              >
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="cq-card">
        <h2>Scrolling announcements ({notes.length})</h2>
        <div className="cq-row">
          <input
            type="text"
            value={text}
            placeholder="e.g. Open play every Saturday 6 PM · Court rental: ask the front desk"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
          />
          <button className="primary" onClick={addNote} disabled={!text.trim()}>
            Add
          </button>
        </div>
        {notes.length === 0 && (
          <div className="cq-mut" style={{ marginTop: 10 }}>
            No announcements. The bottom bar is hidden until you add one.
          </div>
        )}
        {notes.map((n) => (
          <div className="cq-item" key={n.id}>
            <span>{n.text}</span>
            <button
              className="small"
              onClick={() =>
                update((x) => ({
                  ...x,
                  announcements: x.announcements.filter((y) => y.id !== n.id),
                }))
              }
              aria-label="Remove announcement"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}