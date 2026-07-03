const app = document.getElementById("app");
const BUILD = "v1000-vibrant";
console.log("Weekly QA Counter", BUILD);

// ---------- icon set (inline SVG, no emoji, currentColor so it themes for free) ----------

const ICONS = {
  check: '<path d="M4 12.5l5 5L20 6"/>',
  alert: '<path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 9.5v5"/><circle cx="12" cy="17.2" r=".6" fill="currentColor" stroke="none"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.85 1.85M17.55 17.55l1.85 1.85M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.85-1.85M17.55 6.45l1.85-1.85"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.6 4.5M20 20v-5h-5"/>',
  logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4"/><path d="M15 16l4-4-4-4M19 12H9"/>',
  flame: '<path d="M12 2.5c1.2 3-1.4 3.9-1.4 6.6 0 1.6 1.1 2.4 2.3 2.4 1.6 0 2.6-1.4 2.3-3.2C17.8 10.8 19 13 19 15.5A7 7 0 1 1 5 15.5c0-3.4 2.2-5.2 4-7.4C10.6 6 11 4 12 2.5Z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 5.5 5 9s-5 4-5 9M17 3c0 5-5 5.5-5 9s5 4 5 9"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 19c.6-3.2 3-5 6.2-5s5.6 1.8 6.2 5"/><circle cx="17.5" cy="9" r="2.4"/><path d="M15.8 14.2c2.3.3 4.1 1.9 4.6 4.8"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  calendarRange: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 14h3M13 14h3M8 17.5h3"/>',
  done: '<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.6 2.6 5-5.4"/>'
};
function icon(name, size = 18) {
  const body = ICONS[name] || ICONS.check;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

// ---------- vibrant color system: consistent per-person color + avatars ----------

const AVATAR_COLORS = ["#7C3AED", "#DB2777", "#0891B2", "#D97706", "#16A34A", "#E11D48", "#2563EB", "#9333EA"];

function colorFor(name) {
  return AVATAR_COLORS[hash(String(name || "")) % AVATAR_COLORS.length];
}
function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}
function qaBadge(name) {
  if (!name) return `<span class="qa-badge"></span>`;
  return `<span class="qa-badge"><span class="avatar" style="background:${colorFor(name)}">${esc(initials(name))}</span>${esc(name)}</span>`;
}

