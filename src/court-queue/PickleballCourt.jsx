
/* =====================================================================
   Pickleball court (used on the TV page)
   ===================================================================== */
function PickleballCourt({ court, rental, next, limit = 0 }) {
  const { m } = court;
  const spot = (name, cls) => <div className={`pn ${cls}`}>{name}</div>;
  return (
    <div className={`pcw${rental ? " rented" : m ? "" : " idle"}`}>
      <div className="ct">
        <div className="kz l" />
        <div className="kz r" />
        <div className="cl a" />
        <div className="cl b" />
        <div className="net" />
        <div className="cname">COURT {court.n}</div>
        {m ? (
          <>
            {m.startedAt && (
              <div className="gt">
                <GameTimer since={m.startedAt} limit={limit} />
              </div>
            )}
            {spot(m.p1[0], "tl")}
            {spot(m.p1[1], "tr")}
            {spot(m.p2[0], "bl")}
            {spot(m.p2[1], "br")}
          </>
        ) : rental ? (
          <>
            <div className="rent-top">
              <div className="rent-tag">RENTED</div>
            </div>
            <div className="rent-bot">
              <div className="rent-time">
                {fmtTime(rental.start)} – {fmtTime(rental.end)}
              </div>
              {rental.name && <div className="rent-sub">{rental.name}</div>}
            </div>
          </>
        ) : (
          <div className="free">
            AVAILABLE
            {next && (
              <div className="rent-sub">Rented from {fmtTime(next.start)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}