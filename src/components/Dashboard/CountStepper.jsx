import { useState } from "react";
import Icon from "../shared/Icon";
import s from "./CountStepper.module.css";

export default function CountStepper({ value, onChange }) {
  const [busy, setBusy] = useState(false);

  async function bump(delta) {
    if (busy) return;
    if (delta < 0 && value <= 0) return;
    setBusy(true);
    try {
      await onChange(delta);
    } finally {
      setBusy(false);
    }
  }

  // Arrow keys (or +/-) bump the count while focus is anywhere in this
  // control, so admins/QA can tab through the table without a mouse.
  function onKeyDown(e) {
    if (e.key === "ArrowUp" || e.key === "+" || e.key === "=") { e.preventDefault(); bump(1); }
    else if (e.key === "ArrowDown" || e.key === "-") { e.preventDefault(); bump(-1); }
  }

  return (
    <div className={s.stepper} onKeyDown={onKeyDown}>
      <button
        type="button"
        className={`${s.zone} ${s.minus}`}
        disabled={busy || value <= 0}
        aria-label="Decrease count"
        onClick={() => bump(-1)}
      >
        <Icon name="minus" size={13} />
      </button>
      <span className={s.value}>{value}</span>
      <button
        type="button"
        className={`${s.zone} ${s.plus}`}
        disabled={busy}
        aria-label="Increase count"
        onClick={() => bump(1)}
      >
        <Icon name="plus" size={13} />
      </button>
    </div>
  );
}
