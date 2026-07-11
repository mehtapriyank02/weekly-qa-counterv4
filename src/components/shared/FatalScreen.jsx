import Icon from "./Icon";
import s from "./AuthScreen.module.css";

export default function FatalScreen({ title, msg, detail }) {
  return (
    <div className={s.wrap}>
      <div className={s.glow} />
      <div className={s.card}>
        <div className={`${s.mark} ${s.alert}`}><Icon name="alert" size={22} /></div>
        <h1>{title}</h1>
        <p>{msg}</p>
        {detail ? <div className={s.errorBox}>{detail}</div> : null}
        <button style={{ marginTop: 16 }} className="secondary" onClick={() => location.reload()}>Refresh page</button>
      </div>
    </div>
  );
}
