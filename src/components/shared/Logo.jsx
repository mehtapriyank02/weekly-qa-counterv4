import s from "./Logo.module.css";

// Custom brand mark (not from the shared Icon set) — a sharp, asymmetric
// V/checkmark hybrid, distinct from the rounded checkmark used elsewhere.
function BrandMark({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 6 L12 18.5 L20.5 4" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

export default function Logo({ size = "sm" }) {
  const markSize = size === "lg" ? 22 : 14;
  return (
    <span className={`${s.logo} ${size === "lg" ? s.lg : ""}`}>
      <span className={s.mark}><BrandMark size={markSize} /></span>
      <span className={s.word}>verity<span className={s.dot}>.</span></span>
    </span>
  );
}
