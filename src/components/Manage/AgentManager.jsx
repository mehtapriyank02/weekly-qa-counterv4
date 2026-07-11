import { useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import { activeAgents, inactiveAgents } from "../../lib/selectors";
import s from "./Manage.module.css";

export default function AgentManager({ workstreamId }) {
  const { state, addAgent, hideAgent, restoreAgent, moveAgentWorkstream } = useAppData();
  const [name, setName] = useState("");

  const active = activeAgents(state).filter((a) => a.workstream_id === workstreamId);
  const hidden = inactiveAgents(state).filter((a) => a.workstream_id === workstreamId);
  const otherWorkstreams = state.workstreams.filter((w) => w.id !== workstreamId);

  async function onAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await addAgent(name, workstreamId);
    setName("");
  }

  return (
    <div className={s.panel}>
      <h2>Agents</h2>
      <p>Add, move between workstreams, hide, or restore agents.</p>

      <form className={s.form} onSubmit={onAdd}>
        <label>New agent name
          <input placeholder="Example: Sagar" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button>Add agent</button>
      </form>

      <div className={s.subLabel}>Active ({active.length})</div>
      <div className={s.list}>
        {!active.length && <div className={s.empty}>No active agents in this workstream.</div>}
        {active.map((a) => (
          <div key={a.id} className={s.row}>
            <div>
              <strong>{a.name}</strong>
              <span>Active</span>
            </div>
            <div className={s.rowActions}>
              {otherWorkstreams.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) { moveAgentWorkstream(a.id, e.target.value); e.target.value = ""; } }}
                >
                  <option value="" disabled>Move to...</option>
                  {otherWorkstreams.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              )}
              <button type="button" className="small secondary" onClick={() => { if (confirm(`Hide ${a.name}? They'll disappear from active views but history stays.`)) hideAgent(a.id); }}>
                Hide
              </button>
            </div>
          </div>
        ))}
      </div>

      {hidden.length > 0 && (
        <>
          <hr className={s.divider} />
          <div className={s.subLabel}>Hidden ({hidden.length})</div>
          <div className={s.list}>
            {hidden.map((a) => (
              <div key={a.id} className={s.row}>
                <div>
                  <strong>{a.name}</strong>
                  <span>Hidden — history preserved</span>
                </div>
                <div className={s.rowActions}>
                  <button type="button" className="small secondary" onClick={() => restoreAgent(a.id)}>Restore</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
