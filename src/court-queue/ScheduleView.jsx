
function ScheduleView({ sessions }) {
  const days = [];
  sessions.slice(0, 10).forEach((x) => {
    const last = days[days.length - 1];
    if (last && last.date === x.date) last.items.push(x);
    else days.push({ date: x.date, items: [x] });
  });
  return (
    <div className="tvs">
      <div className="tvs-title">Open Play Schedule</div>
      <div className="tvs-cols">
        {days.map((d) => (
          <div className="tvs-day" key={d.date}>
            <div className="tvs-date">{fmtDate(d.date)}</div>
            {d.items.map((x) => (
              <div className="tvs-row" key={x.id}>
                <span className="tvs-time">
                  {fmtTime(x.start)} – {fmtTime(x.end)}
                </span>
                <span className="tvs-tag">{x.sport}</span>
                <span className="tvs-tag">{x.level}</span>
                {x.note && <span className="tvs-note">{x.note}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
export default ScheduleView;