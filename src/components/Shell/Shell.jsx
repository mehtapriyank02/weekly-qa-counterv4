import { lazy, Suspense } from "react";
import { useAppData } from "../../context/AppDataContext";
import TopNav from "./TopNav";
import CommandPalette from "./CommandPalette";
import ToastHost from "../shared/ToastHost";
import PanelFallback from "../shared/PanelFallback";
import Home from "../Home/Home";
import Dashboard from "../Dashboard/Dashboard";
import Reports from "../Reports/Reports";
import s from "./Shell.module.css";

const Manage = lazy(() => import("../Manage/Manage"));

export default function Shell() {
  const { state } = useAppData();

  return (
    <div>
      <TopNav />
      <div key={state.activeSection} className={s.transition}>
        {state.activeSection === "home" ? (
          <Home />
        ) : (
          <div className={s.page}>
            {state.activeSection === "dashboard" && <Dashboard />}
            {state.activeSection === "reports" && <Reports />}
            {state.activeSection === "manage" && state.isAdmin && (
              <Suspense fallback={<PanelFallback height={400} />}>
                <Manage />
              </Suspense>
            )}
          </div>
        )}
      </div>
      <ToastHost />
      <CommandPalette />
    </div>
  );
}
