import s from "./FailSelector.module.css";

export default function FailSelector({ value, onChange }) {
  const active = Number(value || 0) >= 3 ? 3 : Number(value || 0);
  return (
    <div className={s.wrap}>
      {[0, 1, 2, 3].map((v) => (
        <button
          key={v}
          type="button"
          className={`${s.choice} ${v === active ? s.active : ""}`}
          onClick={() => onChange(v)}
        >
          {v === 3 ? "3+" : v}
        </button>
      ))}
    </div>
  );
}
