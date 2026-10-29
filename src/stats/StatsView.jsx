import { bestPairOfDay, localDate, pairRows, playerOfDay, rows } from './stats.js';

const MEDAL = ['🥇', '🥈', '🥉'];

function Board({ title, list, empty }) {
  return (
    <section className="tvst-board">
      <h3>{title}</h3>
      {list.length === 0 && <div className="tvst-empty">{empty}</div>}
      {list.map((r, i) => (
        <div className="tvst-row" key={r.key}>
          <span className="tvst-rank">{MEDAL[i] || i + 1}</span>
          <span className="tvst-name">{r.name}</span>
          <span className="tvst-wl"><b>{r.w}</b> W · {r.l} L</span>
          <span className="tvst-pct">{r.pct}%</span>
        </div>
      ))}
    </section>
  );
}

/* TV screen: highlights, today's and all-time leaderboards, and the best partner combinations */
export default function StatsView({ stats, pairs }) {
  const today = localDate();
  const star = playerOfDay(stats, today);
  const duo = bestPairOfDay(pairs, today);

  return (
    <div className="tvst">
      <div className="tvs-title">Player stats</div>
      
      {(star || duo) && (
        <div className="tvst-hl">
          {star && (
            <div className="tvst-chip">
              ⭐ Player of the day <b>{star.name}</b> <span>{star.w} W · {star.l} L</span>
            </div>
          )}
          {duo && (
            <div className="tvst-chip">
              🤝 Best pair today <b>{duo.name}</b> <span>{duo.w} W · {duo.l} L</span>
            </div>
          )}
        </div>
      )}

      <div className="tvst-sections">
        {/* TODAY SECTION (Side-by-side) */}
        <div className="tvst-row-grid">
          <Board title="Today (Players)" list={rows(stats, 'today', today).slice(0, 10)} empty="No games finished yet today" />
          <Board title="Today (Best Pairs)" list={pairRows(pairs, 'today', today).slice(0, 5)} empty="No pairs yet today" />
        </div>

        {/* ALL TIME SECTION (Side-by-side) */}
        <div className="tvst-row-grid">
          <Board title="All Time (Players)" list={rows(stats, 'all', today).slice(0, 10)} empty="No games yet" />
          <Board title="All Time (Best Pairs)" list={pairRows(pairs, 'all', today).slice(0, 5)} empty="No pairs yet" />
        </div>
      </div>
    </div>
  );
}