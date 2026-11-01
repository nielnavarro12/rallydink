/* =====================================================================
   TV page: route it at e.g. /tv
   ===================================================================== */
 function TvPage() {
  const [s, , sync] = useCourtStore({ readOnly: true });
  const { hub } = useAuth(); // Access current hub document
  useClockTick();
  const { speak, unlock, isSpeaking } = useSpeech(s.speech);
  const [started, setStarted] = useState(false);
  const [ev, setEv] = useState(null);
  const [view, setView] = useState('courts');
  const upcoming = upcomingSessions(s.schedule || []);
  const showSchedule = s.rotate && upcoming.length > 0;
  const showStats = s.showStats !== false && hasStats(s.stats);
  const order = ['courts', ...(showSchedule ? ['schedule'] : []), ...(showStats ? ['stats'] : [])];
  const orderKey = order.join();
  const shown = order.includes(view) ? view : 'courts';

  useEffect(() => {
    if (order.length < 2) {
      setView('courts');
      return undefined;
    }
    const t = setTimeout(() => setView((v) => order[(order.indexOf(v) + 1) % order.length]), VIEW_MS[shown] ?? 12000);
    return () => clearTimeout(t);
  }, [shown, orderKey]);

  const startedRef = useRef(false);
  const lastId = useRef(s.ev?.id);
  const seeded = useRef(false);

  useEffect(() => {
    if (sync.status === 'connecting') return;
    if (!seeded.current) {
      seeded.current = true;
      lastId.current = s.ev?.id;
      return;
    }
    const e = s.ev;
    if (!e || e.id === lastId.current) return;
    lastId.current = e.id;
    if (e.type === 'say') {
      if (startedRef.current) speak(e.text);
      return;
    }
    setEv(e);
    setTimeout(() => setEv((cur) => (cur?.id === e.id ? null : cur)), e.type === 'call' ? 9000 : 8000);
    if (s.voice && startedRef.current) speak(spokenText(e));
  }, [s.ev?.id, sync.status]);

  const start = () => {
    startedRef.current = true;
    setStarted(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
    unlock();
  };

  const showAds = s.adsOn !== false && (s.ads || []).length > 0;
  const adsPct = s.adsPct || 30;
  const hasTicker = (s.announcements || []).length > 0;
  const ups = units(s);
  const mainW = 100 - 4 - (showAds ? adsPct + 2 : 0);
  const n = s.courts.length;
  const rows = n > (showAds ? 4 : 5) ? 2 : 1;
  const perRow = Math.ceil(n / rows);
  const maxH = (rows === 2 ? 24 : 50) + (hasTicker ? 0 : 6);
  const courtH = `min(${maxH}vh, calc((${mainW}vw - ${perRow * 3.4}vh - ${(perRow - 1) * 2}vw) / ${perRow} * 2.2))`;
  const clock = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Resolve active hub logo or fallback
  const logo = hub?.logoUrl || s.clubLogo;

  return (
    <div className="tv">
      {!started && <button className="tv-start" onClick={start}>▶ Tap to start TV display</button>}
      <header className="tv-head">
        <b style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          {logo ? (
            <img
              src={logo}
              alt="Hub Logo"
             className="logo"
              
            />
          ) : (
            <span>🏸</span>
          )}
          {(s.club || hub?.name || s.sport).toUpperCase()}
        </b>
        <span>
          {s.club ? `${s.sport} · ` : ''}
          {clock} · {s.q.length} {s.q.length === 1 ? 'player' : 'players'} waiting
          {sync.status === 'error' ? ' · ⚠ sync lost' : ''}
        </span>
      </header>
      <div className="tv-body">
        {showAds && (
          <aside className="tv-ads" style={{ width: `${adsPct}vw` }}>
            <AdPanel
              ads={s.ads}
              sound={!!s.adSound && started}
              fill={!!s.adFill}
              volume={isSpeaking && s.speech?.duck !== false ? (s.speech?.duckLevel ?? 0.15) : 1}
            />
          </aside>
        )}
        <main className="tv-main">
          {shown === 'schedule' ? (
            <ScheduleView sessions={upcoming} />
          ) : shown === 'stats' ? (
            <StatsView stats={s.stats} pairs={s.pairs} />
          ) : (
            <>
              <div className="tv-grid" style={{ '--ch': courtH }}>
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
                <b>Up next:</b>{' '}
                {ups.length
                  ? ups.slice(0, 12).map((u, i) => {
                      const w = fmtWaitShort(Math.min(...u.idx.map((k) => s.q[k].at ?? Infinity)));
                      return (
                        <span key={i}>
                          {i + 1}. {u.idx.map((k) => s.q[k].n).join(' & ')}
                          {w ? ` · ${w}` : ''}
                        </span>
                      );
                    })
                  : '—'}
                {ups.length > 12 && <span>+{ups.length - 12} more</span>}
              </div>
            </>
          )}
        </main>
      </div>
      {hasTicker && <Ticker items={s.announcements} speed={s.tickerSpeed || 12} />}
      {ev && <Announcement ev={ev} sport={s.sport} />}
    </div>
  );
}
export default TvPage;