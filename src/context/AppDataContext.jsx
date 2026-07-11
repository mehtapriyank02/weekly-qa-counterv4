import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  addDays, getMonday, monthStart, seededSort, stats, timeout, today, yearStart, hash,
  ANALYTICS_WEEKS,
} from "../lib/helpers";
import { activeWs, visibleAssignments } from "../lib/selectors";
import { downloadCsv, rowsToCsv, weekCsvFilename } from "../lib/exportCsv";

const AppDataContext = createContext(null);

function initialState() {
  return {
    status: "loading", // loading | login | ready | fatal
    fatal: null,
    user: null,
    allowedUser: null,
    currentQaMember: null,
    isAdmin: false,
    workstreams: [],
    activeWorkstreamId: null,
    weeklySettings: [],
    assignments: [],
    agents: [],
    qaMembers: [],
    absences: [],
    transfers: [],
    currentWeekStart: getMonday(new Date()),
    searchTerm: "",
    qaFilter: "all",
    historyWeek: "",
    historyRows: [],
    historySettings: [],
    historyWeeks: [],
    personalMetrics: { wtd: 0, mtd: 0, ytd: 0 },
    analytics: null,
    activeSection: "home", // home | dashboard | reports | manage
    theme: localStorage.getItem("qa_theme") || "dark",
  };
}

