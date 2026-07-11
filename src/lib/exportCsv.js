import { dayCount, DAYS, stats } from "./helpers";

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// rows: visibleAssignments(state) output. weekStart/settings from state.
// includeQa: skip the QA column when every row is trivially the same person
// (a QA member viewing their own filtered table).
export function rowsToCsv(rows, weekStart, settings, includeQa = true) {
  const header = ["Agent", ...(includeQa ? ["QA"] : []), ...DAYS.map((d) => d[0]), "Total", "Fail", "Target", "Left", "Status"];
  const lines = [header.map(csvCell).join(",")];
  for (const a of rows) {
    const s = stats(a, settings);
    const dayCells = DAYS.map((d) => dayCount(a, d[1], weekStart));
    const status = s.done ? "Done" : s.left <= 2 ? "Almost" : "Pending";
    lines.push([
      a.agent?.name || "",
      ...(includeQa ? [a.qa?.name || ""] : []),
      ...dayCells,
      s.total, s.failCount, s.target, s.left, status,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(filename, csvString) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function weekCsvFilename(workstreamName, weekStart) {
  const slug = String(workstreamName || "workstream").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${slug}-${weekStart}.csv`;
}
