import { useAppData } from "../../context/AppDataContext";
import { agentFailHistory } from "../../lib/selectors";
import { ANALYTICS_WEEKS } from "../../lib/helpers";
import Icon from "../shared/Icon";
import s from "./Reports.module.css";

export default function FailHistoryPanel() {
  const { state } = useAppData();
  const rows = agentFailHistory(state);
  if (!rows.length) return null;

  return (
    <div className={s.panel}>
      <h2><Icon name="alert" size={17} />Fail-rate history</h2>
      <p>Based on the last {ANALYTICS_WEEKS} weeks of data.</p>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr><th>Agent</th><th>Weeks tracked</th><th>Weeks w/ fail</th><th>Fail rate</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.agent.id}>
                <td>{r.agent.name}</td>
                <td className={s.metric}>{r.weeks}</td>
                <td className={s.metric}>{r.failedWeeks}</td>
                <td><span className={`${s.pill} ${r.rate >= 50 ? s.pillRisk : r.rate > 0 ? s.pillPending : s.pillDone}`}>{r.rate}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
