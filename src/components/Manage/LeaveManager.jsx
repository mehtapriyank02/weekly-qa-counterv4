import { useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import { fmt, today, addDays } from "../../lib/helpers";
import s from "./Manage.module.css";

function LeaveRow({ qa, absence }) {
  const { applyAbsence, cancelAbsence } = useAppData();
  const [type, setType] = useState("Vacation");
  const [returnDate, setReturnDate] = useState("");

  if (absence) {
    return (
      <div className={s.row}>
        <div>
          <strong>{qa.name}</strong>
          <div className={s.leavePill}>{absence.leave_type} until {fmt(absence.return_date)}</div>
        </div>
        <div className={s.rowActions}>
          <button type="button" className="small secondary" onClick={() => { if (confirm("Restore transferred agents back to this auditor?")) cancelAbsence(absence.id); }}>
            Restore / cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.row} style={{ gridTemplateColumns: "1fr" }}>
      <div>
        <strong>{qa.name}</strong>
        <div className={s.formRow} style={{ marginTop: 8 }}>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>Vacation</option>
            <option>PTO</option>
            <option>Sick</option>
          </select>
          <input type="date" min={addDays(today(), 1)} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </div>
        <button
          type="button"
          className="small"
          style={{ marginTop: 8 }}
          onClick={() => applyAbsence(qa.id, type, returnDate)}
        >
          Apply leave
        </button>
      </div>
    </div>
  );
}

export default function LeaveManager() {
  const { state } = useAppData();
  return (
    <div className={s.panel}>
      <h2>Vacation / PTO / Sick</h2>
      <p>Move an auditor's current agents to another auditor until their return date. Existing counts stay with the agent.</p>
      <div className={s.list}>
        {state.qaMembers.map((q) => (
          <LeaveRow key={q.id} qa={q} absence={state.absences.find((a) => a.qa_member_id === q.id)} />
        ))}
      </div>
    </div>
  );
}
