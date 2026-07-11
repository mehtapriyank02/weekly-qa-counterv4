import { useEffect, useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import { getSetting } from "../../lib/selectors";
import s from "./Manage.module.css";

export default function WeeklySettingsPanel({ workstreamId }) {
  const { state, saveSettings } = useAppData();
  const set = getSetting(workstreamId, state.weeklySettings);
  const [base, setBase] = useState(set.base_target);
  const [extra, setExtra] = useState(set.extra_if_fail);

  useEffect(() => { setBase(set.base_target); setExtra(set.extra_if_fail); }, [set.base_target, set.extra_if_fail]);

  async function onSubmit(e) {
    e.preventDefault();
    await saveSettings(Number(base || 0), Number(extra || 0));
  }

  return (
    <div className={s.panel}>
      <h2>Weekly settings</h2>
      <p>Target rules for this workstream, this week.</p>
      <form className={s.form} onSubmit={onSubmit}>
        <label>Weekly QA target
          <input type="number" min="0" value={base} onChange={(e) => setBase(e.target.value)} />
        </label>
        <label>Extra QA if 1+ fail
          <input type="number" min="0" value={extra} onChange={(e) => setExtra(e.target.value)} />
        </label>
        <button>Save settings</button>
      </form>
    </div>
  );
}
