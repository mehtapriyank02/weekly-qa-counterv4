import { useAppData } from "../../context/AppDataContext";
import { addDays, dayCount, DAYS, stats } from "../../lib/helpers";
import QaBadge from "../shared/QaBadge";
import CountStepper from "./CountStepper";
import FailSelector from "./FailSelector";
import s from "./AgentTable.module.css";

export default function AgentTable({ rows }) {
  const { state, changeDailyCount, setFailCount } = useAppData();

  if (!rows.length) {
    return (
      <div className={s.empty}>
        <strong>No assigned agents found</strong>
        Check the selected workstream, search, or admin assignments.
      </div>
    );
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Agent</th>
            {state.isAdmin && <th>QA</th>}
            {DAYS.map((d) => <th key={d[0]}>{d[0]}</th>)}
            <th>Total</th>
            <th>Fail</th>
            <th>Target</th>
            <th>Left</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const st = stats(a, state.weeklySettings);
            const pillClass = st.done ? s.pillDone : st.left <= 2 ? s.pillRisk : s.pillPending;
            const pillText = st.done ? "Done" : st.left <= 2 ? "Almost" : "Pending";
            return (
              <tr key={a.id} className={st.done ? s.done : ""}>
                <td className={s.nameCell}>
                  {a.agent?.name}
                  <span className={s.agentSub}>{a.workstream?.name || ""}</span>
                </td>
                {state.isAdmin && <td><QaBadge name={a.qa?.name} /></td>}
                {DAYS.map((d) => (
                  <td key={d[0]}>
                    <CountStepper
                      value={dayCount(a, d[1], state.currentWeekStart)}
                      onChange={(delta) => changeDailyCount(a.id, addDays(state.currentWeekStart, d[1]), delta)}
                    />
                  </td>
                ))}
                <td className={s.metric}>{st.total}</td>
                <td><FailSelector value={st.failCount} onChange={(v) => setFailCount(a.id, v)} /></td>
                <td className={s.metric}>{st.target}</td>
                <td className={s.metric}>{st.left}</td>
                <td><span className={`${s.pill} ${pillClass}`}>{pillText}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
