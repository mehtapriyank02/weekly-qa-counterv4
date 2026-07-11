// Derived/computed views over AppDataContext state — ported from app.js.
import { stats, getSetting, colorFor } from "./helpers";

export function activeWs(state) {
  return state.workstreams.find((w) => w.id === state.activeWorkstreamId) || state.workstreams[0];
}

export function activeAgents(state) {
  return state.agents.filter((a) => a.is_active !== false);
}
export function inactiveAgents(state) {
  return state.agents.filter((a) => a.is_active === false);
}

export function visibleAssignments(state) {
  let r = state.assignments;
  if (state.activeWorkstreamId) r = r.filter((a) => a.workstream_id === state.activeWorkstreamId);
  if (!state.isAdmin) {
    if (!state.currentQaMember) return [];
    r = r.filter((a) => a.qa_member_id === state.currentQaMember.id);
  }
  if (state.qaFilter !== "all") r = r.filter((a) => a.qa_member_id === state.qaFilter);
  if (state.searchTerm.trim()) {
    const t = state.searchTerm.trim().toLowerCase();
    r = r.filter((a) => String(a.agent?.name || "").toLowerCase().includes(t) || String(a.qa?.name || "").toLowerCase().includes(t) || String(a.workstream?.name || "").toLowerCase().includes(t));
  }
  return [...r].sort((a, b) => String(a.agent?.name || "").localeCompare(String(b.agent?.name || "")));
}

export function totals(rows, settings) {
  let total = 0, left = 0, fail = 0, done = 0, target = 0;
  for (const row of rows) {
    const s = stats(row, settings);
    total += s.total; left += s.left; fail += s.failCount; target += s.target;
    if (s.done) done++;
  }
  return { total, left, fail, done, agents: rows.length, target };
}

export function analyticsWeeks(state) {
  return [...new Set((state.analytics?.rows || []).map((r) => r.week_start))].sort();
}

// Returns Map<qaMemberId, [{week_start, total, target, hit}]> sorted oldest to newest.
export function qaWeeklyTotals(state) {
  const result = new Map();
  if (!state.analytics) return result;
  const weeks = analyticsWeeks(state);
  for (const week of weeks) {
    const weekSettings = (state.analytics.settings || []).filter((s) => s.week_start === week);
    const rows = state.analytics.rows.filter((r) => r.week_start === week);
    const byQa = new Map();
    for (const r of rows) {
      const s = stats(r, weekSettings);
      const cur = byQa.get(r.qa_member_id) || { total: 0, target: 0 };
      cur.total += s.total; cur.target += s.target;
      byQa.set(r.qa_member_id, cur);
    }
    for (const [qaId, v] of byQa) {
      if (!result.has(qaId)) result.set(qaId, []);
      result.get(qaId).push({ week_start: week, total: v.total, target: v.target, hit: v.target > 0 && v.total >= v.target });
    }
  }
  return result;
}

// Consecutive completed weeks (excluding the current, still-in-progress week) hitting target.
export function computeStreaksMap(state) {
  const byQa = qaWeeklyTotals(state);
  const streaks = new Map();
  for (const [qaId, weeks] of byQa) {
    const completed = weeks.filter((w) => w.week_start !== state.currentWeekStart);
    let streak = 0;
    for (let i = completed.length - 1; i >= 0; i--) {
      if (completed[i].hit) streak++; else break;
    }
    streaks.set(qaId, streak);
  }
  return streaks;
}

export function agentFailHistory(state) {
  if (!state.analytics) return [];
  const byAgent = new Map();
  for (const r of state.analytics.rows) {
    if (!byAgent.has(r.agent_id)) byAgent.set(r.agent_id, { weeks: 0, failedWeeks: 0 });
    const v = byAgent.get(r.agent_id);
    v.weeks++;
    if (Number(r.fail_count || 0) >= 1) v.failedWeeks++;
  }
  const am = new Map(state.agents.map((a) => [a.id, a]));
  let rows = [...byAgent.entries()]
    .map(([agentId, v]) => ({ agent: am.get(agentId), weeks: v.weeks, failedWeeks: v.failedWeeks, rate: v.weeks ? Math.round((v.failedWeeks / v.weeks) * 100) : 0 }))
    .filter((r) => r.agent);

  if (!state.isAdmin) {
    const mine = new Set(state.assignments.filter((a) => a.qa_member_id === state.currentQaMember?.id).map((a) => a.agent_id));
    rows = rows.filter((r) => mine.has(r.agent.id));
  }
  rows.sort((a, b) => b.rate - a.rate || b.failedWeeks - a.failedWeeks);
  return rows;
}

export function historyRowsFor(state) {
  return state.historyRows
    .filter((r) => r.workstream_id === state.activeWorkstreamId)
    .filter((r) => state.isAdmin || !state.currentQaMember || r.qa_member_id === state.currentQaMember.id);
}

export { stats, getSetting, colorFor };
