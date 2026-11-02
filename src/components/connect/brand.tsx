import Link from "next/link";

/** Shared harmonize. wordmark + loop symbol (homepage identity). */
export function BrandMark() {
  return (
    <span className="cx-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <path d="M8 23C8 14 15 9 23 9C31 9 34 15 29 20C23 26 12 22 12 29C12 34 22 34 28 26" />
        <circle cx="31" cy="24" r="2.6" />
      </svg>
    </span>
  );
}

export default function Brand({ linkToEntrance = false, tagline }: { linkToEntrance?: boolean; tagline?: string }) {
  const inner = (
    <>
      <BrandMark />
      <span>
        <span className="cx-brand-name">
          harmonize<em>.</em>
        </span>
        {tagline ? (
          <span className="cx-tagline" style={{ display: "block" }}>
            {tagline}
          </span>
        ) : null}
      </span>
    </>
  );
  if (linkToEntrance) {
    return (
      <Link href="/connect" className="cx-brand" aria-label="harmonize. entrance">
        {inner}
      </Link>
    );
  }
  return (
    <div className="cx-brand" aria-label="harmonize.">
      {inner}
    </div>
  );
}
