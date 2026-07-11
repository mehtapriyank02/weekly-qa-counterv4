// Pure helpers ported from the original app.js — same math/behavior, no UI.

export const DAYS = [["Mon", 0], ["Tue", 1], ["Wed", 2], ["Thu", 3], ["Fri", 4]];

export const REMINDERS = [
  "Drink water and take a quick stretch break.",
  "Keep notes short, clear, and audit-friendly.",
  "Double-check fail logic before marking the row done.",
  "Take a 2-minute eye break after a long QA block.",
  "Update counts daily so Friday stays light.",
];

// How many past weeks (including the current one) feed the trend chart,
// streaks, and fail-rate history. Bump this up for a longer lookback.
export const ANALYTICS_WEEKS = 12;

// Muted/desaturated palette to match the neutral design system while still
// giving each person a stable, distinguishable color.
export const AVATAR_COLORS = ["#5b6f8c", "#8c5b6f", "#5b8c72", "#8c7a5b", "#6f5b8c", "#5b7c8c", "#8c5b5b", "#6b8c5b"];

export function dateOnly(d) {
  d = new Date(d);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
export function today() { return dateOnly(new Date()); }
export function getMonday(d) {
  d = new Date(d);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return dateOnly(d);
}
export function addDays(s, n) {
  const d = new Date(`${s}T00:00:00`);
  d.setDate(d.getDate() + n);
  return dateOnly(d);
}
export function fmt(s) {
  return new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
export function monthStart() { const d = new Date(); return dateOnly(new Date(d.getFullYear(), d.getMonth(), 1)); }
export function yearStart() { const d = new Date(); return dateOnly(new Date(d.getFullYear(), 0, 1)); }

export function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}
export function seededSort(arr, seed) {
  return [...arr].sort((a, b) => hash(`${seed}:${a.id || a.name}`) - hash(`${seed}:${b.id || b.name}`));
}
export function remind() { return REMINDERS[hash(today()) % REMINDERS.length]; }

export function colorFor(name) {
  return AVATAR_COLORS[hash(String(name || "")) % AVATAR_COLORS.length];
}
export function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export function timeout(p, label, ms = 12000) {
  return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(label + " timed out")), ms))]);
}

export function getSetting(id, arr) {
  return arr.find((s) => s.workstream_id === id) || { base_target: 5, extra_if_fail: 2 };
}

export function stats(a, settings) {
  const s = getSetting(a.workstream_id, settings);
  const fail = Number(a.fail_count || 0);
  const total = (a.counts || []).reduce((x, c) => x + Number(c.count || 0), 0);
  const target = Number(s.base_target || 0) + (fail >= 1 ? Number(s.extra_if_fail || 0) : 0);
  const left = Math.max(target - total, 0);
  return { failCount: fail, total, target, left, done: total >= target };
}

export function dayCount(a, off, weekStart) {
  const d = addDays(weekStart, off);
  const r = (a.counts || []).find((c) => c.qa_date === d);
  return Number(r?.count || 0);
}
