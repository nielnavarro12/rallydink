import { bestPairOfDay, localDate, pairRows, playerOfDay, rows } from './stats.js';

const MEDAL = ['🥇', '🥈', '🥉'];
const TOP_PLAYERS = 12;
const TOP_PAIRS = 5;

const record = (r) => `${r.w} W · ${r.l} L`;

// Medal for the first three ranks; otherwise the rank, with "T" when others share it.
function rankLabel(rank, isTied) {
  return MEDAL[rank - 1] || `${isTied ? '' : ''}${rank}`;
}

function Board({ title, list, empty }) {
  const perRank = {};
  list.forEach((r) => {
    perRank[r.rank] = (perRank[r.rank] || 0) + 1;
  });

  return (
    <section className="tvst-board">
      <h3>{title}</h3>
      {list.length === 0 && <div className="tvst-empty">{empty}</div>}
      {list.map((r) => (
        <div className="tvst-row" key={r.key}>
          <span className="tvst-rank">{rankLabel(r.rank, perRank[r.rank] > 1)}</span>
          <span className="tvst-name">{r.name}</span>
          <span className="tvst-wl">
            <b>{r.w}</b> W · {r.l} L
          </span>
          <span className="tvst-pct">{r.pct}%</span>
        </div>
      ))}
    </section>
  );
}

// `winners` is an array (ties share the title) or null.
function Highlight({ icon, label, winners }) {
  const list = [].concat(winners || []); // one object, an array, or null
  if (list.length === 0) return null;
  return (
    <div className="tvst-chip">
      {icon} {label} <b>{list.map((p) => p.name).join(' · ')}</b>{' '}
      <span>{record(list[0])}</span>
    </div>
  );
}

/* TV screen: highlights, today's and all-time leaderboards, and the best partner combinations */
export default function StatsView({ stats, pairs }) {
  const today = localDate();
  const star = playerOfDay(stats, today); // array or null
  const duo = bestPairOfDay(pairs, today); // array or null
  const todayRows = rows(stats, 'today', today);
  const topToday = todayRows.slice(0, TOP_PLAYERS);
  const restToday = todayRows.slice(TOP_PLAYERS, TOP_PLAYERS * 2);
  return (
    <div className="tvst">
      <div className="tvs-title">Player stats</div>

      {(star || duo) && (
        <div className="tvst-hl">
          <Highlight icon="⭐" label="Player of the day" winners={star} />
          {/* <Highlight icon="🤝" label="Best pair today" winners={duo} /> */}
        </div>
      )}

      <div className="tvst-sections">
      <div className="tvst-row-grid">
  <Board
    title="Today (Players)"
    list={topToday}
    empty="No games finished yet today"
  />
  <Board
    title="Today"
    list={restToday}
    empty="No other players yet today"
  />
</div>
        {/* <div className="tvst-row-grid">
          <Board
            title="Today (Players)"
            list={rows(stats, 'today', today).slice(0, TOP_PLAYERS)}
            empty="No games finished yet today"
          />
          <Board
            title="Today (Best Pairs)"
            list={pairRows(pairs, 'today', today).slice(0, TOP_PAIRS)}
            empty="No pairs yet today"
          />
        </div> */}

        {/* <div className="tvst-row-grid">
          <Board
            title="All Time (Players)"
            list={rows(stats, 'all', today).slice(0, TOP_PLAYERS)}
            empty="No games yet"
          />
          <Board
            title="All Time (Best Pairs)"
            list={pairRows(pairs, 'all', today).slice(0, TOP_PAIRS)}
            empty="No pairs yet"
          />
        </div> */}
      </div>
    </div>
  );
}