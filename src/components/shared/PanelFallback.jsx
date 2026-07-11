import s from "./Skeleton.module.css";

export default function PanelFallback({ height = 220 }) {
  return <div className={s.bar} style={{ height, borderRadius: "var(--radius)" }} />;
}
