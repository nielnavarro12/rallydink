/* =====================================================================
   Control page: route it at e.g. /queue
   ===================================================================== */



 function ControlPage() {
  const hh = useHubHref();
  const [s, update] = useCourtStore();
  useClockTick();
  const [text, setText] = useState("");
  const [asPair, setAsPair] = useState(false); // the two names typed are partners for today
  const [pa, setPa] = useState("");
  const [pb, setPb] = useState("");
  const [pmode, setPmode] = useState("session"); // how long a new pair lasts
  const roster = useCollection("players"); // saved players (staff only), used for levels and suggestions
  const set = (patch) => update((x) => ({ ...x, ...patch }));

  const addPlayers = (picked) => {
    const names = (typeof picked === "string" ? picked : text)
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!names.length) return;
    const mk = (n) => {
      const p = roster.find(
        (r) => (r.name || "").trim().toLowerCase() === n.toLowerCase(),
      );
      return p
        ? {
            n: p.name,
            lvl: levelNum(playerLevel(p)),
            lv: playerLevel(p),
            at: Date.now(),
          }
        : { n, at: Date.now() };
    };
    update((x) => {
      const next = { ...x, q: [...x.q, ...names.map(mk)] };
      return asPair && typeof picked !== "string" && names.length === 2
        ? pairUp(next, names[0], names[1])
        : next;
    });
    if (typeof picked !== "string") setText("");
  };

  const finish = (ci, winner) => {
    update((x) => finishMatch(x, ci, winner));
    setTimeout(() => {
      update((x) =>
        x.auto && !x.courts[ci]?.m && x.q.length >= 4 ? callMatch(x, ci) : x,
      );
    }, AUTO_CALL_DELAY);
  };

  const move = (i) =>
    update((x) => {
      const q = [...x.q];
      [q[i - 1], q[i]] = [q[i], q[i - 1]];
      return { ...x, q };
    });

  const nextUp = pick(s);
  // everyone who could be paired: waiting, playing, or saved
  const known = Array.from(
    new Map(
      [
        ...s.q.map((p) => p.n),
        ...s.courts.flatMap((c) => (c.m ? [...c.m.p1, ...c.m.p2] : [])),
        ...roster.map((r) => r.name),
      ]
        .filter(Boolean)
        .map((n) => [norm(n), n]),
    ).values(),
  ).sort((a, b) => a.localeCompare(b));
  const preview = !nextUp
    ? "Need 4 players waiting"
    : s.mode === "rand"
      ? "Random draw of 4 players"
      : `Next: ${nextUp
          .flatMap((u) => u.idx)
          .map((i) => s.q[i].n)
          .join(", ")}`;

  return (
    <div className="cq">
      <div className="cq-head">
        <h1>Queue &amp; courts</h1>
       
      </div>
      
      <div className="cq-card">
        <h2>Add players</h2>
        <div className="cq-row">
          <input
            type="text"
            value={text}
            placeholder="Names, comma separated: Anna, Ben, Cara"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlayers()}
          />
          <button className="primary" onClick={addPlayers}>
            Add
          </button>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={asPair}
              onChange={(e) => setAsPair(e.target.checked)}
            />{" "}
            The 2 names are partners for the session
          </label>
          {roster.length > 0 && (
            <select
              value=""
              aria-label="Add a saved player"
              onChange={(e) => e.target.value && addPlayers(e.target.value)}
            >
              <option value="">+ Saved player…</option>
              {roster
                .filter(
                  (r) =>
                    !s.q.some(
                      (x) =>
                        (x.n || "").toLowerCase() ===
                        (r.name || "").toLowerCase(),
                    ),
                )
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                    {playerLevel(r) ? ` · ${playerLevel(r)}` : ""}
                  </option>
                ))}
            </select>
          )}
         
        </div>
        <div className="cq-row" style={{ marginTop: 10 }}>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.voice}
              onChange={(e) => set({ voice: e.target.checked })}
            />{" "}
            Voice on TV
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.auto}
              onChange={(e) => set({ auto: e.target.checked })}
            />{" "}
            Auto-call next match
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.rejoin}
              onChange={(e) => set({ rejoin: e.target.checked })}
            />{" "}
            Players rejoin after a match
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.rotate}
              onChange={(e) => set({ rotate: e.target.checked })}
            />{" "}
            Show schedule on TV
          </label>
          <label className="cq-check">
            <input
              type="checkbox"
              checked={s.showStats !== false}
              onChange={(e) => set({ showStats: e.target.checked })}
            />{" "}
            Show player stats on TV
          </label>
         
        </div>
      </div>

      <div className="cq-card">
        <h2>Partners</h2>
        <div className="cq-row">
          <select
            value={pa}
            onChange={(e) => setPa(e.target.value)}
            aria-label="First partner"
            style={{ width: 250, maxWidth: 500 }}
          >
            <option value="">Player…</option>
            {known.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <span className="cq-mut">with</span>
          <select
            value={pb}
            onChange={(e) => setPb(e.target.value)}
            aria-label="Second partner"
            
            style={{ width: 250, maxWidth: 500 }}
          >
            <option value="">Partner…</option>
            {known
              .filter((n) => n !== pa)
              .map((n) => (
                <option key={n}>{n}</option>
              ))}
          </select>
          <select
            value={pmode}
            onChange={(e) => setPmode(e.target.value)}
            aria-label="How long"
                  style={{ width: 250, maxWidth: 500 }}
          >
            <option value="session">Rest of the queue session</option>
            <option value="once">Next match only</option>
          </select>
          <button
            className="primary"
            disabled={!pa || !pb || pa === pb}
            onClick={() => {
              update((x) => pairUp(x, pa, pb, pmode));
              setPa("");
              setPb("");
            }}
          >
            Pair up
          </button>
        </div>
        {activePairs(s).length === 0 && (
          <div className="cq-mut" style={{ marginTop: 10 }}>
            No fixed partners. Everyone gets a random partner each match.
          </div>
        )}
        {activePairs(s).map(([a, b, mode]) => (
          <div className="cq-item" key={`${a}|${b}`}>
            <span>
              🤝 <b>{a}</b> &amp; <b>{b}</b>{" "}
              <span className="cq-mut">
                · {mode === "once" ? "next match only" : "rest of the session"}
              </span>
            </span>
            <button
              className="small"
              onClick={() => update((x) => unpair(x, a))}
            >
              Unpair
            </button>
          </div>
        ))}
        <div className="cq-row" style={{ marginTop: 10 }}>
          {activePairs(s).length > 0 && (
            <button
              className="small"
              onClick={() =>
                window.confirm(
                  "End the queue session? All fixed partners are cleared.",
                ) && update(endSession)
              }
            >
              End session (clear partners)
            </button>
          )}
        </div>
        <div className="cq-mut" style={{ marginTop: 8 }}>
          <b>Rest of the queue session</b>: the pair plays on the same team for
          every match and waits in the queue together, until you unpair them,
          end the session, or the day ends.
          <b> Next match only</b>: they are partners for their next match, then
          go back to random partners.
        </div>
      </div>

      <div className="cq-card">
        <h2>Courts</h2>
        <div className="cq-mut" style={{ marginBottom: 10 }}>
          Used for the queue:{" "}
          {s.courts
            .filter((c) => !activeBooking(s, c.n))
            .map((c) => `Court ${c.n}`)
            .join(", ") || "none"}
          {s.courts.some((c) => activeBooking(s, c.n)) &&
            ` · Rented now: ${s.courts
              .filter((c) => activeBooking(s, c.n))
              .map((c) => `Court ${c.n}`)
              .join(", ")}`}
          {" · "}Set up rentals on the Rentals page.
        </div>
        <div className="cq-courts">
          {s.courts.map((c, i) => {
            const rb = activeBooking(s, c.n);
            const nb = nextBooking(s, c.n);
            return (
              <div className="cq-court" key={c.n}>
                <div style={{ marginBottom: 8 }}>
                  <b>
                    Court {c.n} · {c.m ? "Playing" : rb ? "Rented" : "Free"}
                  </b>
                </div>
                {c.m ? (
                  <>
                    <div>{c.m.p1.join(" & ")}</div>
                    <div className="cq-mut">vs</div>
                    <div>{c.m.p2.join(" & ")}</div>
                    {c.m.startedAt && (
                      <div style={{ marginTop: 6 }}>
                        <GameTimer
                          since={c.m.startedAt}
                          limit={s.gameMinutes || 0}
                        />
                      </div>
                    )}
                    <div className="cq-row" style={{ marginTop: 10 }}>
                      <button onClick={() => finish(i, 1)}>
                        🏆 {c.m.p1.join(" & ")}
                      </button>
                      <button onClick={() => finish(i, 2)}>
                        🏆 {c.m.p2.join(" & ")}
                      </button>
                      <button
                        className="small"
                        onClick={() => update((x) => cancelMatch(x, i))}
                      >
                        Cancel match
                      </button>
                    </div>
                  </>
                ) : rb ? (
                  <div className="cq-mut">
                    Rented {fmtTime(rb.start)} – {fmtTime(rb.end)}
                    {rb.name ? ` · ${rb.name}` : ""}. Not used for the queue.
                  </div>
                ) : (
                  <>
                    <div className="cq-mut">{preview}</div>
                    <div style={{ marginTop: 10 }}>
                      <button
                        className="primary"
                        disabled={!nextUp}
                        onClick={() => update((x) => callMatch(x, i))}
                      >
                        Call match
                      </button>
                    </div>
                  </>
                )}
                {nb && (
                  <div className="cq-mut" style={{ marginTop: 8 }}>
                    Next rental today: {fmtTime(nb.start)} – {fmtTime(nb.end)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
          <div className="cq-row" style={{ marginTop: 20, marginBottom: 10   }}>
             
    <div className="cq-row" style={{ marginTop: 10, flexWrap: "wrap", gap: 20 }}>
       <label className="cq-check">
            Game time (min, 0 = no limit){" "}
            <input
              type="number"
              min={0}
              max={90}
              value={s.gameMinutes || 0}
              onChange={(e) =>
                set({ gameMinutes: Math.max(0, +e.target.value || 0) })
              }
              style={{ width: 70 }}
            />
          </label>
          <select
            value={s.mode}
            onChange={(e) => set({ mode: e.target.value })}
            style={{ width: "auto", maxWidth: 400 }}
            aria-label="How to pick the next match"
          >
            <option value="fifo">Next 4 in line</option>
            <option value="rand">Random 4</option>
            <option value="level">Similar levels</option>
            <option value="wl">Winners with winners, losers with losers</option>
          </select>
           <button onClick={() => update((x) => ({ ...x, q: shuffle(x.q) }))}>
            Shuffle list
          </button>
          <button
            onClick={() =>
              update((x) => ({
                ...x,
                q: [],
                courts: x.courts.map((c) => ({ ...c, m: null })),
                ev: null,
              }))
            }
          >
            Reset all
          </button>
         
       </div>
 
          </div>
      </div>

      <div className="cq-card">
        <h2>Players waiting ({s.q.length})</h2>
        {s.q.length === 0 && (
          <div className="cq-mut">No players waiting. Add some above.</div>
        )}
        {s.q.map((p, i) => (
          <div className="cq-item" key={`${p.n}-${i}`}>
            <span>
              <span className="cq-mut">{i + 1}&nbsp;&nbsp;</span>
              {p.n}
              {p.lv && <span className={`lv lv-${p.lvl}`}>{p.lv}</span>}
              {mateOf(s, p.n) && (
                <span className="cq-mut"> 🤝 {mateOf(s, p.n)}</span>
              )}
              {p.at ? (
                <span className="cq-mut"> · ⏳ {fmtWait(p.at)}</span>
              ) : null}
              {p.r && (
                <span className="cq-mut">
                  {" "}
                  ({p.r === "W" ? "🏆 won" : "lost"})
                </span>
              )}
            </span>
            <span>
              <button
                className="small"
                disabled={!i}
                onClick={() => move(i)}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                className="small"
                onClick={() =>
                  update((x) => ({ ...x, q: x.q.filter((_, k) => k !== i) }))
                }
                aria-label="Remove"
              >
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default ControlPage;