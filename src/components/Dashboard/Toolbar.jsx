import { useAppData } from "../../context/AppDataContext";
import s from "./Toolbar.module.css";

export default function Toolbar() {
  const { state, setSearchTerm, setQaFilter, shuffleThisWeek } = useAppData();

  return (
    <div className={s.bar}>
      <div className={s.left}>
        <input
          className={s.search}
          placeholder="Search agent or QA..."
          value={state.searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {state.isAdmin && (
          <select className={s.select} value={state.qaFilter} onChange={(e) => setQaFilter(e.target.value)}>
            <option value="all">All QAs</option>
            {state.qaMembers.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
        )}
      </div>
      {state.isAdmin && (
        <button
          type="button"
          className="secondary"
          onClick={() => { if (confirm("This removes current week assignments and counts, then shuffles active agents again. Continue?")) shuffleThisWeek(); }}
        >
          Shuffle this week
        </button>
      )}
    </div>
  );
}
