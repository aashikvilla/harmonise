"use client";

import { useEffect, useRef } from "react";

export default function UrgentModal({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="cx-modal-backdrop" role="presentation">
      <div className="cx-modal cx-card-white" role="alertdialog" aria-modal="true" aria-labelledby="cx-urgent-title" aria-describedby="cx-urgent-desc">
        <p className="cx-kicker">Urgent support</p>
        <h2 id="cx-urgent-title">Please reach immediate human support now.</h2>
        <p id="cx-urgent-desc" className="cx-lede">
          Please reach immediate human support now. Harmonise cannot monitor you or contact emergency services.
        </p>
        <div className="cx-disclaimer">
          Harmonise is not an emergency service. It is not therapy, diagnosis, legal advice, financial advice, or
          emergency response. If you may act on these thoughts, contact local emergency services right now.
        </div>
        <p className="cx-note">Ask a trusted person to stay with you.</p>
        <div className="cx-modal-actions">
          <a className="cx-btn cx-btn-dark cx-btn-block" href="https://findahelpline.com/" target="_blank" rel="noreferrer">
            Find a verified helpline
          </a>
          <button ref={closeRef} type="button" className="cx-btn cx-btn-primary cx-btn-block" onClick={onClose}>
            Close so I can contact someone
          </button>
        </div>
      </div>
    </div>
  );
}
