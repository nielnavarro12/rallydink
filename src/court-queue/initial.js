export const initial = {
  q: [], // waiting players: { n: name, r?: 'W' | 'L' }
  courts: [
    { n: 1, m: null },
    { n: 2, m: null },
  ], // m: { p1: [a, b], p2: [c, d] }
  ev: null, // last announcement: { id, type: 'call' | 'win', ... }
  sport: "Pickleball",
  voice: true,
  auto: true,
  rejoin: true,
  mode: "fifo", // fifo | rand | wl
  rotate: true, // TV alternates between the court board and the schedule
  ads: [], // TV ad playlist: { id, type: 'video' | 'youtube' | 'image', url, title, seconds }
  announcements: [], // TV scrolling messages: { id, text }
  adsOn: true,
  adsPct: 30, // width of the ads panel, % of the screen
  adFill: false, // crop ads to fill the panel instead of fitting inside it
  adSound: false,
  tickerSpeed: 12,
  club: "", // optional TV header title
  partners: { date: "", list: [] }, // fixed partners: [[nameA, nameB, 'session' | 'once'], ...] (cleared the next day)
  gameMinutes: 0, // time limit for a game in minutes; 0 = no limit (the timer just counts up)
  stats: {}, // player win/loss stats, see stats/stats.js
  pairs: {}, // partner combination stats
  results: [], // recent finished matches
  showStats: true, // TV shows the stats screen after the schedule
  speech: {
    voice: "",
    lang: "en",
    rate: 1,
    pitch: 1,
    volume: 1,
    duck: true,
    duckLevel: 0.15,
  }, // TV voice + ad ducking
};
export const LEVELS = ["All levels", "Beginner","Low Intermediate", "Intermediate", "High Intermediate", "Advanced"];
export const SPORTS = ["Pickleball", "Badminton"];