// ---------- count-up animation for stat cards ----------

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function animateValue(el, to) {
  if (prefersReducedMotion() || !Number.isFinite(to)) { el.textContent = to; return; }
  const from = 0;
  const duration = 700;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function animateStatCards() {
  app.querySelectorAll(".stat-value[data-animate]").forEach((el) => {
    animateValue(el, Number(el.dataset.value || 0));
  });
}

// ---------- toast ----------

function showToast(msg) {
  const host = document.getElementById("toastHost");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${icon("done", 18)}<span>${esc(msg)}</span>`;
  host.appendChild(el);
  setTimeout(() => el.classList.add("out"), 2200);
  setTimeout(() => el.remove(), 2600);
}

if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || String(window.SUPABASE_ANON_KEY).includes("PASTE_")) {
  app.innerHTML = `<div class="auth-card"><div class="brand-mark alert">${icon("alert", 24)}</div><h1>Config missing</h1><p>Edit config.js and paste your Supabase URL and anon public key.</p></div>`;
  throw new Error("Missing config");
}

const supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const DAYS = [["Mon", 0], ["Tue", 1], ["Wed", 2], ["Thu", 3], ["Fri", 4]];
const REMINDERS = [
  "Drink water and take a quick stretch break.",
  "Keep notes short, clear, and audit-friendly.",
  "Double-check fail logic before marking the row done.",
  "Take a 2-minute eye break after a long QA block.",
  "Update counts daily so Friday stays light."
];

// How many past weeks (including the current one) feed the trend chart,
// streaks, and fail-rate history. Bump this up if you want a longer lookback.
const ANALYTICS_WEEKS = 12;

let state = {
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
  analytics: null
};

let trendChartInstance = null;

// ---------- date + misc helpers ----------

function dateOnly(d) {
  d = new Date(d);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function today() { return dateOnly(new Date()); }
function getMonday(d) {
  d = new Date(d);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return dateOnly(d);
}
function addDays(s, n) {
  const d = new Date(`${s}T00:00:00`);
  d.setDate(d.getDate() + n);
  return dateOnly(d);
}
function fmt(s) {
  return new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function monthStart() { const d = new Date(); return dateOnly(new Date(d.getFullYear(), d.getMonth(), 1)); }
function yearStart() { const d = new Date(); return dateOnly(new Date(d.getFullYear(), 0, 1)); }

function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}
function seededSort(arr, seed) {
  return [...arr].sort((a, b) => hash(`${seed}:${a.id || a.name}`) - hash(`${seed}:${b.id || b.name}`));
}
function remind() { return REMINDERS[hash(today()) % REMINDERS.length]; }

function timeout(p, label, ms = 12000) {
  return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(label + " timed out")), ms))]);
}

function fatal(title, msg, detail = "") {
  app.innerHTML = `<div class="auth-card"><div class="brand-mark alert">${icon("alert", 24)}</div><h1>${esc(title)}</h1><p>${esc(msg)}</p>${detail ? `<div class="error-box">${esc(detail)}</div>` : ""}<button onclick="location.reload()" style="margin-top:16px">Refresh page</button></div>`;
}
function loading(msg = "Loading your dashboard...") {
  app.innerHTML = `<div class="auth-card"><div class="brand-mark">${icon("check", 22)}</div><h1>Weekly QA Counter</h1><p>${esc(msg)}</p><div class="debug-list">Build: ${BUILD}</div></div>`;
}

function fireConfetti() {
  if (typeof confetti === "function") {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
  }
}

// ---------- theme ----------

function applyTheme() {
  const theme = localStorage.getItem("qa_theme") || "light";
  document.body.classList.toggle("dark", theme === "dark");
}
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("qa_theme", isDark ? "dark" : "light");
  const btn = document.getElementById("themeBtn");
  if (btn) {
    btn.innerHTML = icon(isDark ? "sun" : "moon", 18);
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
}

// ---------- auth ----------

async function init() {
  applyTheme();
  try {
    loading("Checking login session...");
    const r = await timeout(supabaseClient.auth.getSession(), "auth");
    state.user = r.data.session?.user || null;
    if (!state.user) return renderLogin();
    await loadAppData();
  } catch (e) {
    console.error(e);
    fatal("Startup error", e.message);
  }
}

function renderLogin() {
  document.body.classList.remove("admin");
  app.innerHTML = `<div class="auth-card"><div class="brand-mark">${icon("check", 22)}</div><h1>Weekly QA Counter</h1><p>Sign in to view your assigned agents and weekly QA progress.</p><div id="loginError"></div><form id="loginForm" class="form-stack"><input id="email" type="email" placeholder="Email" required><input id="password" type="password" placeholder="Password" required><button>Sign in</button></form><div class="debug-list">Build: ${BUILD}</div></div>`;
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const box = document.getElementById("loginError");
    box.innerHTML = "";
    const r = await supabaseClient.auth.signInWithPassword({ email, password });
    if (r.error) return (box.innerHTML = `<div class="error-box">${esc(r.error.message)}</div>`);
    state.user = r.data.user;
    await loadAppData();
  });
}

async function signOut() {
  await supabaseClient.auth.signOut();
  state.user = null;
  renderLogin();
}

// ---------- data loading ----------

async function loadAppData() {
  try {
    loading("Checking access...");
    const access = await timeout(supabaseClient.from("allowed_users").select("*").ilike("email", state.user.email).maybeSingle(), "allowed_users");
    if (access.error) throw access.error;
    if (!access.data || access.data.is_active === false) {
      await supabaseClient.auth.signOut();
      return fatal("Access not allowed", "Your email is not active in allowed_users.", state.user.email);
    }
    state.allowedUser = access.data;
    state.isAdmin = String(access.data.role || "").toLowerCase() === "admin" || String(access.data.email || "").toLowerCase() === "admin@admin.com";
    document.body.classList.toggle("admin", state.isAdmin);

    await ensureCurrentWeekExists();
    await processReturningAuditors();
    await refreshData(false);

    if (!state.activeWorkstreamId && state.workstreams.length) state.activeWorkstreamId = state.workstreams[0].id;

    await loadHistoryWeeks();
    if (!state.historyWeek && state.historyWeeks.length) {
      const prev = state.historyWeeks.find((w) => w.week_start !== state.currentWeekStart);
      state.historyWeek = prev?.week_start || state.historyWeeks[0].week_start;
    }
    await loadHistoryRows();
    await loadPersonalMetrics();
    await loadAnalytics();

    renderDashboard();
    subscribeRealtime();
    setInterval(updateClock, 30000);
  } catch (e) {
    console.error(e);
    fatal("Dashboard loading error", e.message, "Run supabase-setup-v700.sql, then refresh.");
  }
}

async function refreshData(show = true) {
  if (show) loading("Loading dashboard data...");
  const [ws, qa, ag, set, as, ab, tr] = await Promise.all([
    timeout(supabaseClient.from("workstreams").select("*").eq("is_active", true).order("name"), "workstreams"),
    timeout(supabaseClient.from("qa_members").select("*").eq("is_active", true).order("name"), "qa_members"),
    timeout(supabaseClient.from("agents").select("*").eq("is_active", true).order("name"), "agents"),
    timeout(supabaseClient.from("weekly_settings").select("*").eq("week_start", state.currentWeekStart), "weekly_settings"),
    timeout(supabaseClient.from("weekly_assignments").select("*").eq("week_start", state.currentWeekStart).order("created_at"), "weekly_assignments"),
    timeout(supabaseClient.from("auditor_absences").select("*").eq("status", "active"), "auditor_absences"),
    timeout(supabaseClient.from("assignment_transfers").select("*"), "assignment_transfers")
  ]);
  for (const r of [ws, qa, ag, set, as, ab, tr]) if (r.error) throw r.error;

  let counts = [];
  if ((as.data || []).length) {
    const ids = as.data.map((a) => a.id);
    const c = await timeout(supabaseClient.from("qa_counts").select("*").in("assignment_id", ids), "qa_counts");
    if (c.error) throw c.error;
    counts = c.data || [];
  }

  state.workstreams = ws.data || [];
  state.qaMembers = qa.data || [];
  state.agents = ag.data || [];
  state.weeklySettings = set.data || [];
  state.absences = ab.data || [];
  state.transfers = tr.data || [];

  const qm = new Map(state.qaMembers.map((x) => [x.id, x]));
  const am = new Map(state.agents.map((x) => [x.id, x]));
  const wm = new Map(state.workstreams.map((x) => [x.id, x]));
  const cb = new Map();
  for (const c of counts) {
    if (!cb.has(c.assignment_id)) cb.set(c.assignment_id, []);
    cb.get(c.assignment_id).push(c);
  }
  state.assignments = (as.data || []).map((a) => ({
    ...a,
    qa: qm.get(a.qa_member_id) || null,
    agent: am.get(a.agent_id) || null,
    workstream: wm.get(a.workstream_id) || null,
    counts: cb.get(a.id) || []
  }));
  state.currentQaMember = findCurrentQaMember();
}

async function ensureCurrentWeekExists() {
  const [ws, qa, ag] = await Promise.all([
    supabaseClient.from("workstreams").select("*").eq("is_active", true),
    supabaseClient.from("qa_members").select("*").eq("is_active", true).order("name"),
    supabaseClient.from("agents").select("*").eq("is_active", true).order("name")
  ]);
  if (ws.error || qa.error || ag.error) return;

  for (const w of ws.data || []) {
    const s = await supabaseClient.from("weekly_settings").select("*").eq("week_start", state.currentWeekStart).eq("workstream_id", w.id).maybeSingle();
    if (!s.data) {
      await supabaseClient.from("weekly_settings").insert({ week_start: state.currentWeekStart, workstream_id: w.id, base_target: 5, extra_if_fail: 2 });
    }
  }

  const existing = await supabaseClient.from("weekly_assignments").select("id").eq("week_start", state.currentWeekStart).limit(1);
  if ((existing.data || []).length) return;

  const latest = await supabaseClient.from("weekly_assignments").select("week_start").lt("week_start", state.currentWeekStart).order("week_start", { ascending: false }).limit(1).maybeSingle();
  const prev = new Map();
  if (latest.data?.week_start) {
    const pr = await supabaseClient.from("weekly_assignments").select("*").eq("week_start", latest.data.week_start);
    for (const r of pr.data || []) prev.set(`${r.workstream_id}:${r.agent_id}`, r.qa_member_id);
  }

  const rows = [];
  for (const w of ws.data || []) {
    const agents = (ag.data || []).filter((a) => a.workstream_id === w.id);
    if (!agents.length || !(qa.data || []).length) continue;
    const sa = seededSort(agents, `${state.currentWeekStart}:${w.id}`);
    const sq = seededSort(qa.data, `${state.currentWeekStart}:qa:${w.id}`);
    const off = hash(`${state.currentWeekStart}:${w.id}:offset`) % sq.length;
    sa.forEach((agent, i) => {
      let q = sq[(i + off) % sq.length];
      const old = prev.get(`${w.id}:${agent.id}`);
      if (sq.length > 1 && old === q.id) q = sq[(i + off + 1) % sq.length];
      rows.push({ week_start: state.currentWeekStart, qa_member_id: q.id, agent_id: agent.id, workstream_id: w.id, fail_count: 0 });
    });
  }
  if (rows.length) await supabaseClient.from("weekly_assignments").insert(rows);
}

async function processReturningAuditors() {
  const r = await supabaseClient.from("auditor_absences").select("*").eq("status", "active").lte("return_date", today());
  if (r.error || !r.data?.length) return;
  for (const a of r.data) {
    const t = await supabaseClient.from("assignment_transfers").select("*").eq("absence_id", a.id);
    for (const x of t.data || []) {
      await supabaseClient.from("weekly_assignments").update({ qa_member_id: x.original_qa_member_id }).eq("id", x.assignment_id);
    }
    await supabaseClient.from("auditor_absences").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", a.id);
  }
}

function findCurrentQaMember() {
  if (state.isAdmin) return null;
  const n = String(state.allowedUser?.name || "").trim().toLowerCase();
  const em = String(state.user?.email || "").trim().toLowerCase();
  const pre = em.split("@")[0];
  return (
    state.qaMembers.find((m) => String(m.name).trim().toLowerCase() === n) ||
    state.qaMembers.find((m) => String(m.email || "").trim().toLowerCase() === em) ||
    state.qaMembers.find((m) => String(m.name).trim().toLowerCase() === pre) ||
    null
  );
}

function getSetting(id, arr = state.weeklySettings) {
  return arr.find((s) => s.workstream_id === id) || { base_target: 5, extra_if_fail: 2 };
}

function stats(a, settings = state.weeklySettings) {
  const s = getSetting(a.workstream_id, settings);
  const fail = Number(a.fail_count || 0);
  const total = (a.counts || []).reduce((x, c) => x + Number(c.count || 0), 0);
  const target = Number(s.base_target || 0) + (fail >= 1 ? Number(s.extra_if_fail || 0) : 0);
  const left = Math.max(target - total, 0);
  return { failCount: fail, total, target, left, done: total >= target };
}

function dayCount(a, off, week = state.currentWeekStart) {
  const d = addDays(week, off);
  const r = (a.counts || []).find((c) => c.qa_date === d);
  return Number(r?.count || 0);
}

function activeWs() { return state.workstreams.find((w) => w.id === state.activeWorkstreamId) || state.workstreams[0]; }

function visibleAssignments() {
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

function totals(rows = visibleAssignments()) {
  let total = 0, left = 0, fail = 0, done = 0, target = 0;
  for (const row of rows) {
    const s = stats(row);
    total += s.total; left += s.left; fail += s.failCount; target += s.target;
    if (s.done) done++;
  }
  return { total, left, fail, done, agents: rows.length, target };
}

async function loadPersonalMetrics() {
  const qid = state.isAdmin ? null : state.currentQaMember?.id;
  const ranges = { wtd: state.currentWeekStart, mtd: monthStart(), ytd: yearStart() };
  const m = { wtd: 0, mtd: 0, ytd: 0 };
  for (const k of Object.keys(ranges)) {
    let q = supabaseClient.from("qa_count_logs").select("count_delta,performed_by_qa_member_id,qa_date").gte("qa_date", ranges[k]).lte("qa_date", today());
    if (qid) q = q.eq("performed_by_qa_member_id", qid);
    const r = await q;
    if (!r.error) m[k] = (r.data || []).reduce((s, x) => s + Number(x.count_delta || 0), 0);
  }
  state.personalMetrics = m;
}

async function loadHistoryWeeks() {
  const r = await supabaseClient.from("weekly_assignments").select("week_start").order("week_start", { ascending: false });
  if (r.error) return;
  state.historyWeeks = [...new Set((r.data || []).map((x) => x.week_start))].map((week_start) => ({ week_start }));
}

async function loadHistoryRows() {
  if (!state.historyWeek) { state.historyRows = []; state.historySettings = []; return; }
  const [rows, set] = await Promise.all([
    supabaseClient.from("weekly_assignments").select("*").eq("week_start", state.historyWeek),
    supabaseClient.from("weekly_settings").select("*").eq("week_start", state.historyWeek)
  ]);
  if (rows.error || set.error) return;

  let counts = [];
  if ((rows.data || []).length) {
    const ids = rows.data.map((a) => a.id);
    const c = await supabaseClient.from("qa_counts").select("*").in("assignment_id", ids);
    counts = c.data || [];
  }
  const qm = new Map(state.qaMembers.map((x) => [x.id, x]));
  const am = new Map(state.agents.map((x) => [x.id, x]));
  const wm = new Map(state.workstreams.map((x) => [x.id, x]));
  const cb = new Map();
  for (const c of counts) {
    if (!cb.has(c.assignment_id)) cb.set(c.assignment_id, []);
    cb.get(c.assignment_id).push(c);
  }
  state.historyRows = (rows.data || []).map((a) => ({
    ...a,
    qa: qm.get(a.qa_member_id) || null,
    agent: am.get(a.agent_id) || null,
    workstream: wm.get(a.workstream_id) || null,
    counts: cb.get(a.id) || []
  }));
  state.historySettings = set.data || [];
}

// ---------- analytics: trend chart, streaks, fail-rate history ----------

async function loadAnalytics() {
  try {
    const since = addDays(state.currentWeekStart, -7 * (ANALYTICS_WEEKS - 1));
    const [assignRes, settingsRes] = await Promise.all([
      supabaseClient.from("weekly_assignments").select("*").gte("week_start", since).order("week_start"),
      supabaseClient.from("weekly_settings").select("*").gte("week_start", since)
    ]);
    if (assignRes.error || settingsRes.error) { state.analytics = null; return; }

    const rows = assignRes.data || [];
    let counts = [];
    if (rows.length) {
      const ids = rows.map((a) => a.id);
      const c = await supabaseClient.from("qa_counts").select("*").in("assignment_id", ids);
      counts = c.data || [];
    }
    const cb = new Map();
    for (const c of counts) {
      if (!cb.has(c.assignment_id)) cb.set(c.assignment_id, []);
      cb.get(c.assignment_id).push(c);
    }
    state.analytics = {
      rows: rows.map((a) => ({ ...a, counts: cb.get(a.id) || [] })),
      settings: settingsRes.data || []
    };
  } catch (e) {
    console.warn("Analytics load failed", e);
    state.analytics = null;
  }
}

function analyticsWeeks() {
  return [...new Set((state.analytics?.rows || []).map((r) => r.week_start))].sort();
}

// Returns Map<qaMemberId, [{week_start, total, target, hit}]> sorted oldest to newest.
function qaWeeklyTotals() {
  const result = new Map();
  const weeks = analyticsWeeks();
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
function computeStreaksMap() {
  const byQa = qaWeeklyTotals();
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

function agentFailHistory() {
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

function renderTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas || typeof Chart === "undefined" || !state.analytics) return;

  const weeks = analyticsWeeks();
  const labels = weeks.map((w) => fmt(w));
  const byQa = qaWeeklyTotals();
  const qm = new Map(state.qaMembers.map((q) => [q.id, q]));

  let datasets = [];
  if (state.isAdmin) {
    datasets = [...byQa.entries()].map(([qaId, weeksData]) => {
      const map = new Map(weeksData.map((w) => [w.week_start, w.total]));
      const name = qm.get(qaId)?.name || "Unknown";
      return {
        label: name,
        data: weeks.map((w) => map.get(w) ?? 0),
        borderColor: colorFor(name),
        backgroundColor: colorFor(name),
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 5
      };
    });
  } else if (state.currentQaMember) {
    const weeksData = byQa.get(state.currentQaMember.id) || [];
    const map = new Map(weeksData.map((w) => [w.week_start, w.total]));
    datasets = [{
      label: state.currentQaMember.name,
      data: weeks.map((w) => map.get(w) ?? 0),
      borderColor: colorFor(state.currentQaMember.name),
      backgroundColor: colorFor(state.currentQaMember.name),
      tension: 0.35,
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 5
    }];
  }

  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: state.isAdmin, labels: { boxWidth: 12 } } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

// ---------- render ----------

function renderDashboard() {
  const w = activeWs();
  if (!w) return fatal("No workstreams found", "Run supabase-setup-v700.sql and refresh.");
  state.activeWorkstreamId = w.id;

  const rows = visibleAssignments();
  const set = getSetting(w.id);
  const t = totals(rows);
  const isDark = document.body.classList.contains("dark");

  app.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div class="header-content">
          <div class="brand-line">
            <div class="logo-box">${icon("check", 24)}</div>
            <div class="title-block">
              <h1>Weekly QA Counter</h1>
              <p>Week of ${esc(fmt(state.currentWeekStart))} - ${esc(state.user.email)}</p>
            </div>
          </div>
          <div class="header-actions">
            <div class="clock-card"><strong id="liveClock">--:--</strong><span id="liveDate">Loading date</span></div>
            <div class="reminder-card"><strong>Quick reminder</strong><span>${esc(remind())}</span></div>
            <button id="themeBtn" title="Toggle dark mode" aria-label="${isDark ? "Switch to light mode" : "Switch to dark mode"}">${icon(isDark ? "sun" : "moon", 18)}</button>
            <button id="refreshBtn">${icon("refresh", 16)}<span>Refresh</span></button>
            <button class="danger" id="signOutBtn">${icon("logout", 16)}<span>Sign out</span></button>
          </div>
        </div>
        <div class="tabs-row">
          <div class="tabs">${state.workstreams.map((x) => `<button class="tab ${x.id === w.id ? "active" : ""}" data-workstream="${x.id}">${esc(x.name)}</button>`).join("")}</div>
          <div class="role-chip">${state.isAdmin ? "Admin view: all QA data" : `QA view: ${esc(state.currentQaMember?.name || "Not mapped")}`}</div>
        </div>
      </header>

      <section class="stats-grid">
        ${card("done", "Done", t.total, "Current table", "violet")}
        ${card("target", "Target", t.target, "After fails", "fuchsia")}
        ${card("hourglass", "Left", t.left, "Remaining", "cyan")}
        ${card("alert", "Failed", t.fail, "Total failed count", "rose")}
        ${card("users", "Agents", `${t.done}/${t.agents}`, "Complete", "lime")}
        ${card("calendar", "MTD", state.personalMetrics.mtd, "Completed", "blue")}
        ${card("calendarRange", "YTD", state.personalMetrics.ytd, "Completed", "amber")}
      </section>

      <main class="dashboard-grid">
        <div>
          <section class="panel">
            <div class="panel-header">
              <div><h2>${esc(w.name)}</h2><p>${state.isAdmin ? "Showing all assigned agents." : "Showing only your assigned agents."}</p></div>
              <span class="workstream-badge">${esc(w.name)}</span>
            </div>
            <div class="notice">Base target: <strong>${set.base_target}</strong>. If fail count is 1 or more, target becomes <strong>${Number(set.base_target) + Number(set.extra_if_fail)}</strong>.</div>
            ${toolbar()}
            ${table(rows)}
          </section>
          ${history()}
          ${failHistoryPanel()}
        </div>
        <aside class="side-stack">
          ${userNote()}
          ${report()}
          ${streaksPanel()}
          ${trendChartPanel()}
          ${leaveManager()}
          ${settingsPanel(w, set)}
          ${assignmentEditor(w)}
          ${agentManager(w)}
        </aside>
      </main>

      <footer class="footer">
        <span>Weekly QA Counter v1000.</span>
        <span>No ticket/customer data should be stored here.</span>
      </footer>
    </div>
    <div id="toastHost" class="toast-host"></div>
  `;

  bind();
  updateClock();
  renderTrendChart();
  animateStatCards();
}

function card(iconName, label, value, sub, colorKey = "violet") {
  const numeric = typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value));
  const valueAttrs = numeric ? ` data-animate="true" data-value="${esc(value)}"` : "";
  return `<div class="stat-card"><div class="stat-icon c-${colorKey}">${icon(iconName, 18)}</div><div class="stat-label">${esc(label)}</div><div class="stat-value"${valueAttrs}>${numeric ? "0" : esc(value)}</div><div class="stat-sub">${esc(sub)}</div></div>`;
}

