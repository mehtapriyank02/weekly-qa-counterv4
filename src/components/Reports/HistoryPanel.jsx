import { useAppData } from "../../context/AppDataContext";
import { historyRowsFor, stats } from "../../lib/selectors";
import { fmt } from "../../lib/helpers";
import QaBadge from "../shared/QaBadge";
import Icon from "../shared/Icon";
import s from "./Reports.module.css";

export default function HistoryPanel() {
  const { state, setHistoryWeek } = useAppData();
  const rows = historyRowsFor(state);

  let total = 0, target = 0, fail = 0, done = 0;
  for (const r of rows) {
    const st = stats(r, state.historySettings);
    total += st.total; target += st.target; fail += st.failCount;
    if (st.done) done++;
  }

  return (
    <div className={s.panel}>
      <h2><Icon name="calendarRange" size={17} />Previous week summary</h2>
      <p>Select a saved week to review its final numbers.</p>

      <select style={{ marginBottom: 12 }} value={state.historyWeek} onChange={(e) => setHistoryWeek(e.target.value)}>
        {state.historyWeeks.map((w) => (
          <option key={w.week_start} value={w.week_start}>Week of {fmt(w.week_start)}</option>
        ))}
      </select>

      <div className={s.summaryGrid}>
        <div className={s.summaryCard}><span>Completed</span><strong>{total}</strong></div>
        <div className={s.summaryCard}><span>Target</span><strong>{target}</strong></div>
        <div className={s.summaryCard}><span>Total failed</span><strong>{fail}</strong></div>
        <div className={s.summaryCard}><span>Agents done</span><strong>{done}/{rows.length}</strong></div>
      </div>

      {!rows.length ? (
        <div className={s.empty}>No previous data found for this week.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Agent</th>{state.isAdmin && <th>QA</th>}<th>Total</th><th>Fail</th><th>Target</th><th>Left</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = stats(r, state.historySettings);
                const pillClass = st.done ? s.pillDone : s.pillPending;
                return (
                  <tr key={r.id} className={st.done ? s.done : ""}>
                    <td>{r.agent?.name}</td>
                    {state.isAdmin && <td><QaBadge name={r.qa?.name} /></td>}
                    <td className={s.metric}>{st.total}</td>
                    <td className={s.metric}>{st.failCount}</td>
                    <td className={s.metric}>{st.target}</td>
                    <td className={s.metric}>{st.left}</td>
                    <td><span className={`${s.pill} ${pillClass}`}>{st.done ? "Done" : "Pending"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
