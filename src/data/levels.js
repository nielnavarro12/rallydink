// Player levels. `level` is set by the staff; `selfLevel` is what the player picks on their own profile.
export const PLAYER_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
export const levelNum = (l) => {
  const i = PLAYER_LEVELS.indexOf(l);
  return i < 0 ? 2 : i + 1; // unknown counts as the middle level
};
export const playerLevel = (p) => (p && (p.level || p.selfLevel)) || '';
