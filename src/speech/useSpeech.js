import { useCallback, useEffect, useRef, useState } from 'react';

/* Speech queue for the TV (adapted from your useSpeech hook).
   - Announcements are queued, so two quick calls never cut each other off.
   - `isSpeaking` turns on BEFORE the voice starts and stays on through queued messages, then releases shortly after
     the last one ends. The TV uses it to lower the ad volume (see AdPanel `volume`).
   - Settings come from the app state (config = { voice, lang, rate, pitch, volume }) and are read at speak time,
     so a change applies to the next announcement without re-creating anything.
   - Browsers only allow speech after a click/tap: call unlock() from a button (the TV start button does). */
export function createSpeaker({ getConfig, getVoices, setSpeaking, delayMs = 600, gapMs = 500, tailMs = 500 }) {
  const queue = [];
  const keep = { utterance: null }; // some browsers drop an utterance (and its events) if it is garbage collected
  let busy = false;
  let unlocked = false;
  let idleT = null;
  let watchdog = null;

  const pickVoice = () => {
    const c = getConfig() || {};
    const vs = getVoices();
    const lang = String(c.lang || 'en').toLowerCase();
    return (
      vs.find((v) => v.name === c.voice) ||
      vs.find((v) => v.lang.toLowerCase() === lang) ||
      vs.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2))) ||
      vs[0]
    );
  };

  function next() {
    if (!unlocked || busy || !queue.length || typeof window === 'undefined' || !window.speechSynthesis) return;
    busy = true;
    clearTimeout(idleT);
    const text = queue.shift();
    setSpeaking(true);

    const done = () => {
      if (!busy) return;
      busy = false;
      clearTimeout(watchdog);
      if (queue.length) setTimeout(next, gapMs);
      else idleT = setTimeout(() => { if (!busy && !queue.length) setSpeaking(false); }, tailMs);
    };

    setTimeout(() => {
      const c = getConfig() || {};
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else if (c.lang) {
        u.lang = c.lang;
      }
      u.rate = c.rate ?? 1;
      u.pitch = c.pitch ?? 1;
      u.volume = c.volume ?? 1;
      u.onend = done;
      u.onerror = done;
      keep.utterance = u;
      window.speechSynthesis.speak(u);
      watchdog = setTimeout(done, 4000 + text.length * 150); // some TV browsers never fire onend
    }, delayMs);
  }

  return {
    speak(text) {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
      queue.push(text);
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      next();
    },
    unlock() {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      if (!unlocked) window.speechSynthesis.speak(new SpeechSynthesisUtterance('')); // warm up the engine
      unlocked = true;
      next();
    },
    cancel() {
      queue.length = 0;
      clearTimeout(watchdog);
      busy = false;
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
      setSpeaking(false);
    },
  };
}

export function useSpeech(config) {
  const cfgRef = useRef(config);
  cfgRef.current = config;
  const voicesRef = useRef([]);
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const sp = useRef(null);
  if (!sp.current) {
    sp.current = createSpeaker({ getConfig: () => cfgRef.current, getVoices: () => voicesRef.current, setSpeaking: setIsSpeaking });
  }

  useEffect(() => {
    if (!window.speechSynthesis) return undefined;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
      setVoices(voicesRef.current);
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load);
  }, []);

  // any click unlocks speech, as in your original hook
  useEffect(() => {
    const unlock = () => sp.current.unlock();
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

  const speak = useCallback((text) => sp.current.speak(text), []);
  const unlock = useCallback(() => sp.current.unlock(), []);
  const cancel = useCallback(() => sp.current.cancel(), []);
  return { speak, unlock, cancel, isSpeaking, voices };
}
