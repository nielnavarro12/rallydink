/* =====================================================================
   TV page: route it at e.g. /tv
   ===================================================================== */
import { useAuth } from "../data/hooks.js";
import { useCourtStore } from "./useCourtStore.js";
import {
  useClockTick,
  upcomingSessions,
  units,
  activeBooking,
  nextBooking,
  fmtWaitShort,
  VIEW_MS,
  spokenText,
  nextGroups,
} from "./courtQueue.js";
import { hasStats } from "../stats/stats.js";
import { useSpeech } from "../speech/useSpeech.js";
import { useState, useEffect, useRef } from "react";
import PickleballCourt from "./PickleballCourt.jsx";
import ScheduleView from "./ScheduleView.jsx";
import StatsView from "../stats/StatsView.jsx";
import GameTimer from "./GameTimer.jsx";
import Announcement from "./Announcement.jsx";
import { AdPanel, Ticker } from "./TvAds.jsx";
export function TvPage() {
  const [s, , sync] = useCourtStore({ readOnly: true });
  const { hub } = useAuth(); // Access current hub document
  useClockTick();
  const { speak, unlock, isSpeaking } = useSpeech(s.speech);
  const [started, setStarted] = useState(false);
  const [ev, setEv] = useState(null);
  const [view, setView] = useState("courts");
  const upcoming = upcomingSessions(s.schedule || []);
  const showSchedule = s.rotate && upcoming.length > 0;
  const showStats = s.showStats !== false && hasStats(s.stats);
  const order = [
    "courts",
    ...(showSchedule ? ["schedule"] : []),
    ...(showStats ? ["stats"] : []),
  ];
  const orderKey = order.join();
  const shown = order.includes(view) ? view : "courts";

  useEffect(() => {
    if (order.length < 2) {
      setView("courts");
      return undefined;
    }
    const t = setTimeout(
      () => setView((v) => order[(order.indexOf(v) + 1) % order.length]),
      VIEW_MS[shown] ?? 12000
    );
    return () => clearTimeout(t);
  }, [shown, orderKey]);

  const startedRef = useRef(false);
  const lastId = useRef(s.ev?.id);
  const seeded = useRef(false);

  useEffect(() => {
    if (sync.status === "connecting") return;
    if (!seeded.current) {
      seeded.current = true;
      lastId.current = s.ev?.id;
      return;
    }
    const e = s.ev;
    if (!e || e.id === lastId.current) return;
    lastId.current = e.id;
    if (e.type === "say") {
      if (startedRef.current) speak(e.text);
      return;
    }
    setEv(e);
    setTimeout(
      () => setEv((cur) => (cur?.id === e.id ? null : cur)),
      e.type === "call" ? 9000 : 8000
    );
    if (s.voice && startedRef.current) speak(spokenText(e));
  }, [s.ev?.id, sync.status]);

  const start = () => {
    startedRef.current = true;
    setStarted(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
    unlock();
  };
  const showCourt = s.courtsOn !== false;
  const showAds = s.adsOn !== false && (s.ads || []).length > 0;
  const adsPct = s.adsPct || 30;
  const hasTicker = (s.announcements || []).length > 0;
  const ups = units(s);
  const mainW = 100 - 4 - (showAds ? adsPct + 2 : 0);
  const n = s.courts.length;
  const rows = n > (showAds ? 4 : 5) ? 2 : 1;
  const perRow = Math.ceil(n / rows);
  const maxH = (rows === 2 ? 24 : 50) + (hasTicker ? 0 : 6);
  const courtH = `min(${maxH}vh, calc((${mainW}vw - ${perRow * 3.4}vh - ${
    (perRow - 1) * 2
  }vw) / ${perRow} * 2.2))`;
  const clock = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  // Resolve active hub logo or fallback
  const logo = hub?.logoUrl || s.clubLogo;
  const freeCourts = s.courts.filter((c) => !c.m && !activeBooking(s, c.n));
  const groups = s.mode === "rand" ? [] : nextGroups(s, 2);
  return (
    <div className="tv">
      {!started && (
        <button className="tv-start" onClick={start}>
          ▶ Tap to start TV display
        </button>
      )}
      <header className="tv-head">
        <b
          style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
        >
          {logo ? (
            <img src={logo} alt="Hub Logo" className="logo" />
          ) : (
            <span>🏸</span>
          )}
          {(s.club || hub?.name || s.sport).toUpperCase()}
        </b>
        {showCourt ? (
          <span>
            {s.club ? `${s.sport} · ` : ""}
            {clock} · {s.q.length} {s.q.length === 1 ? "player" : "players"}{" "}
            waiting
            {sync.status === "error" ? " · ⚠ sync lost" : ""}
          </span>
        ) : (
          <span>{clock}</span>
        )}
      </header>
      <div className="tv-body">
        {showAds && (
          <aside className="tv-ads" style={{ width: `${adsPct}vw` }}>
            <AdPanel
              ads={s.ads}
              sound={!!s.adSound && started}
              fill={!!s.adFill}
              volume={
                isSpeaking && s.speech?.duck !== false
                  ? s.speech?.duckLevel ?? 0.15
                  : 1
              }
            />
          </aside>
        )}
        {showCourt && (
          <main className="tv-main">
            {shown === "schedule" ? (
              <ScheduleView sessions={upcoming} />
            ) : shown === "stats" ? (
              <StatsView stats={s.stats} pairs={s.pairs} />
            ) : (
              <>
                <div className="tv-grid" style={{ "--ch": courtH }}>
                  {s.courts.map((c) => (
                    <PickleballCourt
                      key={c.n}
                      court={c}
                      rental={activeBooking(s, c.n)}
                      next={nextBooking(s, c.n)}
                      limit={s.gameMinutes || 0}
                    />
                  ))}
                </div>
                <div className="tv-next">
                  <b>Up next:</b>{" "}
                  {s.mode === "rand" ? (
                    <span>Random draw of 4 players</span>
                  ) : groups.length ? (
                    groups.map((g, i) => (
                      <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                        padding: "1rem 1.5rem",
                        margin: "0.75rem 0",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "14px",
                        fontSize: "clamp(1.5rem, 2.2vw, 2.75rem)",
                        lineHeight: "1.2",
                        color: "#ffffff",
                        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      <span
                        style={{
                          background: freeCourts[i] ? "#4f46e5" : "#3b82f6",
                          color: "#ffffff",
                          padding: "0.4rem 1rem",
                          borderRadius: "8px",
                          fontWeight: "800",
                          letterSpacing: "0.02em",
                          whiteSpace: "nowrap",
                          textTransform: "uppercase",
                          fontSize: "clamp(1.4rem, 2vw, 2.4rem)",
                        }}
                      >
                        {freeCourts[i]
                          ? `Court ${freeCourts[i].n}`
                          : i === freeCourts.length
                          ? "Next Available Court"
                          : "After That"}
                      </span>
                    
                      <span style={{ fontWeight: "700", color: "#f8fafc", wordBreak: "break-word" }}>
                        {g.join(" · ")}
                      </span>
                    </div>
                    ))
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </>
            )}
          </main>
        )}
      </div>
      {hasTicker && (
        <Ticker items={s.announcements} speed={s.tickerSpeed || 12} />
      )}
      {ev && <Announcement ev={ev} sport={s.sport} />}
    </div>
  );
}
export default TvPage;
