import { useAppData } from "../../context/AppDataContext";
import { computeStreaksMap } from "../../lib/selectors";
import Icon from "../shared/Icon";
import s from "./StreaksPanel.module.css";

export default function StreaksPanel() {
  const { state } = useAppData();
  if (!state.analytics) return null;
  const streaks = computeStreaksMap(state);
  const qm = new Map(state.qaMembers.map((q) => [q.id, q]));

  let rows = [];
  if (state.isAdmin) {
    rows = [...streaks.entries()].map(([qaId, n]) => ({ name: qm.get(qaId)?.name || "Unknown", streak: n })).sort((a, b) => b.streak - a.streak);
  } else if (state.currentQaMember) {
    rows = [{ name: state.currentQaMember.name, streak: streaks.get(state.currentQaMember.id) || 0 }];
  }
  if (!rows.length) return null;

  return (
    <div className={s.list}>
      {rows.map((r) => (
        <div key={r.name} className={s.row}>
          <span>{r.name}</span>
          <strong className={`${s.streak} ${r.streak > 0 ? s.on : ""}`}>
            {r.streak > 0 ? <><Icon name="flame" size={13} /> {r.streak} {r.streak === 1 ? "week" : "weeks"}</> : "—"}
          </strong>
        </div>
      ))}
    </div>
  );
}
