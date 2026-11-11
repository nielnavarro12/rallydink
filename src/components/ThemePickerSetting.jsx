import { THEMES } from "../platform/domain.js";

export function ThemePickerSetting({ value, onChange }) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme">
      {Object.entries(THEMES).map(([k, t]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          className={`theme-opt${value === k ? " on" : ""}`}
          onClick={() => onChange(k)}
        >
          <span className="theme-sw" style={{ background: t.swatch }} />
          <b>{t.label}</b>
          <span className="cq-mut">{t.desc}</span>
        </button>
      ))}
    </div>
  );
}