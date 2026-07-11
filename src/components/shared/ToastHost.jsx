import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useAppData } from "../../context/AppDataContext";
import Icon from "./Icon";
import s from "./Toast.module.css";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function ToastHost() {
  const { toasts } = useAppData();
  const fired = useRef(new Set());

  useEffect(() => {
    for (const t of toasts) {
      if (t.confetti && !fired.current.has(t.id)) {
        fired.current.add(t.id);
        if (!prefersReducedMotion() && typeof confetti === "function") {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }
      }
    }
  }, [toasts]);

  if (!toasts.length) return null;
  return (
    <div className={s.host}>
      {toasts.map((t) => (
        <div key={t.id} className={`${s.toast} ${t.type === "error" ? s.error : ""} ${t.out ? s.out : ""}`}>
          <Icon name={t.type === "error" ? "alert" : "done"} size={18} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
