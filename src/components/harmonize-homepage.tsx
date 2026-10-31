import styles from "./harmonize-homepage.module.css";

/**
 * The supplied Motion Revival document is kept intact as the canonical
 * interaction and illustration source. An isolated document boundary keeps
 * its global styles and browser-only motion script away from the product app.
 */
export default function HarmonizeHomepage() {
  return (
    <main className={styles.homepage}>
      <iframe
        className={styles.reference}
        src="harmonize-motion-revival.html"
        title="Harmonize — a space for unfinished thoughts"
        loading="eager"
      />
    </main>
  );
}
