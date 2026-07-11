import { lazy, Suspense } from "react";
import { useAppData } from "../../context/AppDataContext";
import StreaksPanel from "./StreaksPanel";
import FailHistoryPanel from "./FailHistoryPanel";
import HistoryPanel from "./HistoryPanel";
import Icon from "../shared/Icon";
import PanelFallback from "../shared/PanelFallback";
import s from "./Reports.module.css";

const TrendChart = lazy(() => import("./TrendChart"));

export default function Reports() {
  const { state } = useAppData();

  return (
    <div>
      <div className={s.header}>
        <h1>Reports</h1>
        <p>Trends, streaks, fail history, and previous weeks.</p>
      </div>

      <div className={s.grid}>
        <div>
          <div className={s.panel}>
            <h2><Icon name="trend" size={17} />Weekly trend</h2>
            <Suspense fallback={<PanelFallback />}>
              <TrendChart />
            </Suspense>
          </div>
          <FailHistoryPanel />
        </div>
        <div>
          <div className={s.panel}>
            <h2><Icon name="flame" size={17} />Target streaks</h2>
            <p>Consecutive completed weeks hitting target.</p>
            <StreaksPanel />
          </div>
          <HistoryPanel />
        </div>
      </div>

      {!state.analytics && <p style={{ marginTop: 12 }}>Analytics data isn't available right now.</p>}
    </div>
  );
}
