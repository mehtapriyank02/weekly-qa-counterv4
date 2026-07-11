import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import { useAppData } from "../../context/AppDataContext";
import { analyticsWeeks, colorFor, qaWeeklyTotals } from "../../lib/selectors";
import { fmt, ANALYTICS_WEEKS } from "../../lib/helpers";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function TrendChart() {
  const { state } = useAppData();

  const { labels, datasets } = useMemo(() => {
    if (!state.analytics) return { labels: [], datasets: [] };
    const weeks = analyticsWeeks(state);
    const labels = weeks.map((w) => fmt(w));
    const byQa = qaWeeklyTotals(state);
    const qm = new Map(state.qaMembers.map((q) => [q.id, q]));

    let datasets = [];
    if (state.isAdmin) {
      datasets = [...byQa.entries()].map(([qaId, weeksData]) => {
        const map = new Map(weeksData.map((w) => [w.week_start, w.total]));
        const name = qm.get(qaId)?.name || "Unknown";
        const color = colorFor(name);
        return {
          label: name,
          data: weeks.map((w) => map.get(w) ?? 0),
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 4,
        };
      });
    } else if (state.currentQaMember) {
      const weeksData = byQa.get(state.currentQaMember.id) || [];
      const map = new Map(weeksData.map((w) => [w.week_start, w.total]));
      const color = colorFor(state.currentQaMember.name);
      datasets = [{
        label: state.currentQaMember.name,
        data: weeks.map((w) => map.get(w) ?? 0),
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2.5,
        pointHoverRadius: 4,
      }];
    }
    return { labels, datasets };
  }, [state]);

  if (!state.analytics) return null;

  return (
    <div style={{ height: 260 }}>
      <Line
        data={{ labels, datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: state.isAdmin, labels: { boxWidth: 10, font: { size: 11 } } } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: "rgba(128,128,128,.12)" } },
            x: { ticks: { font: { size: 11 } }, grid: { display: false } },
          },
        }}
      />
      <p style={{ marginTop: 8, fontSize: 12 }}>Total completed count, last {ANALYTICS_WEEKS} weeks.</p>
    </div>
  );
}
