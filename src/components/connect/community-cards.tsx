"use client";

import { useState } from "react";
import { getCommunity } from "@/lib/connect/catalog";
import type { NameMode } from "@/lib/connect/session";

export function CommunityCard({
  id,
  reason,
  joined,
  nameMode,
  displayName,
  onJoin,
  onOpen,
}: {
  id: string;
  reason: string | null;
  joined: boolean;
  nameMode: NameMode;
  displayName: string;
  onJoin: (id: string) => void;
  onOpen: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const community = getCommunity(id);
  if (!community) return null;

  return (
    <article className="cx-card cx-card-white" aria-label={community.name}>
      <div className="cx-card-meta">
        <span className="cx-tag cx-tag-dark">Prototype</span>
        <span className="cx-tag cx-tag-green">{community.cadence}</span>
        <span className="cx-tag">{community.memberCount}</span>
      </div>
      <h3>{community.name}</h3>
      <p className="cx-card-desc">{community.description}</p>
      {community.extraNote ? <p className="cx-note">{community.extraNote}</p> : null}
      {reason ? (
        <div className="cx-why">
          <strong>Why it fits</strong>
          {reason}
        </div>
      ) : null}
      <div className="cx-card-actions">
        <button type="button" className="cx-btn cx-btn-soft" onClick={() => setPreview((value) => !value)} aria-expanded={preview}>
          {preview ? "Hide preview" : "Preview"}
        </button>
        {joined ? (
          <button type="button" className="cx-btn cx-btn-primary" onClick={onOpen}>
            Open in My circles
          </button>
        ) : (
          <button type="button" className="cx-btn cx-btn-primary" onClick={() => onJoin(community.id)}>
            {nameMode === "alias" ? `Join as alias “${displayName}”` : `Join as ${displayName}`}
          </button>
        )}
      </div>
      {preview ? (
        <div className="cx-preview-box">
          <p><strong>What members talk about:</strong> {community.topics.join(" · ")}</p>
          <p><strong>Circle agent:</strong> {community.agentName} — prompts, gentle moderation, scheduled feeds.</p>
          <p><strong>First boundary:</strong> {community.boundaries[0]}</p>
          <p>Sample preview. Joining is always explicit and consent-based.</p>
        </div>
      ) : null}
    </article>
  );
}
