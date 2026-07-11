import { useAppData } from "../../context/AppDataContext";
import { activeWs } from "../../lib/selectors";
import AgentManager from "./AgentManager";
import AssignmentEditor from "./AssignmentEditor";
import WeeklySettingsPanel from "./WeeklySettingsPanel";
import LeaveManager from "./LeaveManager";
import s from "./Manage.module.css";

export default function Manage() {
  const { state, setActiveWorkstreamId } = useAppData();
  const w = activeWs(state);

  if (!w) {
    return (
      <div className={s.header}>
        <h1>Manage</h1>
        <p>No workstreams found. Run supabase-setup-v700.sql to seed one.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={s.header}>
        <h1>Manage</h1>
        <p>Agents, assignments, weekly targets, and leave coverage — admin only.</p>
      </div>

      <select className={s.wsSelect} value={w.id} onChange={(e) => setActiveWorkstreamId(e.target.value)}>
        {state.workstreams.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
      </select>

      <div className={s.grid}>
        <div>
          <AgentManager workstreamId={w.id} />
          <WeeklySettingsPanel workstreamId={w.id} />
        </div>
        <div>
          <AssignmentEditor workstreamId={w.id} />
          <LeaveManager />
        </div>
      </div>
    </div>
  );
}
