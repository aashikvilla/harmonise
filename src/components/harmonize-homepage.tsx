import Link from "next/link";
import styles from "./harmonize-homepage.module.css";

const steps = [
  {
    number: "01",
    title: "Think in private",
    text: "Start with what is happening for you. The adviser responds to your prompt without posting it to a community.",
    detail: "A small first step, at your pace.",
  },
  {
    number: "02",
    title: "Choose what to explore",
    text: "Read the reflection first. Community matches stay hidden until you ask to see them.",
    detail: "Your conversation is not shared automatically.",
  },
  {
    number: "03",
    title: "Connect when it fits",
    text: "Browse real peer communities and decide whether to join. New community ideas stay private until you submit them for human review.",
    detail: "People make the consequential choices.",
  },
];

export default function HarmonizeHomepage() {
  return (
    <main className={styles.homepage}>
      <div className={styles.progress} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="harmonize. home">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path d="M8 23C8 14 15 9 23 9C31 9 34 15 29 20C23 26 12 22 12 29C12 34 22 34 28 26" />
            <circle cx="31" cy="24" r="2.6" />
          </svg>
          <span>harmonize<em>.</em></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="#how-it-works">How it works</Link>
          <Link href="#ai-with-boundaries">Our AI</Link>
          <Link href="/communities">Communities</Link>
          <Link href="/connect">Sign in</Link>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PRIVATE REFLECTION · REAL COMMUNITY</p>
          <h1 id="home-title">A place to pause before you <em>decide.</em></h1>
          <p className={styles.lede}>
            When something feels hard to carry, start with a private conversation. Find one
            practical next step, then choose whether peer support belongs in your journey.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/connect">Start privately <span aria-hidden="true">→</span></Link>
            <Link className={styles.secondary} href="#how-it-works">See how it works</Link>
          </div>
          <p className={styles.heroNote}>Peer support and navigation · Not therapy or emergency care</p>
        </div>
        <figure className={styles.pathFigure} aria-label="The member-led path from private reflection to optional peer connection">
          <div className={styles.pathGlow} aria-hidden="true" />
          <svg className={styles.pathArt} viewBox="0 0 640 520" role="img" aria-labelledby="path-title path-description">
            <title id="path-title">A path that stays in your hands</title>
            <desc id="path-description">Three connected points represent private reflection, a practical next step, and optional community connection.</desc>
            <defs>
              <linearGradient id="path-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#cf8176" />
                <stop offset="0.55" stopColor="#a99bc8" />
                <stop offset="1" stopColor="#87a998" />
              </linearGradient>
              <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#665a70" floodOpacity=".12" />
              </filter>
            </defs>
            <path className={styles.pathHalo} d="M113 360C105 270 198 226 282 265S422 319 510 170" />
            <path className={styles.pathLine} d="M113 360C105 270 198 226 282 265S422 319 510 170" />
            <circle className={styles.pathOrbit} cx="113" cy="360" r="71" />
            <circle className={styles.pathOrbit} cx="282" cy="265" r="88" />
            <circle className={styles.pathOrbit} cx="510" cy="170" r="66" />
            <g filter="url(#node-shadow)">
              <circle className={styles.nodeOne} cx="113" cy="360" r="47" />
              <circle className={styles.nodeTwo} cx="282" cy="265" r="55" />
              <circle className={styles.nodeThree} cx="510" cy="170" r="43" />
            </g>
            <path className={styles.innerLoop} d="M95 358c0-13 11-22 24-22 12 0 18 8 12 15-7 9-25 4-25 16 0 10 12 12 23 2" />
            <path className={styles.stepMark} d="m263 267 13 13 27-31" />
            <path className={styles.communityMark} d="M490 180c0-11 9-19 20-19s20 8 20 19M483 201c2-9 10-14 18-14M519 187c8 0 16 5 18 14" />
            <circle className={styles.traveler} r="7" fill="#af554f">
              <animateMotion dur="8s" repeatCount="indefinite" path="M113 360C105 270 198 226 282 265S422 319 510 170" />
            </circle>
          </svg>
          <figcaption className={styles.pathLabels}>
            <span>Reflect privately</span><span>Find a next step</span><span>Connect by choice</span>
          </figcaption>
        </figure>
        <a className={styles.scrollCue} href="#why-harmonise"><span aria-hidden="true" />Scroll to explore</a>
      </section>

      <section className={`${styles.section} ${styles.problem}`} id="why-harmonise" aria-labelledby="why-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>WHY HARMONISE</p>
          <h2 id="why-title">Some moments need a first step, not a public post.</h2>
          <p>It can be hard to explain what is happening, know what to do, and decide who to tell—all at once.</p>
        </div>
        <div className={styles.promiseGrid}>
          <article className={styles.promiseCard}>
            <span className={styles.cardIndex}>01 / SPACE</span>
            <h3>Make room to think</h3>
            <p>A private place to put the situation into words before deciding what comes next.</p>
            <span className={styles.cardOrbit} aria-hidden="true">01</span>
          </article>
          <article className={styles.promiseCard}>
            <span className={styles.cardIndex}>02 / DIRECTION</span>
            <h3>Find one small step</h3>
            <p>Meta can help reflect and offer practical ideas. You choose what fits your life.</p>
            <span className={styles.cardOrbit} aria-hidden="true">02</span>
          </article>
          <article className={styles.promiseCard}>
            <span className={styles.cardIndex}>03 / PEOPLE</span>
            <h3>Connect when ready</h3>
            <p>Explore peer communities only when you ask. Your private conversation is not posted.</p>
            <span className={styles.cardOrbit} aria-hidden="true">03</span>
          </article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.journey}`} id="how-it-works" aria-labelledby="journey-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>A MEMBER-LED JOURNEY</p>
          <h2 id="journey-title">The next step stays yours.</h2>
          <p>Harmonise keeps reflection, discovery, and sharing as separate choices.</p>
        </div>
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li key={step.number} className={styles.step}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <span className={styles.stepDetail}>{step.detail}</span>
              </div>
              <span className={styles.stepArrow} aria-hidden="true">↗</span>
            </li>
          ))}
        </ol>
        <Link className={styles.textLink} href="/connect">Start with a private conversation <span aria-hidden="true">→</span></Link>
      </section>

      <section className={`${styles.section} ${styles.aiSection}`} id="ai-with-boundaries" aria-labelledby="ai-title">
        <div className={styles.aiHeader}>
          <p className={styles.eyebrow}>TECHNOLOGY WITH CLEAR ROLES</p>
          <h2 id="ai-title">AI can help with the words. People stay responsible for the choices.</h2>
          <p>Meta models run on the server after a member chooses to use each feature. The app shows the model behind live advice.</p>
        </div>
        <div className={styles.aiGrid}>
          <article className={styles.aiCard}>
            <span className={styles.aiType}>REFLECTION · SETUP</span>
            <h3>Muse Wonder, with Spark fallback</h3>
            <p>Live advice and community setup drafts can try Wonder first, with Muse Spark as fallback.</p>
          </article>
          <article className={styles.aiCard}>
            <span className={styles.aiType}>CHAT · GUIDE · TRIAGE</span>
            <h3>Muse Spark, advisory only</h3>
            <p>Spark supports private chat, scoped community guidance, and moderation triage. Triage never takes action.</p>
          </article>
          <article className={styles.aiCard}>
            <span className={styles.aiType}>VOICE · TRANSCRIPTION</span>
            <h3>Muse Voice Transcribe</h3>
            <p>Speak instead of type. Review and edit the transcript before choosing to send it to private chat.</p>
          </article>
        </div>
        <p className={styles.boundary}>Harmonise is peer support and navigation. It is not therapy, diagnosis, or emergency care. Human review is required before new communities launch.</p>
      </section>

      <section className={`${styles.section} ${styles.impact}`} id="the-intent" aria-labelledby="impact-title">
        <div className={styles.impactArt} aria-hidden="true">
          <svg viewBox="0 0 420 260">
            <path className={styles.impactThread} d="M12 190C83 190 81 72 155 72s62 107 132 107 68-84 121-84" />
            <circle cx="54" cy="165" r="26" /><circle cx="155" cy="72" r="38" /><circle cx="287" cy="179" r="30" /><circle cx="365" cy="105" r="23" />
          </svg>
        </div>
        <div className={styles.impactCopy}>
          <p className={styles.eyebrow}>THE IMPACT WE ARE AIMING FOR</p>
          <h2 id="impact-title">A gentler route from feeling stuck to choosing what comes next.</h2>
          <p>We built Harmonise for people facing difficult decisions or life changes who want a low-pressure first step and the option of peer support. We are describing an intention, not a measured outcome.</p>
          <Link className={styles.primary} href="/connect">Take your first step <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.brand} aria-label="harmonize. home"><span>harmonize<em>.</em></span></Link>
        <p>Peer support, not therapy or emergency care.</p>
        <Link href="/communities">Explore real communities <span aria-hidden="true">→</span></Link>
      </footer>
    </main>
  );
}
