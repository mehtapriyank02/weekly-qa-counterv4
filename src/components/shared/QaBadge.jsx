import { colorFor, initials } from "../../lib/helpers";
import s from "./QaBadge.module.css";

export default function QaBadge({ name }) {
  if (!name) return <span className={s.badge} />;
  return (
    <span className={s.badge}>
      <span className={s.avatar} style={{ background: colorFor(name) }}>{initials(name)}</span>
      {name}
    </span>
  );
}
