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
          <Link href="/connect">Your space</Link>
          <Link href="#why-harmonise">Beyond the window</Link>
          <Link href="/communities">Communities</Link>
          <Link href="#how-it-works">Life chapters</Link>
          <Link className={styles.navCta} href="/connect">Explore the experience <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroAmbient} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span className={styles.sparkle} aria-hidden="true">✳</span> A SPACE FOR UNFINISHED THOUGHTS</p>
          <h1 id="home-title">You don&apos;t need the <em>right words</em> to begin<span className={styles.period}>.</span></h1>
          <p className={styles.lede}>Talk things through privately. Discover people who understand. Find your own way forward, one conversation at a time.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/connect">See how it feels <span aria-hidden="true">↗</span></Link>
            <Link className={styles.quietLink} href="#why-harmonise">Explore the idea <span aria-hidden="true">↓</span></Link>
          </div>
          <p className={styles.heroNote}>No perfect explanation needed. You choose what to share.</p>
        </div>
        <figure className={styles.heroArt} aria-label="An anonymous person sits by a sunlit window as a path leads toward other people and perspectives">
          <div className={`${styles.artGlow} ${styles.glowOne}`} aria-hidden="true" />
          <div className={`${styles.artGlow} ${styles.glowTwo}`} aria-hidden="true" />
          <svg className={styles.sceneSvg} viewBox="0 0 660 650" aria-hidden="true">
            <defs>
              <linearGradient id="hero-sky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff8d9" /><stop offset=".55" stopColor="#dcebf4" /><stop offset="1" stopColor="#dcd9f5" /></linearGradient>
              <linearGradient id="arched-frame" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9f2e6" /><stop offset=".55" stopColor="#fffdfb" /><stop offset="1" stopColor="#e5c9b7" /></linearGradient>
              <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8f9fc2" /><stop offset="1" stopColor="#657caa" /></linearGradient>
              <radialGradient id="golden-light"><stop stopColor="#ffe7a6" stopOpacity=".92" /><stop offset="1" stopColor="#ffe7a6" stopOpacity="0" /></radialGradient>
              <linearGradient id="ribbon-grad" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ce7569" /><stop offset=".53" stopColor="#e9b7a6" /><stop offset="1" stopColor="#aaa5d1" /></linearGradient>
              <filter id="shadow-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="12" /></filter>
              <filter id="shadow-mini" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="11" floodColor="#776a88" floodOpacity=".15" /></filter>
              <clipPath id="hero-window-clip"><path d="M167 359V191a161 161 0 0 1 322 0v168Z" /></clipPath>
            </defs>
            <ellipse className={`${styles.layer} ${styles.layerRear}`} cx="334" cy="475" rx="245" ry="105" fill="url(#golden-light)" opacity=".8" />
            <g className={`${styles.layer} ${styles.layerBack}`}>
              <path d="M146 379V190a181 181 0 0 1 362 0v189" fill="none" stroke="#e4c6bc" strokeWidth="34" strokeLinecap="round" opacity=".26" />
              <path d="M153 364V190a174 174 0 0 1 348 0v174Z" fill="url(#arched-frame)" filter="url(#shadow-mini)" />
              <path d="M167 359V191a161 161 0 0 1 322 0v168Z" fill="url(#hero-sky)" />
              <g clipPath="url(#hero-window-clip)">
                <circle cx="402" cy="147" r="77" fill="url(#golden-light)" />
                <path d="M167 301Q244 263 323 300T489 280V359H167Z" fill="#ccdce1" />
                <path d="M167 319Q255 285 351 324T489 311V359H167Z" fill="#b5d3cb" opacity=".77" />
                <path d="M327 20V359M167 225H489" stroke="#fffaf6" strokeWidth="10" opacity=".95" />
              </g>
              <path d="M155 365H504" stroke="#e6bfac" strokeWidth="17" strokeLinecap="round" />
            </g>
            <g className={`${styles.layer} ${styles.layerMid}`}>
              <ellipse cx="344" cy="509" rx="228" ry="35" fill="#bb9a9c" opacity=".18" filter="url(#shadow-soft)" />
              <path d="M241 476Q218 430 246 404Q277 387 324 391Q389 400 413 433L405 482Z" fill="#d9b9a7" />
              <path d="M227 462Q276 448 400 458V482H227Z" fill="#f2d7c6" />
              <path d="M260 481L257 522M381 480L390 522" stroke="#a87d72" strokeWidth="10" strokeLinecap="round" />
              <path d="M277 459Q278 420 313 415Q341 413 355 439L369 472Z" fill="url(#shirt)" />
              <path d="M318 420Q342 439 366 450L376 457" fill="none" stroke="#60779c" strokeWidth="17" strokeLinecap="round" />
              <path d="M308 398Q296 378 307 360Q328 343 346 362Q358 384 343 402Z" fill="#b87f69" />
              <path d="M305 374Q301 351 327 344Q351 343 349 374Q334 357 305 374Z" fill="#4b4059" />
              <path d="M290 470Q317 481 345 470" fill="none" stroke="#8f9fc2" strokeWidth="21" strokeLinecap="round" />
              <rect x="350" y="429" width="26" height="38" rx="7" fill="#4f526c" transform="rotate(12 364 442)" />
              <circle cx="359" cy="445" r="2" fill="#e8e0e8" />
            </g>
            <g className={`${styles.layer} ${styles.layerFront}`}>
              <path d="M507 471Q493 430 517 403Q543 371 558 336" fill="none" stroke="#678a80" strokeWidth="5" strokeLinecap="round" />
              <path d="M511 452Q477 424 467 400M525 420Q553 407 569 391M544 364Q557 339 567 331" fill="none" stroke="#678a80" strokeWidth="5" strokeLinecap="round" />
              <ellipse cx="480" cy="395" rx="24" ry="11" transform="rotate(25 480 395)" fill="#9cb6a2" />
              <ellipse cx="562" cy="387" rx="25" ry="11" transform="rotate(-32 562 387)" fill="#8ea88e" />
              <ellipse cx="554" cy="345" rx="24" ry="11" transform="rotate(33 554 345)" fill="#a7c0a5" />
              <path d="M492 463H549L540 509H501Z" fill="#d2a88f" />
            </g>
            <path className={styles.heroThread} d="M369 439C455 449 523 397 561 316S604 142 556 111" stroke="url(#ribbon-grad)" strokeWidth="5" strokeLinecap="round" fill="none" />
            <circle cx="552" cy="105" r="12" fill="#fffaf4" stroke="#ba9bbe" strokeWidth="3" />
            <circle cx="552" cy="105" r="4" fill="#ba9bbe" />
            <g className={styles.tinyWindow} transform="translate(506 38)">
              <rect width="90" height="44" rx="22" fill="#fffdf8" opacity=".85" />
              <path d="M20 32V20a11 11 0 0 1 22 0v12" fill="#e2d8f2" /><circle cx="31" cy="18" r="6" fill="#a48273" />
              <path d="M51 29Q55 17 64 17Q73 17 77 29Z" fill="#83a995" /><circle cx="64" cy="14" r="5.5" fill="#c49780" />
            </g>
            <g className={styles.sunParticle} fill="#dfb4a0"><circle cx="114" cy="111" r="4" /><circle cx="532" cy="253" r="3" /><circle cx="144" cy="457" r="4" /><circle cx="594" cy="434" r="4" /></g>
          </svg>
          <figcaption className={styles.artCaption}>ONE WINDOW <span>·</span> MANY POSSIBILITIES</figcaption>
        </figure>
        <a className={styles.scrollCue} href="#why-harmonise"><span>SCROLL TO OPEN THE VIEW</span><span className={styles.scrollTrack}><span /></span></a>
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
