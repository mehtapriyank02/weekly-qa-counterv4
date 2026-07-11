import { useEffect } from "react";
import { useAppData } from "../../context/AppDataContext";
import { ANALYTICS_WEEKS } from "../../lib/helpers";
import { useCountUp } from "../../lib/useCountUp";
import Icon from "../shared/Icon";
import Reveal from "../shared/Reveal";
import s from "./Home.module.css";
import priyankPhoto from "../../assets/priyank.webp";
import parthPhoto from "../../assets/parth.webp";

const FEATURES = [
  { num: "5", label: "Days tracked", sub: "Monday through Friday, per agent" },
  { num: String(ANALYTICS_WEEKS), label: "Week trend window", sub: "Rolling history for streaks & fail rate" },
  { num: "2", label: "Workstreams", sub: "T2 Privacy and T2 Privacy - Pilot" },
  { num: "Auto", label: "Weekly shuffle", sub: "Fresh agent/QA pairings every Monday" },
  { num: "Live", label: "Realtime sync", sub: "Changes appear instantly for every signed-in QA" },
  { num: "1-click", label: "Leave coverage", sub: "Hand off agents to a covering auditor and back" },
];

const TICKER = [
  "Weekly targets", "Fail tracking", "Leave coverage", "Realtime sync",
  "Target streaks", "CSV export", "Workstream shuffle", "Trend history",
];

const AUDITORS = [
  { name: "Priyank", photo: priyankPhoto, color: "var(--priyank)", bio: "Priyank is a detail-oriented QA Auditor focused on maintaining quality, accuracy, and consistency. He helps identify improvement opportunities, supports agent development, and ensures processes are followed effectively." },
  { name: "Parth", photo: parthPhoto, color: "var(--parth)", bio: "Parth is a dedicated QA Auditor with a strong focus on service quality and continuous improvement. He reviews performance, provides constructive feedback, and helps teams deliver accurate and reliable customer support." },
];

function StatNumber({ value }) {
  const asNumber = /^\d+$/.test(value) ? Number(value) : null;
  const animated = useCountUp(asNumber ?? 0);
  return <div className={s.statNum}>{asNumber !== null ? animated : value}</div>;
}

export default function Home() {
  const { state, setActiveWorkstreamId, setActiveSection, pendingScroll, consumePendingScroll } = useAppData();

  useEffect(() => {
    if (pendingScroll === "auditors") {
      requestAnimationFrame(() => {
        document.getElementById("auditors")?.scrollIntoView({ behavior: "smooth" });
      });
      consumePendingScroll();
    }
  }, [pendingScroll, consumePendingScroll]);

  function enterWorkstream() {
    const id = state.activeWorkstreamId || state.workstreams[0]?.id;
    if (id) setActiveWorkstreamId(id);
    setActiveSection("dashboard");
  }

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.glow} />
        <div className={s.heroGrid}>
          <div className={s.heroText}>
            <div className={s.eyebrow}><span className={s.liveDot} /> live QA tracking</div>
            <h1 className={s.headline}>
              quality tracking that keeps the whole team honest<span className={s.dot}>.</span>
            </h1>
            <p className={s.sub}>
              {state.isAdmin
                ? "Assign agents, track daily counts, manage leave coverage, and see who's hitting target — across every workstream, in real time."
                : `Your weekly counts, targets, and streaks in one place${state.currentQaMember?.name ? ` — welcome back, ${state.currentQaMember.name}` : ""}.`}
            </p>
            <div className={s.heroActions}>
              <button type="button" className={s.ctaBtn} onClick={enterWorkstream}>
                Enter Workstream <Icon name="chevronDown" size={14} style={{ transform: "rotate(-90deg)" }} />
              </button>
              <button
                type="button"
                className={`secondary ${s.ctaBtn}`}
                onClick={() => document.getElementById("auditors")?.scrollIntoView({ behavior: "smooth" })}
              >
                Meet our Auditors
              </button>
            </div>
          </div>

          <div className={s.heroVisual} aria-hidden="true">
            <div className={s.visualOrb} />
            <div className={`${s.floatCard} ${s.c3}`}>
              <div className={s.fcTop}><span className={s.fcLabel}>Fail rate</span><Icon className={s.fcIcon} name="alert" size={15} /></div>
              <div className={s.fcValue}>8%</div>
              <div className={s.fcSub}>Last 12 weeks</div>
            </div>
            <div className={`${s.floatCard} ${s.c1}`}>
              <div className={s.fcTop}><span className={s.fcLabel}>This week</span><Icon className={s.fcIcon} name="done" size={15} /></div>
              <div className={s.fcValue}>42/50</div>
              <div className={s.fcSub}>Agents complete</div>
            </div>
            <div className={`${s.floatCard} ${s.c2}`}>
              <div className={s.fcTop}><span className={s.fcLabel}>Streak</span><Icon className={s.fcIcon} name="flame" size={15} /></div>
              <div className={s.fcValue}>6 weeks</div>
              <div className={s.fcSub}>Hitting target</div>
            </div>
          </div>
        </div>
      </section>

      <div className={s.marquee}>
        <div className={s.marqueeTrack}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className={s.marqueeItem}>{t}<span className={s.sep}>•</span></span>
          ))}
        </div>
      </div>

      <section className={s.section}>
        <Reveal className={s.sectionHead}>
          <h2>What this dashboard does.</h2>
          <p>No ticket or customer data lives here — just weekly QA counts, targets, and the process around them.</p>
        </Reveal>
        <Reveal className={s.statGrid} as="div">
          {FEATURES.map((f) => (
            <div key={f.label} className={s.statCard}>
              <StatNumber value={f.num} />
              <div className={s.statLabel}>{f.label}</div>
              <div className={s.statSub}>{f.sub}</div>
            </div>
          ))}
        </Reveal>
      </section>

      <section className={s.section} id="auditors">
        <Reveal className={s.sectionHead}>
          <h2>Meet our Auditors.</h2>
          <p>The two QA auditors behind every count on this dashboard.</p>
        </Reveal>
        <div className={s.auditorGrid}>
          {AUDITORS.map((a, i) => (
            <Reveal key={a.name} delay={i * 90} className={s.auditorCard}>
              <div className={s.auditorPhoto}>
                <img src={a.photo} alt={`${a.name}, QA Auditor`} loading="lazy" />
              </div>
              <p className={s.auditorBio}>{a.bio}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className={s.closing}>
        <h2>Ready to see this week's numbers?</h2>
        <p>Jump into a workstream to track counts, fails, and who's on pace to hit target.</p>
        <div className={s.heroActions}>
          <button type="button" className={s.ctaBtn} onClick={enterWorkstream}>Enter Workstream</button>
        </div>
      </Reveal>

      <div className={s.footer}>Verity — no ticket/customer data is stored here.</div>
    </div>
  );
}
