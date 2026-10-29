import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');
export const fmtClock = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
};

/* With a time limit (minutes) the clock counts down and shows TIME at zero; without one it counts up. */
export function gameClock(since, limitMin = 0, now = Date.now()) {
  const elapsed = Math.max(0, (now - since) / 1000);
  if (limitMin > 0) {
    const left = limitMin * 60 - elapsed;
    return { text: left > 0 ? fmtClock(left) : 'TIME', over: left <= 0, warn: left > 0 && left <= 60, elapsed, left };
  }
  return { text: fmtClock(elapsed), over: false, warn: false, elapsed, left: null };
}

export default function GameTimer({ since, limit = 0 }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const g = gameClock(since, limit);
  return (
    <span className={`gt-time${g.over ? ' over' : ''}${g.warn ? ' warn' : ''}`} role="timer" aria-label={g.over ? 'Game time is up' : 'Game time'}>
      ⏱ {g.text}
    </span>
  );
}