function userNote() {
  if (state.isAdmin) return "";
  return `<section class="side-section user-only-note"><h3>Your workspace</h3><p>You are seeing only agents assigned to <strong>${esc(state.currentQaMember?.name || "your QA profile")}</strong>.</p></section>`;
}

function toolbar() {
  return `<div class="table-toolbar">
    <div class="toolbar-left">
      <input class="search-input" id="searchBox" placeholder="Search agent or QA..." value="${esc(state.searchTerm)}">
      <select id="qaFilter" class="${state.isAdmin ? "" : "admin-only"}">
        <option value="all">All QAs</option>
        ${state.qaMembers.map((q) => `<option value="${q.id}" ${state.qaFilter === q.id ? "selected" : ""}>${esc(q.name)}</option>`).join("")}
      </select>
    </div>
    <div class="toolbar-left admin-only"><button class="secondary" id="shuffleBtn">Shuffle this week</button></div>
  </div>`;
}

function table(rows) {
  if (!rows.length) return `<div class="empty-state"><strong>No assigned agents found</strong>Check selected workstream, search, or admin assignments.</div>`;
  return `<div class="table-wrap"><table class="qa-table">
    <thead><tr><th>Agent</th><th>QA</th>${DAYS.map((d) => `<th>${d[0]}</th>`).join("")}<th>Total</th><th>Fail</th><th>Target</th><th>Left</th><th>Status</th></tr></thead>
    <tbody>${rows.map((a) => {
      const s = stats(a);
      const cls = s.done ? "status-done" : s.left <= 2 ? "status-risk" : "status-pending";
      const txt = s.done ? "Done" : s.left <= 2 ? "Almost" : "Pending";
      return `<tr class="${s.done ? "done" : ""}">
        <td class="name-cell">${esc(a.agent?.name)}<span class="agent-sub">${esc(a.workstream?.name || "")}</span></td>
        <td>${qaBadge(a.qa?.name)}</td>
        ${DAYS.map((d) => `<td class="day-col"><div class="count-control">
          <button type="button" class="small secondary js-action" data-action="dec-count" data-assignment="${a.id}" data-date="${addDays(state.currentWeekStart, d[1])}">-</button>
          <span class="count-number">${dayCount(a, d[1])}</span>
          <button type="button" class="small js-action" data-action="inc-count" data-assignment="${a.id}" data-date="${addDays(state.currentWeekStart, d[1])}">+</button>
        </div></td>`).join("")}
        <td class="metric-strong">${s.total}</td>
        <td>${failSelector(a.id, s.failCount)}</td>
        <td class="metric-strong">${s.target}</td>
        <td class="metric-strong">${s.left}</td>
        <td><span class="status-pill ${cls}">${txt}</span></td>
      </tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

function failSelector(id, fail) {
  const active = Number(fail || 0) >= 3 ? 3 : Number(fail || 0);
  return `<div class="fail-selector">${[0, 1, 2, 3].map((v) => `<button type="button" class="small secondary fail-choice js-action ${v === active ? "active" : ""}" data-action="set-fail" data-assignment="${id}" data-fail-value="${v}">${v === 3 ? "3+" : v}</button>`).join("")}</div>`;
}

function report() {
  const rows = visibleAssignments();
  const t = totals(rows);
  return `<section class="side-section"><h3>Weekly report</h3><p>${state.isAdmin ? "Admin summary for selected view." : "Your weekly summary."}</p><div class="mini-card report-card"><div><strong>${state.isAdmin ? "Selected view" : esc(state.currentQaMember?.name || "Your QA")}</strong><span>${t.done}/${t.agents} agents done - ${t.fail} total fails - ${t.left} left</span></div><div class="report-number">${t.total}</div></div></section>`;
}

function streaksPanel() {
  if (!state.analytics) return "";
  const streaks = computeStreaksMap();
  const qm = new Map(state.qaMembers.map((q) => [q.id, q]));
  let rows = [];
  if (state.isAdmin) {
    rows = [...streaks.entries()].map(([qaId, n]) => ({ name: qm.get(qaId)?.name || "Unknown", streak: n })).sort((a, b) => b.streak - a.streak);
  } else if (state.currentQaMember) {
    rows = [{ name: state.currentQaMember.name, streak: streaks.get(state.currentQaMember.id) || 0 }];
  }
  if (!rows.length) return "";
  return `<section class="side-section">
    <h3>${icon("flame")}Target streaks</h3>
    <p>Consecutive completed weeks hitting target.</p>
    <div class="streak-list">${rows.map((r) => `<div class="streak-row"><span>${esc(r.name)}</span><strong class="${r.streak > 0 ? "streak-on" : ""}">${r.streak > 0 ? `${icon("flame", 14)} ${r.streak} ${r.streak === 1 ? "week" : "weeks"}` : "—"}</strong></div>`).join("")}</div>
  </section>`;
}

function trendChartPanel() {
  return `<section class="side-section">
    <h3>${icon("trend")}Weekly trend</h3>
    <p>Total completed count, last ${ANALYTICS_WEEKS} weeks.</p>
    <div style="height:220px"><canvas id="trendChart"></canvas></div>
  </section>`;
}

function failHistoryPanel() {
  const rows = agentFailHistory();
  if (!rows.length) return "";
  return `<section class="panel">
    <div class="panel-header"><div><h2>${icon("alert", 20)}Fail-rate history</h2><p>Based on the last ${ANALYTICS_WEEKS} weeks of data.</p></div></div>
    <div class="table-wrap"><table class="qa-table">
      <thead><tr><th>Agent</th><th>Weeks tracked</th><th>Weeks w/ fail</th><th>Fail rate</th></tr></thead>
      <tbody>${rows.map((r) => `<tr>
        <td class="name-cell">${esc(r.agent.name)}</td>
        <td class="metric-strong">${r.weeks}</td>
        <td class="metric-strong">${r.failedWeeks}</td>
        <td><span class="status-pill ${r.rate >= 50 ? "status-risk" : r.rate > 0 ? "status-pending" : "status-done"}">${r.rate}%</span></td>
      </tr>`).join("")}</tbody>
    </table></div>
  </section>`;
}

function leaveManager() {
  if (!state.isAdmin) return "";
  const active = state.absences || [];
  return `<section class="side-section admin-only">
    <h3>Vacation / PTO / Sick</h3>
    <p>Move an auditor's current assigned agents to the other auditor until return date. Existing counts stay with the agent.</p>
    <div class="leave-list">${state.qaMembers.map((q) => {
      const ab = active.find((a) => a.qa_member_id === q.id);
      return `<div class="mini-card"><strong>${esc(q.name)}</strong>${ab
        ? `<span class="leave-pill">${esc(ab.leave_type)} until ${esc(fmt(ab.return_date))}</span><button type="button" class="secondary js-action" data-action="cancel-absence" data-absence="${ab.id}">Restore / cancel leave</button>`
        : `<div class="side-form"><select class="leave-type" data-qa="${q.id}"><option>Vacation</option><option>PTO</option><option>Sick</option></select><input type="date" class="leave-return" data-qa="${q.id}" min="${addDays(today(), 1)}"><button type="button" class="js-action" data-action="apply-absence" data-qa="${q.id}">Apply leave</button></div>`
      }</div>`;
    }).join("")}</div>
  </section>`;
}

function settingsPanel(w, set) {
  if (!state.isAdmin) return "";
  return `<section class="side-section admin-only">
    <h3>Weekly settings</h3>
    <form id="settingsForm" class="side-form">
      <label>Weekly QA target<input id="baseTarget" type="number" min="0" value="${esc(set.base_target)}"></label>
      <label>Extra QA if 1+ fail<input id="extraIfFail" type="number" min="0" value="${esc(set.extra_if_fail)}"></label>
      <button>Save settings</button>
    </form>
  </section>`;
}

function assignmentEditor(w) {
  if (!state.isAdmin) return "";
  const assigned = new Set(state.assignments.filter((a) => a.workstream_id === w.id).map((a) => a.agent_id));
  const agents = state.agents.filter((a) => a.workstream_id === w.id);
  const un = agents.filter((a) => !assigned.has(a.id)).map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("");
  const rows = state.assignments.filter((a) => a.workstream_id === w.id).map((a) => `<div class="mini-card"><div class="mini-card-row"><div><strong>${esc(a.agent?.name)}</strong><span>Assigned to ${esc(a.qa?.name)}</span></div><select class="js-change-qa" data-assignment="${a.id}">${state.qaMembers.map((q) => `<option value="${q.id}" ${q.id === a.qa_member_id ? "selected" : ""}>${esc(q.name)}</option>`).join("")}</select></div></div>`).join("");
  return `<section class="side-section admin-only">
    <h3>Assignments</h3>
    <form id="assignForm" class="side-form">
      <label>Agent<select id="assignAgent"><option value="">Select unassigned agent</option>${un}</select></label>
      <label>QA<select id="assignQa">${state.qaMembers.map((q) => `<option value="${q.id}">${esc(q.name)}</option>`).join("")}</select></label>
      <button>Assign agent</button>
    </form>
    <div class="assign-list" style="margin-top:12px">${rows}</div>
  </section>`;
}

function agentManager(w) {
  if (!state.isAdmin) return "";
  return `<section class="side-section admin-only">
    <h3>Agents</h3>
    <form id="addAgentForm" class="side-form"><label>New agent name<input id="newAgentName" placeholder="Example: Sagar"></label><button>Add agent</button></form>
    <div class="agent-list" style="margin-top:12px">${state.agents.filter((a) => a.workstream_id === w.id).map((a) => `<div class="mini-card"><div class="mini-card-row"><div><strong>${esc(a.name)}</strong><span>${esc(w.name)}</span></div><button type="button" class="small secondary js-action" data-action="toggle-agent" data-agent="${a.id}">Hide</button></div></div>`).join("")}</div>
  </section>`;
}

function history() {
  const rows = state.historyRows
    .filter((r) => r.workstream_id === state.activeWorkstreamId)
    .filter((r) => state.isAdmin || !state.currentQaMember || r.qa_member_id === state.currentQaMember.id);
  let total = 0, target = 0, fail = 0, done = 0;
  for (const r of rows) {
    const s = stats(r, state.historySettings);
    total += s.total; target += s.target; fail += s.failCount;
    if (s.done) done++;
  }
  return `<section class="panel">
    <div class="panel-header"><div><h2>${icon("calendarRange", 20)}Previous week summary</h2><p>Select any saved week and review the final summary below the live tracker.</p></div></div>
    <div class="history-grid">
      <div class="side-section"><h3>Choose week</h3><select id="historyWeekSelect">${state.historyWeeks.map((w) => `<option value="${w.week_start}" ${state.historyWeek === w.week_start ? "selected" : ""}>Week of ${esc(fmt(w.week_start))}</option>`).join("")}</select></div>
      <div>
        <div class="history-summary">
          <div class="history-card"><span>Completed</span><strong>${total}</strong></div>
          <div class="history-card"><span>Target</span><strong>${target}</strong></div>
          <div class="history-card"><span>Total failed</span><strong>${fail}</strong></div>
          <div class="history-card"><span>Agents done</span><strong>${done}/${rows.length}</strong></div>
        </div>
        ${historyTable(rows)}
      </div>
    </div>
  </section>`;
}

function historyTable(rows) {
  if (!rows.length) return `<div class="empty-state"><strong>No previous data found</strong>Select another week or wait until weekly data is saved.</div>`;
  return `<div class="table-wrap"><table class="qa-table">
    <thead><tr><th>Agent</th><th>QA</th><th>Total</th><th>Fail</th><th>Target</th><th>Left</th><th>Status</th></tr></thead>
    <tbody>${rows.map((r) => {
      const s = stats(r, state.historySettings);
      return `<tr class="${s.done ? "done" : ""}"><td class="name-cell">${esc(r.agent?.name)}<span class="agent-sub">${esc(r.workstream?.name || "")}</span></td><td>${qaBadge(r.qa?.name)}</td><td class="metric-strong">${s.total}</td><td class="metric-strong">${s.failCount}</td><td class="metric-strong">${s.target}</td><td class="metric-strong">${s.left}</td><td><span class="status-pill ${s.done ? "status-done" : "status-pending"}">${s.done ? "Done" : "Pending"}</span></td></tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

// ---------- events ----------

function bind() {
  document.getElementById("signOutBtn")?.addEventListener("click", signOut);
  document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
  document.getElementById("refreshBtn")?.addEventListener("click", async () => {
    await refreshData(true);
    await loadHistoryWeeks();
    await loadHistoryRows();
    await loadPersonalMetrics();
    await loadAnalytics();
    renderDashboard();
  });
  document.getElementById("shuffleBtn")?.addEventListener("click", shuffleThisWeek);
  document.querySelectorAll("[data-workstream]").forEach((b) => b.addEventListener("click", () => {
    state.activeWorkstreamId = b.dataset.workstream;
    state.searchTerm = "";
    state.qaFilter = "all";
    renderDashboard();
  }));
  app.querySelectorAll(".js-action").forEach((b) => b.addEventListener("click", handleActionClick));
  app.querySelectorAll(".js-change-qa").forEach((s) => s.addEventListener("change", handleActionChange));
  document.getElementById("settingsForm")?.addEventListener("submit", saveSettings);
  document.getElementById("assignForm")?.addEventListener("submit", assignAgent);
  document.getElementById("addAgentForm")?.addEventListener("submit", addAgent);
  document.getElementById("searchBox")?.addEventListener("input", (e) => { state.searchTerm = e.target.value; renderDashboard(); });
  document.getElementById("qaFilter")?.addEventListener("change", (e) => { state.qaFilter = e.target.value; renderDashboard(); });
  document.getElementById("historyWeekSelect")?.addEventListener("change", async (e) => {
    state.historyWeek = e.target.value;
    await loadHistoryRows();
    renderDashboard();
  });
}

async function handleActionClick(e) {
  const b = e.currentTarget;
  const a = b.dataset.action;
  const id = b.dataset.assignment;
  b.disabled = true;
  try {
    if (a === "inc-count" || a === "dec-count") await changeDailyCount(id, b.dataset.date, a === "inc-count" ? 1 : -1);
    if (a === "set-fail") await setFailCount(id, Number(b.dataset.failValue || 0));
    if (a === "toggle-agent" && confirm("Hide this agent?")) {
      const r = await supabaseClient.from("agents").update({ is_active: false }).eq("id", b.dataset.agent);
      if (r.error) alert(r.error.message);
      await refreshData(false);
      await loadAnalytics();
      renderDashboard();
    }
    if (a === "apply-absence") {
      const card = b.closest(".mini-card");
      await applyAbsence(b.dataset.qa, card.querySelector(".leave-type")?.value, card.querySelector(".leave-return")?.value);
    }
    if (a === "cancel-absence") await cancelAbsence(b.dataset.absence);
  } finally {
    b.disabled = false;
  }
}

async function handleActionChange(e) {
  const r = await supabaseClient.from("weekly_assignments").update({ qa_member_id: e.currentTarget.value }).eq("id", e.currentTarget.dataset.assignment);
  if (r.error) alert(r.error.message);
  await refreshData(false);
  await loadAnalytics();
  renderDashboard();
}

async function changeDailyCount(id, date, delta) {
  const a = state.assignments.find((x) => x.id === id);
  if (!a) return;
  const performer = state.isAdmin ? a.qa_member_id : state.currentQaMember?.id;
  if (!performer) return alert("Could not identify QA member.");

  const before = stats(a);

  const existing = await supabaseClient.from("qa_counts").select("*").eq("assignment_id", id).eq("qa_date", date).maybeSingle();
  if (existing.error) return alert(existing.error.message);
  const cur = Number(existing.data?.count || 0);
  const next = Math.max(cur + delta, 0);
  const applied = next - cur;
  if (applied === 0) return;

  if (existing.data) {
    const r = await supabaseClient.from("qa_counts").update({ count: next, updated_at: new Date().toISOString() }).eq("id", existing.data.id);
    if (r.error) return alert(r.error.message);
  } else {
    const r = await supabaseClient.from("qa_counts").insert({ assignment_id: id, qa_date: date, count: next });
    if (r.error) return alert(r.error.message);
  }
  await supabaseClient.from("qa_count_logs").insert({ assignment_id: id, qa_date: date, performed_by_qa_member_id: performer, count_delta: applied });

  const local = a.counts.find((c) => c.qa_date === date);
  if (local) local.count = next; else a.counts.push({ assignment_id: id, qa_date: date, count: next });

  const analyticsRow = state.analytics?.rows.find((x) => x.id === id);
  if (analyticsRow) {
    const localA = analyticsRow.counts.find((c) => c.qa_date === date);
    if (localA) localA.count = next; else analyticsRow.counts.push({ assignment_id: id, qa_date: date, count: next });
  }

  const after = stats(a);
  if (!before.done && after.done) { fireConfetti(); showToast(`${a.agent?.name || "Agent"} hit target this week`); }

  await loadPersonalMetrics();
  renderDashboard();
}

async function setFailCount(id, value) {
  const a = state.assignments.find((x) => x.id === id);
  const before = a ? stats(a) : null;
  const clean = Math.max(Number(value || 0), 0);

  const r = await supabaseClient.from("weekly_assignments").update({ fail_count: clean }).eq("id", id);
  if (r.error) return alert("Fail update error: " + r.error.message);

  if (a) a.fail_count = clean;
  const analyticsRow = state.analytics?.rows.find((x) => x.id === id);
  if (analyticsRow) analyticsRow.fail_count = clean;

  if (a && before) {
    const after = stats(a);
    if (!before.done && after.done) { fireConfetti(); showToast(`${a.agent?.name || "Agent"} hit target this week`); }
  }
  renderDashboard();
}

async function saveSettings(e) {
  e.preventDefault();
  const set = getSetting(state.activeWorkstreamId);
  const base = Number(document.getElementById("baseTarget").value || 0);
  const extra = Number(document.getElementById("extraIfFail").value || 0);
  const r = set.id
    ? await supabaseClient.from("weekly_settings").update({ base_target: base, extra_if_fail: extra }).eq("id", set.id)
    : await supabaseClient.from("weekly_settings").insert({ week_start: state.currentWeekStart, workstream_id: state.activeWorkstreamId, base_target: base, extra_if_fail: extra });
  if (r.error) alert(r.error.message);
  await refreshData(false);
  await loadAnalytics();
  renderDashboard();
}

async function assignAgent(e) {
  e.preventDefault();
  const agent_id = document.getElementById("assignAgent").value;
  const qa_member_id = document.getElementById("assignQa").value;
  if (!agent_id || !qa_member_id) return;
  const r = await supabaseClient.from("weekly_assignments").insert({ week_start: state.currentWeekStart, agent_id, qa_member_id, workstream_id: state.activeWorkstreamId, fail_count: 0 });
  if (r.error) alert(r.error.message);
  await refreshData(false);
  await loadAnalytics();
  renderDashboard();
}

async function addAgent(e) {
  e.preventDefault();
  const name = document.getElementById("newAgentName").value.trim();
  if (!name) return;
  const r = await supabaseClient.from("agents").insert({ name, workstream_id: state.activeWorkstreamId, is_active: true });
  if (r.error) alert(r.error.message);
  await refreshData(false);
  renderDashboard();
}

async function applyAbsence(qa, leave, ret) {
  if (!qa || !leave || !ret) return alert("Select leave type and return date.");
  if (ret <= today()) return alert("Return date must be after today.");
  const cover = state.qaMembers.find((q) => q.id !== qa && !state.absences.some((ab) => ab.qa_member_id === q.id));
  if (!cover) return alert("No other available auditor found to cover this leave.");
  const ins = await supabaseClient.from("auditor_absences").insert({ qa_member_id: qa, covering_qa_member_id: cover.id, leave_type: leave, start_date: today(), return_date: ret, status: "active" }).select().single();
  if (ins.error) return alert(ins.error.message);
  for (const a of state.assignments.filter((x) => x.qa_member_id === qa)) {
    await supabaseClient.from("assignment_transfers").insert({ absence_id: ins.data.id, assignment_id: a.id, original_qa_member_id: qa, covering_qa_member_id: cover.id });
    await supabaseClient.from("weekly_assignments").update({ qa_member_id: cover.id }).eq("id", a.id);
  }
  await refreshData(false);
  await loadAnalytics();
  renderDashboard();
}

async function cancelAbsence(id) {
  if (!confirm("Restore transferred agents?")) return;
  const t = await supabaseClient.from("assignment_transfers").select("*").eq("absence_id", id);
  for (const x of t.data || []) {
    await supabaseClient.from("weekly_assignments").update({ qa_member_id: x.original_qa_member_id }).eq("id", x.assignment_id);
  }
  await supabaseClient.from("auditor_absences").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id);
  await refreshData(false);
  await loadAnalytics();
  renderDashboard();
}

async function shuffleThisWeek() {
  if (!confirm("This removes current week assignments and counts, then shuffles active agents again. Continue?")) return;
  const ids = state.assignments.map((a) => a.id);
  if (ids.length) await supabaseClient.from("weekly_assignments").delete().in("id", ids);
  await ensureCurrentWeekExists();
  await refreshData(false);
  await loadAnalytics();
  renderDashboard();
}

function updateClock() {
  const c = document.getElementById("liveClock");
  const d = document.getElementById("liveDate");
  if (!c || !d) return;
  const n = new Date();
  c.textContent = n.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  d.textContent = n.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function subscribeRealtime() {
  try {
    supabaseClient.channel("qa-counter-v1000")
      .on("postgres_changes", { event: "*", schema: "public", table: "weekly_assignments" }, async () => { await refreshData(false); await loadAnalytics(); renderDashboard(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "qa_counts" }, async () => { await refreshData(false); await loadPersonalMetrics(); await loadAnalytics(); renderDashboard(); })
      .subscribe();
  } catch (e) {
    console.warn("Realtime disabled", e);
  }
}

init();
