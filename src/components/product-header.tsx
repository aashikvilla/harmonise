import Link from "next/link";

export default function ProductHeader({ current }: { current?: "space" | "communities" | "profile" | "ops" }) {
  return (
    <header className="product-page-header">
      <Link href="/" className="product-page-brand" aria-label="harmonize. home">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M8 23C8 14 15 9 23 9C31 9 34 15 29 20C23 26 12 22 12 29C12 34 22 34 28 26" />
          <circle cx="31" cy="24" r="2.6" />
        </svg>
        <span>harmonize<em>.</em></span>
      </Link>
      <nav className="product-page-nav" aria-label="Main navigation">
        <Link href="/app" aria-current={current === "space" ? "page" : undefined}>Your space</Link>
        <Link href="/communities" aria-current={current === "communities" ? "page" : undefined}>Communities</Link>
        <Link href="/app">Life chapters</Link>
        <Link href="/profile" aria-current={current === "profile" ? "page" : undefined}>Profile</Link>
        <Link href="/connect" className="product-page-cta">Sign in <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
