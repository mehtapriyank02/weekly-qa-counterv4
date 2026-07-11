import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Animates a numeric value counting up from its previous value to `to`.
export function useCountUp(to) {
  const [display, setDisplay] = useState(to);
  const fromRef = useRef(to);
  const frameRef = useRef(null);

  useEffect(() => {
    if (typeof to !== "number" || !Number.isFinite(to)) { setDisplay(to); return; }
    if (prefersReducedMotion()) { setDisplay(to); fromRef.current = to; return; }
    const from = fromRef.current;
    if (from === to) { setDisplay(to); return; }
    const duration = 500;
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [to]);

  return display;
}
