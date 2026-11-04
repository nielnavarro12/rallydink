
const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  left: Math.random() * 100,
  dur: 3 + Math.random() * 3,
  delay: -Math.random() * 5,
  icon: ["🎉", "🏆", "⭐", "🎊"][i % 4],
}));

function Announcement({ ev, sport }) {
  if (ev.type === "call") {
    return (
      <div className="ov call">
        <div className="ov-lbl">Now calling · {sport}</div>
        <div className="ov-court">COURT {ev.court}</div>
        <div className="ov-big">{ev.p1.join(" & ")}</div>
        <div className="ov-vs">VS</div>
        <div className="ov-big">{ev.p2.join(" & ")}</div>
      </div>
    );
  }
  return (
    <div className="ov win">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="ov-conf"
          style={{
            left: `${c.left}vw`,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          {c.icon}
        </span>
      ))}
      <div className="ov-trophy">🏆</div>
      <div className="ov-lbl">Congratulations</div>
      <div className="ov-big" style={{ color: "#ffd84d", marginTop: "2vh" }}>
        {ev.win.join(" & ")}
      </div>
      <div className="ov-vs">Winners · Court {ev.court}</div>
    </div>
  );
}
export default Announcement;