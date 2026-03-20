"use client";

import { useState } from "react";

// ─── Deterministic per-name color palette ─────────────────────────────────────

const PALETTE = [
  "bg-primary/30 text-primary",
  "bg-sky-500/30 text-sky-400",
  "bg-amber-500/30 text-amber-400",
  "bg-violet-500/30 text-violet-400",
  "bg-rose-500/30 text-rose-400",
  "bg-emerald-500/30 text-emerald-400",
  "bg-orange-500/30 text-orange-400",
];

function colorForName(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return PALETTE[hash % PALETTE.length];
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvatarProps {
  /** User display name — used for initials fallback and color. */
  name: string;
  /** Avatar URL (base64 data URL or https URL). Initials fallback used when absent. */
  avatarUrl?: string;
  /** Tailwind container size class, e.g. "size-7". Default: "size-7". */
  size?: string;
  /** Tailwind text-size class for initials, e.g. "text-[10px]". Default: "text-[10px]". */
  textSize?: string;
  /** Extra classes applied to the container (border, ring, opacity, etc.). */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Avatar({
  name,
  avatarUrl,
  size      = "size-7",
  textSize  = "text-[10px]",
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Resolve URL: use explicit prop if provided, else no image
  const resolvedUrl = avatarUrl || undefined;

  const showImg  = !!resolvedUrl && !imgError;
  const colorCls = colorForName(name);

  return (
    <div
      className={`${size} rounded-full flex items-center justify-center shrink-0 overflow-hidden font-bold ${
        showImg ? "" : colorCls
      } ${className}`}
    >
      {showImg ? (
        <img
          src={resolvedUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${textSize} font-bold leading-none select-none`}>
          {initials(name)}
        </span>
      )}
    </div>
  );
}
