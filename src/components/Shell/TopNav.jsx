import { useEffect, useRef, useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import Icon from "../shared/Icon";
import Logo from "../shared/Logo";
import s from "./TopNav.module.css";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function TopNav() {
  const {
    state, signOut, toggleTheme, manualRefresh,
    setActiveWorkstreamId, setActiveSection, scrollToAuditors, exportCurrentWeek,
  } = useAppData();
  const [wsOpen, setWsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef(null);
  const now = useClock();

  const isDark = state.theme !== "light";

  function openWs() {
    clearTimeout(closeTimer.current);
    setWsOpen(true);
  }
  function scheduleCloseWs() {
    closeTimer.current = setTimeout(() => setWsOpen(false), 150);
  }

  function pickWorkstream(id) {
    setActiveWorkstreamId(id);
    setActiveSection("dashboard");
    setWsOpen(false);
    setMobileOpen(false);
  }

  function goHome() {
    setActiveSection("home");
    setMobileOpen(false);
  }

  function onMeetAuditors() {
    setMobileOpen(false);
    if (state.activeSection === "home") {
      document.getElementById("auditors")?.scrollIntoView({ behavior: "smooth" });
    } else {
      scrollToAuditors();
    }
  }

  function onDownload() {
    setMobileOpen(false);
    exportCurrentWeek();
  }

  return (
    <nav className={s.nav}>
      <div className={s.inner}>
        <button type="button" className={s.logoBtn} onClick={goHome} aria-label="Verity home">
          <Logo />
        </button>

        <div className={s.menu}>
          <div className={s.menuItem} onMouseEnter={openWs} onMouseLeave={scheduleCloseWs}>
            <button
              type="button"
              className={`${s.menuBtn} ${wsOpen || state.activeSection === "dashboard" ? s.active : ""}`}
              onClick={() => setWsOpen((v) => !v)}
            >
              Workstream <Icon name="chevronDown" size={13} />
            </button>
            {wsOpen && (
              <div className={s.dropdown}>
                {state.workstreams.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={`${s.dropdownItem} ${w.id === state.activeWorkstreamId && state.activeSection === "dashboard" ? s.active : ""}`}
                    onClick={() => pickWorkstream(w.id)}
                  >
                    {w.name}
                    {w.id === state.activeWorkstreamId && state.activeSection === "dashboard" ? <Icon name="check" size={14} /> : null}
                  </button>
                ))}
                {!state.workstreams.length && <div style={{ padding: "9px 10px", fontSize: 13, color: "var(--muted)" }}>No workstreams yet</div>}
              </div>
            )}
          </div>

          <button type="button" className={`${s.menuBtn} ${state.activeSection === "home" ? s.active : ""}`} onClick={onMeetAuditors}>
            Meet our Auditors
          </button>

          <button type="button" className={s.menuBtn} onClick={onDownload}>
            Download
          </button>

          <button type="button" className={`${s.menuBtn} ${state.activeSection === "reports" ? s.active : ""}`} onClick={() => setActiveSection("reports")}>
            Reports
          </button>

          {state.isAdmin && (
            <button type="button" className={`${s.menuBtn} ${state.activeSection === "manage" ? s.active : ""}`} onClick={() => setActiveSection("manage")}>
              Manage
            </button>
          )}
        </div>

        <div className={s.right}>
          <button
            type="button"
            className={s.searchBtn}
            onClick={() => window.dispatchEvent(new CustomEvent("command-palette:open"))}
          >
            <Icon name="search" size={13} /> Search <span className={s.kbd}>{navigator.platform?.includes("Mac") ? "⌘K" : "Ctrl K"}</span>
          </button>
          <span className={s.clock}>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span className={s.roleChip}>{state.isAdmin ? "Admin" : `QA: ${state.currentQaMember?.name || "Not mapped"}`}</span>
          <button type="button" className={s.iconBtn} title="Toggle theme" aria-label="Toggle theme" onClick={toggleTheme}>
            <Icon name={isDark ? "sun" : "moon"} size={16} />
          </button>
          <button type="button" className={s.iconBtn} title="Refresh" aria-label="Refresh" onClick={() => manualRefresh()}>
            <Icon name="refresh" size={16} />
          </button>
          <button type="button" className={s.iconBtn} title="Sign out" aria-label="Sign out" onClick={signOut}>
            <Icon name="logout" size={16} />
          </button>
        </div>

        <button type="button" className={s.burger} aria-label="Open menu" onClick={() => setMobileOpen((v) => !v)}>
          <Icon name={mobileOpen ? "x" : "layers"} size={18} />
        </button>
      </div>

      {mobileOpen && (
        <div className={s.mobilePanel}>
          <button type="button" className={s.mobileLink} onClick={goHome}>Home</button>
          <button type="button" className={s.mobileLink} onClick={() => setWsOpen((v) => !v)}>
            Workstream <Icon name="chevronDown" size={14} />
          </button>
          {wsOpen && (
            <div className={s.mobileSub}>
              {state.workstreams.map((w) => (
                <button key={w.id} type="button" onClick={() => pickWorkstream(w.id)}>{w.name}</button>
              ))}
            </div>
          )}
          <button type="button" className={s.mobileLink} onClick={onMeetAuditors}>Meet our Auditors</button>
          <button type="button" className={s.mobileLink} onClick={onDownload}>Download</button>
          <button type="button" className={s.mobileLink} onClick={() => { setActiveSection("reports"); setMobileOpen(false); }}>Reports</button>
          {state.isAdmin && (
            <button type="button" className={s.mobileLink} onClick={() => { setActiveSection("manage"); setMobileOpen(false); }}>Manage</button>
          )}
          <div className={s.mobileUtils}>
            <button type="button" className="secondary small" onClick={toggleTheme}><Icon name={isDark ? "sun" : "moon"} size={14} /> Theme</button>
            <button type="button" className="secondary small" onClick={() => manualRefresh()}><Icon name="refresh" size={14} /> Refresh</button>
            <button type="button" className="secondary small" onClick={signOut}><Icon name="logout" size={14} /> Sign out</button>
          </div>
        </div>
      )}
    </nav>
  );
}
