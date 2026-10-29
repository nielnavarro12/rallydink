import { useState } from 'react';

// Your voice list. The TV uses the named voice if its browser has it, otherwise any voice of the same language.
export const AVAILABLE_VOICES = [
  { Name: 'Microsoft David - English (United States)', Lang: 'en-US' },
  { Name: 'Microsoft Mark - English (United States)', Lang: 'en-US' },
  { Name: 'Microsoft Zira - English (United States)', Lang: 'en-US' },
  { Name: 'Google Deutsch', Lang: 'de-DE' },
  { Name: 'Google US English', Lang: 'en-US' },
  { Name: 'Google UK English Female', Lang: 'en-GB' },
  { Name: 'Google UK English Male', Lang: 'en-GB' },
  { Name: 'Google español', Lang: 'es-ES' },
  { Name: 'Google español de Estados Unidos', Lang: 'es-US' },
  { Name: 'Google français', Lang: 'fr-FR' },
  { Name: 'Google हिन्दी', Lang: 'hi-IN' },
  { Name: 'Google Bahasa Indonesia', Lang: 'id-ID' },
  { Name: 'Google italiano', Lang: 'it-IT' },
  { Name: 'Google 日本語', Lang: 'ja-JP' },
  { Name: 'Google 한국의', Lang: 'ko-KR' },
  { Name: 'Google Nederlands', Lang: 'nl-NL' },
  { Name: 'Google polski', Lang: 'pl-PL' },
  { Name: 'Google português do Brasil', Lang: 'pt-BR' },
  { Name: 'Google русский', Lang: 'ru-RU' },
  { Name: 'Google 普通话（中国大陆）', Lang: 'zh-CN' },
  { Name: 'Google 粤語（香港）', Lang: 'zh-HK' },
  { Name: 'Google 國語（臺灣）', Lang: 'zh-TW' },
];

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="cq-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <b>{format ? format(value) : value}</b>
    </label>
  );
}

/* speech: { voice, lang, rate, pitch, volume, duck, duckLevel }
   onChange(patch): merge a patch into the speech settings
   speakHere(text): speak on this device; speakOnTv(text): ask the TV to speak */
export default function VoicePicker({ speech, onChange, speakHere, speakOnTv }) {
  const [testText, setTestText] = useState('Court 1. Anna and Ben, versus Cara and Dan. Please proceed to court 1.');

  const pickVoice = (e) => {
    const v = AVAILABLE_VOICES.find((x) => x.Name === e.target.value);
    onChange(v ? { voice: v.Name, lang: v.Lang } : { voice: '', lang: 'en' });
  };

  return (
    <div>
      <label className="cq-field">
        <span>Preferred voice</span>
        <select value={speech.voice || ''} onChange={pickVoice}>
          <option value="">Automatic (any English voice)</option>
          {AVAILABLE_VOICES.map((v) => <option key={v.Name} value={v.Name}>{v.Name}</option>)}
        </select>
      </label>

      <div className="cq-sliders">
        <Slider label="Speed" min={0.6} max={1.4} step={0.05} value={speech.rate ?? 1} onChange={(rate) => onChange({ rate })} format={(v) => `${v.toFixed(2)}×`} />
        <Slider label="Pitch" min={0.5} max={1.5} step={0.05} value={speech.pitch ?? 1} onChange={(pitch) => onChange({ pitch })} format={(v) => v.toFixed(2)} />
        <Slider label="Voice volume" min={0.1} max={1} step={0.05} value={speech.volume ?? 1} onChange={(volume) => onChange({ volume })} format={(v) => `${Math.round(v * 100)}%`} />
      </div>

      <div className="cq-duck">
        <label className="cq-check">
          <input type="checkbox" checked={speech.duck !== false} onChange={(e) => onChange({ duck: e.target.checked })} />
          Lower the ad volume while the TV is speaking
        </label>
        <Slider label="Ad volume while speaking" min={0} max={0.6} step={0.05} value={speech.duckLevel ?? 0.15} onChange={(duckLevel) => onChange({ duckLevel })} format={(v) => `${Math.round(v * 100)}%`} />
        <div className="cq-mut">Applies to videos and YouTube ads when &ldquo;Play ad sound&rdquo; is on. The volume fades down just before the voice and back up after it.</div>
      </div>

      <label className="cq-field">
        <span>Test message</span>
        <textarea value={testText} onChange={(e) => setTestText(e.target.value)} rows={2} />
      </label>
      <div className="cq-row">
        <button onClick={() => speakHere(testText)}>▶ Speak here</button>
        <button className="primary" onClick={() => speakOnTv(testText)}>📺 Speak on the TV</button>
      </div>
    </div>
  );
}
