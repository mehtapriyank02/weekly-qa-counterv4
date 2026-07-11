import { useEffect, useMemo, useRef, useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import { activeAgents } from "../../lib/selectors";
import Icon from "../shared/Icon";
import s from "./CommandPalette.module.css";

export default function CommandPalette() {
  const {
    state, setActiveSection, setActiveWorkstreamId, setSearchTerm, setQaFilter,
    exportCurrentWeek, toggleTheme, signOut, scrollToAuditors,
  } = useAppData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpenEvent() { setOpen(true); }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("command-palette:open", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("command-palette:open", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo(() => {
    const list = [];
    const nav = (id, label, icon) => list.push({ id, label, icon, section: "Navigate", run: () => setActiveSection(id) });
    nav("home", "Go to Home", "check");
    nav("reports", "Go to Reports", "trend");
    if (state.isAdmin) nav("manage", "Go to Manage", "settings");

    list.push({ id: "auditors", label: "Meet our Auditors", icon: "users", section: "Navigate", run: () => scrollToAuditors() });
    list.push({ id: "download", label: "Download this week as CSV", icon: "calendar", section: "Actions", run: () => exportCurrentWeek() });
    list.push({ id: "theme", label: "Toggle theme", icon: "sun", section: "Actions", run: () => toggleTheme() });
    list.push({ id: "signout", label: "Sign out", icon: "logout", section: "Actions", run: () => signOut() });

    for (const w of state.workstreams) {
      list.push({
        id: `ws-${w.id}`, label: w.name, icon: "layers", section: "Workstreams",
        run: () => { setActiveWorkstreamId(w.id); setActiveSection("dashboard"); },
      });
    }

    if (state.isAdmin) {
      for (const a of activeAgents(state)) {
        list.push({
          id: `agent-${a.id}`, label: a.name, icon: "check", section: "Agents",
          run: () => { setActiveWorkstreamId(a.workstream_id); setActiveSection("dashboard"); setSearchTerm(a.name); },
        });
      }
      for (const q of state.qaMembers) {
        list.push({
          id: `qa-${q.id}`, label: q.name, icon: "users", section: "QA members",
          run: () => { setActiveSection("dashboard"); setQaFilter(q.id); },
        });
      }
    }
    return list;
  }, [state, setActiveSection, setActiveWorkstreamId, setSearchTerm, setQaFilter, exportCurrentWeek, toggleTheme, signOut, scrollToAuditors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q) || it.section.toLowerCase().includes(q));
  }, [items, query]);

  function run(item) {
    item.run();
    setOpen(false);
  }

  function onInputKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[activeIndex]) run(filtered[activeIndex]); }
  }

  if (!open) return null;

  let lastSection = null;

  return (
    <div className={s.backdrop} onClick={() => setOpen(false)}>
      <div className={s.panel} onClick={(e) => e.stopPropagation()}>
        <div className={s.inputRow}>
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            className={s.input}
            placeholder="Jump to a page, workstream, agent..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={onInputKeyDown}
          />
          <span className={s.hint}>Esc</span>
        </div>
        <div className={s.list}>
          {!filtered.length && <div className={s.empty}>No matches</div>}
          {filtered.map((it, i) => {
            const showSection = it.section !== lastSection;
            lastSection = it.section;
            return (
              <div key={it.id}>
                {showSection && <div className={s.sectionLabel}>{it.section}</div>}
                <button
                  type="button"
                  className={`${s.item} ${i === activeIndex ? s.active : ""}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => run(it)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Icon name={it.icon} size={14} />
                    {it.label}
                  </span>
                  {i === activeIndex && <span className={s.itemKey}>Enter ↵</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
