import { useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import Logo from "../shared/Logo";
import s from "../shared/AuthScreen.module.css";

export default function Login() {
  const { signIn } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const r = await signIn(email.trim(), password);
    setBusy(false);
    if (r?.error) setError(r.error);
  }

  return (
    <div className={s.wrap}>
      <div className={s.glow} />
      <div className={s.card}>
        <div className={s.logoRow}><Logo size="lg" /></div>
        <h1>Welcome back</h1>
        <p>Sign in to view your assigned agents and weekly QA progress.</p>
        {error ? <div className={s.errorBox}>{error}</div> : null}
        <form className={s.form} onSubmit={onSubmit}>
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
