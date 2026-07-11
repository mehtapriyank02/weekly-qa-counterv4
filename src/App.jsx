import { AppDataProvider, useAppData } from "./context/AppDataContext";
import LoadingScreen from "./components/shared/LoadingScreen";
import FatalScreen from "./components/shared/FatalScreen";
import Login from "./components/Login/Login";
import Shell from "./components/Shell/Shell";

function AppInner() {
  const { state } = useAppData();
  if (state.status === "loading") return <LoadingScreen />;
  if (state.status === "login") return <Login />;
  if (state.status === "fatal") return <FatalScreen title={state.fatal?.title} msg={state.fatal?.msg} detail={state.fatal?.detail} />;
  return <Shell />;
}

export default function App() {
  return (
    <AppDataProvider>
      <AppInner />
    </AppDataProvider>
  );
}
