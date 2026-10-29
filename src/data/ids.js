const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
// random 20-character id, like a Firestore auto id
export function newId() {
  const bytes = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? crypto.getRandomValues(new Uint8Array(20))
    : Array.from({ length: 20 }, () => Math.floor(Math.random() * 256));
  let s = '';
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}
