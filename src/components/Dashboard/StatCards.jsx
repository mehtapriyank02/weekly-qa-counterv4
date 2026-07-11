import Icon from "../shared/Icon";
import { useCountUp } from "../../lib/useCountUp";
import s from "./StatCards.module.css";

function Card({ icon, label, value, sub }) {
  const numeric = typeof value === "number";
  const animated = useCountUp(numeric ? value : 0);
  return (
    <div className={s.card}>
      <div className={s.iconWrap}><Icon name={icon} size={16} /></div>
      <div className={s.label}>{label}</div>
      <div className={s.value}>{numeric ? animated : value}</div>
      <div className={s.sub}>{sub}</div>
    </div>
  );
}

export default function StatCards({ totals, personalMetrics }) {
  return (
    <div className={s.grid}>
      <Card icon="done" label="Done" value={totals.total} sub="Current table" />
      <Card icon="target" label="Target" value={totals.target} sub="After fails" />
      <Card icon="hourglass" label="Left" value={totals.left} sub="Remaining" />
      <Card icon="alert" label="Failed" value={totals.fail} sub="Total failed count" />
      <Card icon="users" label="Agents" value={`${totals.done}/${totals.agents}`} sub="Complete" />
      <Card icon="calendar" label="MTD" value={personalMetrics.mtd} sub="Completed" />
      <Card icon="calendarRange" label="YTD" value={personalMetrics.ytd} sub="Completed" />
    </div>
  );
}
