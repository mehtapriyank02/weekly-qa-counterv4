import Logo from "./Logo";
import s from "./Skeleton.module.css";

export default function LoadingScreen() {
  return (
    <div className={s.page}>
      <div className={s.nav}>
        <Logo />
        <div className={s.navRight}>
          <div className={`${s.bar}`} style={{ width: 90, height: 28, borderRadius: 999 }} />
          <div className={`${s.bar}`} style={{ width: 34, height: 34, borderRadius: 8 }} />
        </div>
      </div>
      <div className={s.body}>
        <div className={`${s.bar} ${s.title}`} />
        <div className={`${s.bar} ${s.subtitle}`} />

        <div className={s.statGrid}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={s.statCard}>
              <div className={`${s.bar} ${s.statIcon}`} />
              <div className={`${s.bar} ${s.statNum}`} />
              <div className={`${s.bar} ${s.statLabel}`} />
            </div>
          ))}
        </div>

        <div className={s.panel}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${s.bar} ${s.row}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