export function AppDataProvider({ children }) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  // Keep stateRef in sync *synchronously* with each patch — React defers the
  // actual re-render, but async handlers (signIn -> loadAppData, etc.) read
  // stateRef.current right after calling patch(), before any render/effect
  // has had a chance to run. Only updating it via a `useEffect` left a window
  // where e.g. loadAppData() read a stale (null) `user` right after signIn
  // patched it in, throwing "Cannot read properties of null (reading 'email')".
  const patch = useCallback((p) => setState((s) => {
    const next = { ...s, ...(typeof p === "function" ? p(s) : p) };
    stateRef.current = next;
    return next;
  }), []);

  // ---------- theme ----------
  // Dark is the default look (no attribute needed — :root is dark by
  // default in index.css); only "light" needs an explicit override.
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  }, [state.theme]);

  const toggleTheme = useCallback(() => {
    const isDark = stateRef.current.theme !== "light";
    const next = isDark ? "light" : "dark";
    localStorage.setItem("qa_theme", next);
    patch({ theme: next });
  }, [patch]);

  // ---------- auth ----------
  const signIn = useCallback(async (email, password) => {
    const r = await supabase.auth.signInWithPassword({ email, password });
    if (r.error) return { error: r.error.message };
    patch({ user: r.data.user });
    await loadAppData();
    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patch]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    patch({ ...initialState(), status: "login" });
  }, [patch]);

  // ---------- data loading ----------
  const findCurrentQaMember = useCallback((s) => {
    if (s.isAdmin) return null;
    const n = String(s.allowedUser?.name || "").trim().toLowerCase();
    const em = String(s.user?.email || "").trim().toLowerCase();
    const pre = em.split("@")[0];
    return (
      s.qaMembers.find((m) => String(m.name).trim().toLowerCase() === n) ||
      s.qaMembers.find((m) => String(m.email || "").trim().toLowerCase() === em) ||
      s.qaMembers.find((m) => String(m.name).trim().toLowerCase() === pre) ||
      null
    );
  }, []);

  const refreshData = useCallback(async () => {
    const s = stateRef.current;
    const [ws, qa, ag, set, as, ab, tr] = await Promise.all([
      timeout(supabase.from("workstreams").select("*").eq("is_active", true).order("name"), "workstreams"),
      timeout(supabase.from("qa_members").select("*").eq("is_active", true).order("name"), "qa_members"),
      timeout(supabase.from("agents").select("*").order("name"), "agents"),
      timeout(supabase.from("weekly_settings").select("*").eq("week_start", s.currentWeekStart), "weekly_settings"),
      timeout(supabase.from("weekly_assignments").select("*").eq("week_start", s.currentWeekStart).order("created_at"), "weekly_assignments"),
      timeout(supabase.from("auditor_absences").select("*").eq("status", "active"), "auditor_absences"),
      timeout(supabase.from("assignment_transfers").select("*"), "assignment_transfers"),
    ]);
    for (const r of [ws, qa, ag, set, as, ab, tr]) if (r.error) throw r.error;

    let counts = [];
    if ((as.data || []).length) {
      const ids = as.data.map((a) => a.id);
      const c = await timeout(supabase.from("qa_counts").select("*").in("assignment_id", ids), "qa_counts");
      if (c.error) throw c.error;
      counts = c.data || [];
    }

    const qm = new Map((qa.data || []).map((x) => [x.id, x]));
    const am = new Map((ag.data || []).map((x) => [x.id, x]));
    const wm = new Map((ws.data || []).map((x) => [x.id, x]));
    const cb = new Map();
    for (const c of counts) {
      if (!cb.has(c.assignment_id)) cb.set(c.assignment_id, []);
      cb.get(c.assignment_id).push(c);
    }
    const assignments = (as.data || []).map((a) => ({
      ...a,
      qa: qm.get(a.qa_member_id) || null,
      agent: am.get(a.agent_id) || null,
      workstream: wm.get(a.workstream_id) || null,
      counts: cb.get(a.id) || [],
    }));

    patch((prev) => {
      const next = {
        ...prev,
        workstreams: ws.data || [],
        qaMembers: qa.data || [],
        agents: ag.data || [],
        weeklySettings: set.data || [],
        absences: ab.data || [],
        transfers: tr.data || [],
        assignments,
      };
      next.currentQaMember = findCurrentQaMember(next);
      if (!next.activeWorkstreamId && next.workstreams.length) next.activeWorkstreamId = next.workstreams[0].id;
      return next;
    });
  }, [patch, findCurrentQaMember]);

  const ensureCurrentWeekExists = useCallback(async () => {
    const s = stateRef.current;
    const [ws, qa, ag] = await Promise.all([
      supabase.from("workstreams").select("*").eq("is_active", true),
      supabase.from("qa_members").select("*").eq("is_active", true).order("name"),
      supabase.from("agents").select("*").eq("is_active", true).order("name"),
    ]);
    if (ws.error || qa.error || ag.error) return;

    for (const w of ws.data || []) {
      const setting = await supabase.from("weekly_settings").select("*").eq("week_start", s.currentWeekStart).eq("workstream_id", w.id).maybeSingle();
      if (!setting.data) {
        await supabase.from("weekly_settings").insert({ week_start: s.currentWeekStart, workstream_id: w.id, base_target: 5, extra_if_fail: 2 });
      }
    }

    const existing = await supabase.from("weekly_assignments").select("id").eq("week_start", s.currentWeekStart).limit(1);
    if ((existing.data || []).length) return;

    const latest = await supabase.from("weekly_assignments").select("week_start").lt("week_start", s.currentWeekStart).order("week_start", { ascending: false }).limit(1).maybeSingle();
    const prev = new Map();
    if (latest.data?.week_start) {
      const pr = await supabase.from("weekly_assignments").select("*").eq("week_start", latest.data.week_start);
      for (const r of pr.data || []) prev.set(`${r.workstream_id}:${r.agent_id}`, r.qa_member_id);
    }

    const rows = [];
    for (const w of ws.data || []) {
      const agents = (ag.data || []).filter((a) => a.workstream_id === w.id);
      if (!agents.length || !(qa.data || []).length) continue;
      const sa = seededSort(agents, `${s.currentWeekStart}:${w.id}`);
      const sq = seededSort(qa.data, `${s.currentWeekStart}:qa:${w.id}`);
      const off = hash(`${s.currentWeekStart}:${w.id}:offset`) % sq.length;
      sa.forEach((agent, i) => {
        let q = sq[(i + off) % sq.length];
        const old = prev.get(`${w.id}:${agent.id}`);
        if (sq.length > 1 && old === q.id) q = sq[(i + off + 1) % sq.length];
        rows.push({ week_start: s.currentWeekStart, qa_member_id: q.id, agent_id: agent.id, workstream_id: w.id, fail_count: 0 });
      });
    }
    if (rows.length) await supabase.from("weekly_assignments").insert(rows);
  }, []);

  const processReturningAuditors = useCallback(async () => {
    const r = await supabase.from("auditor_absences").select("*").eq("status", "active").lte("return_date", today());
    if (r.error || !r.data?.length) return;
    for (const a of r.data) {
      const t = await supabase.from("assignment_transfers").select("*").eq("absence_id", a.id);
      for (const x of t.data || []) {
        await supabase.from("weekly_assignments").update({ qa_member_id: x.original_qa_member_id }).eq("id", x.assignment_id);
      }
      await supabase.from("auditor_absences").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", a.id);
    }
  }, []);

  const loadPersonalMetrics = useCallback(async () => {
    const s = stateRef.current;
    const qid = s.isAdmin ? null : s.currentQaMember?.id;
    const ranges = { wtd: s.currentWeekStart, mtd: monthStart(), ytd: yearStart() };
    const m = { wtd: 0, mtd: 0, ytd: 0 };
    for (const k of Object.keys(ranges)) {
      let q = supabase.from("qa_count_logs").select("count_delta,performed_by_qa_member_id,qa_date").gte("qa_date", ranges[k]).lte("qa_date", today());
      if (qid) q = q.eq("performed_by_qa_member_id", qid);
      const r = await q;
      if (!r.error) m[k] = (r.data || []).reduce((sum, x) => sum + Number(x.count_delta || 0), 0);
    }
    patch({ personalMetrics: m });
  }, [patch]);

  const loadHistoryWeeks = useCallback(async () => {
    const r = await supabase.from("weekly_assignments").select("week_start").order("week_start", { ascending: false });
    if (r.error) return;
    const historyWeeks = [...new Set((r.data || []).map((x) => x.week_start))].map((week_start) => ({ week_start }));
    patch((prev) => {
      let historyWeek = prev.historyWeek;
      if (!historyWeek && historyWeeks.length) {
        const p = historyWeeks.find((w) => w.week_start !== prev.currentWeekStart);
        historyWeek = p?.week_start || historyWeeks[0].week_start;
      }
      return { historyWeeks, historyWeek };
    });
  }, [patch]);

  const loadHistoryRows = useCallback(async () => {
    const s = stateRef.current;
    if (!s.historyWeek) { patch({ historyRows: [], historySettings: [] }); return; }
    const [rows, set] = await Promise.all([
      supabase.from("weekly_assignments").select("*").eq("week_start", s.historyWeek),
      supabase.from("weekly_settings").select("*").eq("week_start", s.historyWeek),
    ]);
    if (rows.error || set.error) return;

    let counts = [];
    if ((rows.data || []).length) {
      const ids = rows.data.map((a) => a.id);
      const c = await supabase.from("qa_counts").select("*").in("assignment_id", ids);
      counts = c.data || [];
    }
    const cur = stateRef.current;
    const qm = new Map(cur.qaMembers.map((x) => [x.id, x]));
    const am = new Map(cur.agents.map((x) => [x.id, x]));
    const wm = new Map(cur.workstreams.map((x) => [x.id, x]));
    const cb = new Map();
    for (const c of counts) {
      if (!cb.has(c.assignment_id)) cb.set(c.assignment_id, []);
      cb.get(c.assignment_id).push(c);
    }
    const historyRows = (rows.data || []).map((a) => ({
      ...a,
      qa: qm.get(a.qa_member_id) || null,
      agent: am.get(a.agent_id) || null,
      workstream: wm.get(a.workstream_id) || null,
      counts: cb.get(a.id) || [],
    }));
    patch({ historyRows, historySettings: set.data || [] });
  }, [patch]);

  const loadAnalytics = useCallback(async () => {
    try {
      const s = stateRef.current;
      const since = addDays(s.currentWeekStart, -7 * (ANALYTICS_WEEKS - 1));
      const [assignRes, settingsRes] = await Promise.all([
        supabase.from("weekly_assignments").select("*").gte("week_start", since).order("week_start"),
        supabase.from("weekly_settings").select("*").gte("week_start", since),
      ]);
      if (assignRes.error || settingsRes.error) { patch({ analytics: null }); return; }

      const rows = assignRes.data || [];
      let counts = [];
      if (rows.length) {
        const ids = rows.map((a) => a.id);
        const c = await supabase.from("qa_counts").select("*").in("assignment_id", ids);
        counts = c.data || [];
      }
      const cb = new Map();
      for (const c of counts) {
        if (!cb.has(c.assignment_id)) cb.set(c.assignment_id, []);
        cb.get(c.assignment_id).push(c);
      }
      patch({
        analytics: {
          rows: rows.map((a) => ({ ...a, counts: cb.get(a.id) || [] })),
          settings: settingsRes.data || [],
        },
      });
    } catch (e) {
      console.warn("Analytics load failed", e);
      patch({ analytics: null });
    }
  }, [patch]);

  const refreshAll = useCallback(async () => {
    await refreshData();
    await loadAnalytics();
  }, [refreshData, loadAnalytics]);

  const loadAppData = useCallback(async () => {
    try {
      const s = stateRef.current;
      const access = await timeout(supabase.from("allowed_users").select("*").ilike("email", s.user.email).maybeSingle(), "allowed_users");
      if (access.error) throw access.error;
      if (!access.data || access.data.is_active === false) {
        await supabase.auth.signOut();
        patch({ status: "fatal", fatal: { title: "Access not allowed", msg: "Your email is not active in allowed_users.", detail: s.user.email } });
        return;
      }
      const isAdmin = String(access.data.role || "").toLowerCase() === "admin" || String(access.data.email || "").toLowerCase() === "admin@admin.com";
      patch({ allowedUser: access.data, isAdmin });

      await ensureCurrentWeekExists();
      await processReturningAuditors();
      await refreshData();
      await loadHistoryWeeks();
      await loadHistoryRows();
      await loadPersonalMetrics();
      await loadAnalytics();

      patch({ status: "ready" });
      subscribeRealtime();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch (e) {
      console.error(e);
      patch({ status: "fatal", fatal: { title: "Dashboard loading error", msg: e.message, detail: "Run supabase-setup-v700.sql, then refresh." } });
    }
  }, [patch, ensureCurrentWeekExists, processReturningAuditors, refreshData, loadHistoryWeeks, loadHistoryRows, loadPersonalMetrics, loadAnalytics]);

  // ---------- realtime ----------
  const channelRef = useRef(null);
  const subscribeRealtime = useCallback(() => {
    if (channelRef.current) return;
    try {
      channelRef.current = supabase.channel("qa-counter-react")
        .on("postgres_changes", { event: "*", schema: "public", table: "weekly_assignments" }, () => refreshAll())
        .on("postgres_changes", { event: "*", schema: "public", table: "qa_counts" }, async () => { await refreshData(); await loadPersonalMetrics(); await loadAnalytics(); })
        .subscribe();
    } catch (e) {
      console.warn("Realtime disabled", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshAll, refreshData, loadPersonalMetrics, loadAnalytics]);

  // ---------- init ----------
  useEffect(() => {
    (async () => {
      try {
        const r = await timeout(supabase.auth.getSession(), "auth");
        const user = r.data.session?.user || null;
        if (!user) { patch({ status: "login" }); return; }
        patch({ user });
        await loadAppData();
      } catch (e) {
        console.error(e);
        patch({ status: "fatal", fatal: { title: "Startup error", msg: e.message } });
      }
    })();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- toasts ----------
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((msg, type = "success", opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type, confetti: !!opts.confetti }]);
    setTimeout(() => setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, out: true } : t))), 2600);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);
  const dismissToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const pushError = useCallback((msg) => pushToast(msg, "error"), [pushToast]);

  // ---------- mutations ----------
  const changeDailyCount = useCallback(async (id, date, delta) => {
    const s = stateRef.current;
    const a = s.assignments.find((x) => x.id === id);
    if (!a) return;
    const performer = s.isAdmin ? a.qa_member_id : s.currentQaMember?.id;
    if (!performer) { pushError("Could not identify QA member."); return; }

    const before = stats(a, s.weeklySettings);

    const existing = await supabase.from("qa_counts").select("*").eq("assignment_id", id).eq("qa_date", date).maybeSingle();
    if (existing.error) return pushError(existing.error.message);
    const cur = Number(existing.data?.count || 0);
    const next = Math.max(cur + delta, 0);
    const applied = next - cur;
    if (applied === 0) return;

    if (existing.data) {
      const r = await supabase.from("qa_counts").update({ count: next, updated_at: new Date().toISOString() }).eq("id", existing.data.id);
      if (r.error) return pushError(r.error.message);
    } else {
      const r = await supabase.from("qa_counts").insert({ assignment_id: id, qa_date: date, count: next });
      if (r.error) return pushError(r.error.message);
    }
    await supabase.from("qa_count_logs").insert({ assignment_id: id, qa_date: date, performed_by_qa_member_id: performer, count_delta: applied });

    await refreshData();
    await loadPersonalMetrics();
    await loadAnalytics();

    const after = stats({ ...a, counts: [...a.counts.filter((c) => c.qa_date !== date), { qa_date: date, count: next }] }, s.weeklySettings);
    if (!before.done && after.done) pushToast(`${a.agent?.name || "Agent"} hit target this week`, "success", { confetti: true });
  }, [refreshData, loadPersonalMetrics, loadAnalytics, pushToast, pushError]);

  const setFailCount = useCallback(async (id, value) => {
    const s = stateRef.current;
    const a = s.assignments.find((x) => x.id === id);
    const before = a ? stats(a, s.weeklySettings) : null;
    const clean = Math.max(Number(value || 0), 0);

    const r = await supabase.from("weekly_assignments").update({ fail_count: clean }).eq("id", id);
    if (r.error) return pushError("Fail update error: " + r.error.message);

    await refreshData();
    await loadAnalytics();

    if (a && before) {
      const after = stats({ ...a, fail_count: clean }, s.weeklySettings);
      if (!before.done && after.done) pushToast(`${a.agent?.name || "Agent"} hit target this week`, "success", { confetti: true });
    }
  }, [refreshData, loadAnalytics, pushToast, pushError]);

  const saveSettings = useCallback(async (base, extra) => {
    const s = stateRef.current;
    const set = s.weeklySettings.find((x) => x.workstream_id === s.activeWorkstreamId);
    const r = set?.id
      ? await supabase.from("weekly_settings").update({ base_target: base, extra_if_fail: extra }).eq("id", set.id)
      : await supabase.from("weekly_settings").insert({ week_start: s.currentWeekStart, workstream_id: s.activeWorkstreamId, base_target: base, extra_if_fail: extra });
    if (r.error) pushError(r.error.message); else pushToast("Weekly settings saved");
    await refreshAll();
  }, [refreshAll, pushToast, pushError]);

  const assignAgent = useCallback(async (agentId, qaMemberId) => {
    const s = stateRef.current;
    if (!agentId || !qaMemberId) return;
    const r = await supabase.from("weekly_assignments").insert({ week_start: s.currentWeekStart, agent_id: agentId, qa_member_id: qaMemberId, workstream_id: s.activeWorkstreamId, fail_count: 0 });
    if (r.error) pushError(r.error.message); else pushToast("Agent assigned");
    await refreshAll();
  }, [refreshAll, pushToast, pushError]);

  const changeAssignmentQa = useCallback(async (assignmentId, qaMemberId) => {
    const r = await supabase.from("weekly_assignments").update({ qa_member_id: qaMemberId }).eq("id", assignmentId);
    if (r.error) pushError(r.error.message); else pushToast("Assignment updated");
    await refreshAll();
  }, [refreshAll, pushToast, pushError]);

  const addAgent = useCallback(async (name, workstreamId) => {
    const clean = String(name || "").trim();
    if (!clean) return;
    const r = await supabase.from("agents").insert({ name: clean, workstream_id: workstreamId, is_active: true });
    if (r.error) pushError(r.error.message); else pushToast(`${clean} added`);
    await refreshData();
  }, [refreshData, pushToast, pushError]);

  const hideAgent = useCallback(async (agentId) => {
    const r = await supabase.from("agents").update({ is_active: false }).eq("id", agentId);
    if (r.error) pushError(r.error.message); else pushToast("Agent hidden");
    await refreshAll();
  }, [refreshAll, pushToast, pushError]);

  const restoreAgent = useCallback(async (agentId) => {
    const r = await supabase.from("agents").update({ is_active: true }).eq("id", agentId);
    if (r.error) pushError(r.error.message); else pushToast("Agent restored");
    await refreshAll();
  }, [refreshAll, pushToast, pushError]);

  // New: move an agent to a different workstream, and keep the current week's
  // assignment (if any) in sync so the table/tabs reflect it immediately.
  const moveAgentWorkstream = useCallback(async (agentId, newWorkstreamId) => {
    const s = stateRef.current;
    const r = await supabase.from("agents").update({ workstream_id: newWorkstreamId }).eq("id", agentId);
    if (r.error) return pushError(r.error.message);
    const currentAssignment = s.assignments.find((a) => a.agent_id === agentId);
    if (currentAssignment) {
      const r2 = await supabase.from("weekly_assignments").update({ workstream_id: newWorkstreamId }).eq("id", currentAssignment.id);
      if (r2.error) return pushError(r2.error.message);
    }
    pushToast("Agent moved to new workstream");
    await refreshAll();
  }, [refreshAll, pushToast, pushError]);

  const applyAbsence = useCallback(async (qaId, leaveType, returnDate) => {
    const s = stateRef.current;
    if (!qaId || !leaveType || !returnDate) return pushError("Select leave type and return date.");
    if (returnDate <= today()) return pushError("Return date must be after today.");
    const cover = s.qaMembers.find((q) => q.id !== qaId && !s.absences.some((ab) => ab.qa_member_id === q.id));
    if (!cover) return pushError("No other available auditor found to cover this leave.");
    const ins = await supabase.from("auditor_absences").insert({ qa_member_id: qaId, covering_qa_member_id: cover.id, leave_type: leaveType, start_date: today(), return_date: returnDate, status: "active" }).select().single();
    if (ins.error) return pushError(ins.error.message);
    for (const a of s.assignments.filter((x) => x.qa_member_id === qaId)) {
      await supabase.from("assignment_transfers").insert({ absence_id: ins.data.id, assignment_id: a.id, original_qa_member_id: qaId, covering_qa_member_id: cover.id });
      await supabase.from("weekly_assignments").update({ qa_member_id: cover.id }).eq("id", a.id);
    }
    pushToast(`Leave applied — ${cover.name} is covering`);
    await refreshAll();
  }, [refreshAll, pushToast, pushError]);

  const cancelAbsence = useCallback(async (absenceId) => {
    const t = await supabase.from("assignment_transfers").select("*").eq("absence_id", absenceId);
    for (const x of t.data || []) {
      await supabase.from("weekly_assignments").update({ qa_member_id: x.original_qa_member_id }).eq("id", x.assignment_id);
    }
    await supabase.from("auditor_absences").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", absenceId);
    pushToast("Leave cancelled, agents restored");
    await refreshAll();
  }, [refreshAll, pushToast]);

  const shuffleThisWeek = useCallback(async () => {
    const s = stateRef.current;
    const ids = s.assignments.map((a) => a.id);
    if (ids.length) await supabase.from("weekly_assignments").delete().in("id", ids);
    await ensureCurrentWeekExists();
    pushToast("This week's assignments were reshuffled");
    await refreshAll();
  }, [ensureCurrentWeekExists, refreshAll, pushToast]);

  const manualRefresh = useCallback(async () => {
    await refreshData();
    await loadHistoryWeeks();
    await loadHistoryRows();
    await loadPersonalMetrics();
    await loadAnalytics();
  }, [refreshData, loadHistoryWeeks, loadHistoryRows, loadPersonalMetrics, loadAnalytics]);

  const setActiveWorkstreamId = useCallback((id) => patch({ activeWorkstreamId: id, searchTerm: "", qaFilter: "all" }), [patch]);
  const setSearchTerm = useCallback((v) => patch({ searchTerm: v }), [patch]);
  const setQaFilter = useCallback((v) => patch({ qaFilter: v }), [patch]);
  const setActiveSection = useCallback((v) => patch({ activeSection: v }), [patch]);
  const setHistoryWeek = useCallback(async (week) => {
    patch({ historyWeek: week });
    await loadHistoryRows();
  }, [patch, loadHistoryRows]);

  const exportCurrentWeek = useCallback(() => {
    const s = stateRef.current;
    const rows = visibleAssignments(s);
    const w = activeWs(s);
    const csv = rowsToCsv(rows, s.currentWeekStart, s.weeklySettings, s.isAdmin);
    downloadCsv(weekCsvFilename(w?.name, s.currentWeekStart), csv);
  }, []);

  // "Meet our Auditors" nav link: jump to Home and scroll to that section
  // once it mounts. `pendingScroll` is consumed by Home's own effect.
  const [pendingScroll, setPendingScrollState] = useState(null);
  const scrollToAuditors = useCallback(() => {
    patch({ activeSection: "home" });
    setPendingScrollState("auditors");
  }, [patch]);
  const consumePendingScroll = useCallback(() => setPendingScrollState(null), []);

  const value = {
    state,
    signIn,
    signOut,
    toggleTheme,
    manualRefresh,
    changeDailyCount,
    setFailCount,
    saveSettings,
    assignAgent,
    changeAssignmentQa,
    addAgent,
    hideAgent,
    restoreAgent,
    moveAgentWorkstream,
    applyAbsence,
    cancelAbsence,
    shuffleThisWeek,
    setActiveWorkstreamId,
    setSearchTerm,
    setQaFilter,
    setActiveSection,
    setHistoryWeek,
    exportCurrentWeek,
    scrollToAuditors,
    pendingScroll,
    consumePendingScroll,
    toasts,
    pushToast,
    dismissToast,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
