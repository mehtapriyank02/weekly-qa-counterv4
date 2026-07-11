import { useAppData } from "../../context/AppDataContext";
import { activeWs, getSetting, totals, visibleAssignments } from "../../lib/selectors";
import { fmt } from "../../lib/helpers";
import StatCards from "./StatCards";
import Toolbar from "./Toolbar";
import AgentTable from "./AgentTable";
import s from "./Dashboard.module.css";

export default function Dashboard() {
  const { state } = useAppData();
  const w = activeWs(state);

  if (!w) {
    return (
      <div className={s.empty}>
        <strong style={{ display: "block", color: "var(--text)", fontSize: 16, marginBottom: 6 }}>No workstreams found</strong>
        Run supabase-setup-v700.sql and refresh, or ask an admin to add one under Manage.
      </div>
    );
  }

  const rows = visibleAssignments(state);
  const set = getSetting(w.id, state.weeklySettings);
  const t = totals(rows, state.weeklySettings);

  return (
    <div>
      <div className={s.header}>
        <h1>{w.name}</h1>
        <p>
          Week of {fmt(state.currentWeekStart)} — {state.isAdmin ? "showing all assigned agents." : `showing only agents assigned to ${state.currentQaMember?.name || "your QA profile"}.`}
        </p>
      </div>

      <StatCards totals={t} personalMetrics={state.personalMetrics} />

      <div className={s.panel}>
        <div className={s.notice}>
          Base target: <strong>{set.base_target}</strong>. If fail count is 1 or more, target becomes <strong>{Number(set.base_target) + Number(set.extra_if_fail)}</strong>.
        </div>
        <Toolbar />
        <AgentTable rows={rows} />
      </div>
    </div>
  );
}
