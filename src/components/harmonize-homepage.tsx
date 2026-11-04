import Link from "next/link";
import styles from "./harmonize-homepage.module.css";

/** Product entry point. All member activity is shown by the connected app routes. */
export default function HarmonizeHomepage() {
  return (
    <main className={styles.homepage}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="harmonize. home">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path d="M8 23C8 14 15 9 23 9C31 9 34 15 29 20C23 26 12 22 12 29C12 34 22 34 28 26" />
            <circle cx="31" cy="24" r="2.6" />
          </svg>
          <span>harmonize<em>.</em></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/communities">Communities</Link>
          <Link href="/connect">Sign in</Link>
        </nav>
      </header>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>PRIVATE REFLECTION · REAL COMMUNITY</p>
        <h1>A place to think things through, <em>on your terms.</em></h1>
        <p className={styles.lede}>
          Start with a private conversation. Get a thoughtful reflection and practical next steps. If you choose,
          discover real peer communities and decide what to share.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/connect">Start a conversation</Link>
          <Link className={styles.secondary} href="/communities">Explore communities</Link>
        </div>
        <ul className={styles.principles}>
          <li><strong>Private first</strong><span>Your conversation is not posted to a community.</span></li>
          <li><strong>AI with boundaries</strong><span>Meta AI offers general guidance; you decide what fits.</span></li>
          <li><strong>People by choice</strong><span>Browse and join real communities only when you want to.</span></li>
        </ul>
      </section>
      <footer className={styles.footer}>
        <span>Harmonise is peer support, not therapy or emergency care.</span>
        <Link href="/communities/propose">Suggest a community</Link>
      </footer>
    </main>
  );
}
