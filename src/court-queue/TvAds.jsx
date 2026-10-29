import { useCallback, useEffect, useRef, useState } from 'react';
import { getCachedVideoUrl } from './videoCache.js';

// Resolve URL with base sub-path if necessary
const resolveUrl = (u) => (u && u.startsWith('/') && !u.startsWith('//') ? import.meta.env.BASE_URL + u.slice(1) : u);

export const parseYouTube = (url) => (url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
export const detectAdType = (url) =>
  parseYouTube(url) ? 'youtube' : /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url) ? 'video' : 'image';

/* Left panel of the TV: plays the ad playlist in a loop with offline caching support.
   - video: cached locally to IndexedDB, plays to the end, then next item
   - youtube / image: shown for `seconds`, then next item */
export function AdPanel({ ads, sound, fill, volume = 1 }) {
  const [i, setI] = useState(0);
  const [mediaSrc, setMediaSrc] = useState('');
  const cur = ads.length ? ads[i % ads.length] : null;
  const next = useCallback(() => setI((x) => x + 1), []);
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const level = useRef(1);

  // Apply audio volume level to HTML5 video or YouTube iframe API
  const applyVolume = useCallback(() => {
    const v = Math.max(0, Math.min(1, level.current));
    if (videoRef.current) videoRef.current.volume = v;
    const f = frameRef.current;
    if (f && f.contentWindow) {
      f.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(v * 100)] }),
        '*'
      );
    }
  }, []);

  // Cache video locally to IndexedDB when current ad changes
  useEffect(() => {
    let active = true;
    let objectUrlToClean = null;

    if (!cur) {
      setMediaSrc('');
      return undefined;
    }

    const resolved = resolveUrl(cur.url);

    if (cur.type === 'video') {
      getCachedVideoUrl(resolved).then((cached) => {
        if (!active) return;
        if (cached.startsWith('blob:')) {
          objectUrlToClean = cached;
        }
        setMediaSrc(cached);
      });
    } else {
      setMediaSrc(resolved);
    }

    return () => {
      active = false;
      if (objectUrlToClean) {
        URL.revokeObjectURL(objectUrlToClean);
      }
    };
  }, [cur?.id, cur?.url, cur?.type]);

  // Smooth audio fading (ducks when TV announces)
  useEffect(() => {
    const id = setInterval(() => {
      const d = volume - level.current;
      if (Math.abs(d) < 0.01) {
        level.current = volume;
        applyVolume();
        clearInterval(id);
        return;
      }
      level.current += Math.sign(d) * (d < 0 ? 0.12 : 0.05);
      applyVolume();
    }, 50);
    return () => clearInterval(id);
  }, [volume, applyVolume]);

  // Apply volume when new ad loads
  useEffect(() => {
    applyVolume();
    const t = setTimeout(applyVolume, 1500);
    return () => clearTimeout(t);
  }, [i, cur?.id, applyVolume]);

  // Auto-advance non-video items (YouTube / Images) based on duration
  useEffect(() => {
    if (!cur || cur.type === 'video' || ads.length < 2) return undefined;
    const t = setTimeout(next, Math.max(3, cur.seconds || 15) * 1000);
    return () => clearTimeout(t);
  }, [i, cur?.id, cur?.type, ads.length, next]);

  if (!cur) return null;
  const cls = `ad-fill${fill ? ' cover' : ''}`;

  if (cur.type === 'video') {
    return (
      <video
        ref={videoRef}
        key={`${cur.id}-${i}`}
        className={cls}
        src={mediaSrc || resolveUrl(cur.url)}
        autoPlay
        muted={!sound}
        playsInline
        loop={ads.length === 1}
        onEnded={next}
        onError={() => setTimeout(next, 3000)}
      />
    );
  }

  if (cur.type === 'youtube') {
    const id = parseYouTube(cur.url);
    const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${
      sound ? 0 : 1
    }&controls=0&loop=1&playlist=${id}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
    return (
      <iframe
        ref={frameRef}
        key={`${cur.id}-${i}`}
        className="ad-fill"
        src={src}
        title={cur.title || 'Advertisement'}
        allow="autoplay; encrypted-media"
        onLoad={applyVolume}
      />
    );
  }

  return (
    <img
      key={`${cur.id}-${i}`}
      className={cls}
      src={mediaSrc || resolveUrl(cur.url)}
      alt={cur.title || ''}
      onError={() => setTimeout(next, 3000)}
    />
  );
}

/* Bottom bar: scrolling announcements */
export function Ticker({ items, speed = 12 }) {
  const text = items.map((x) => x.text).join('      •      ');
  const duration = (100 + text.length * 1.24) / speed;
  return (
    <div className="tv-ticker" role="marquee" aria-label="Announcements">
      <div className="tick-win">
        <div className="tick-track" style={{ '--d': `${duration}s` }}>
          {text}
        </div>
      </div>
    </div>
  );
}