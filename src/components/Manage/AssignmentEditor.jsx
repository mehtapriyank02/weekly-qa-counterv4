import { useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import { activeAgents } from "../../lib/selectors";
import s from "./Manage.module.css";

export default function AssignmentEditor({ workstreamId }) {
  const { state, assignAgent, changeAssignmentQa } = useAppData();
  const [agentId, setAgentId] = useState("");
  const [qaId, setQaId] = useState(state.qaMembers[0]?.id || "");

  const wsAssignments = state.assignments.filter((a) => a.workstream_id === workstreamId);
  const assignedIds = new Set(wsAssignments.map((a) => a.agent_id));
  const unassigned = activeAgents(state).filter((a) => a.workstream_id === workstreamId && !assignedIds.has(a.id));

  async function onAssign(e) {
    e.preventDefault();
    if (!agentId || !qaId) return;
    await assignAgent(agentId, qaId);
    setAgentId("");
  }

  return (
    <div className={s.panel}>
      <h2>Assignments</h2>
      <p>This week's agent-to-QA pairings for this workstream.</p>

      {unassigned.length > 0 ? (
        <form className={s.form} onSubmit={onAssign}>
          <div className={s.formRow}>
            <label>Agent
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                <option value="">Select unassigned agent</option>
                {unassigned.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label>QA
              <select value={qaId} onChange={(e) => setQaId(e.target.value)}>
                {state.qaMembers.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
              </select>
            </label>
          </div>
          <button disabled={!agentId}>Assign agent</button>
        </form>
      ) : (
        <div className={s.empty}>All active agents in this workstream are already assigned.</div>
      )}

      <div className={s.list}>
        {wsAssignments.map((a) => (
          <div key={a.id} className={s.row}>
            <div>
              <strong>{a.agent?.name}</strong>
              <span>Assigned to {a.qa?.name}</span>
            </div>
            <div className={s.rowActions}>
              <select value={a.qa_member_id} onChange={(e) => changeAssignmentQa(a.id, e.target.value)}>
                {state.qaMembers.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
