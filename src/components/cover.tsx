"use client";
import { useState } from "react";
import { FilePdf, Link as LinkIcon, Play, TextAlignLeft, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/components/ui";

const TYPE_ICON = { video: VideoCamera, pdf: FilePdf, text: TextAlignLeft, link: LinkIcon } as const;
export type ResourceType = keyof typeof TYPE_ICON;

const PALETTES = [
  { bg: "bg-[#0d1c5c]", a: "bg-[#9155f6]/45", b: "bg-[#313885]" },
  { bg: "bg-[#313885]", a: "bg-[#9155f6]/50", b: "bg-[#0d1c5c]" },
  { bg: "bg-[#5a2fc2]", a: "bg-[#b896ff]/40", b: "bg-[#0d1c5c]" },
];
const hash = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Generated cover for resources without a video thumbnail: one of three brand palettes, chosen by category.
export function GeneratedCover({ type, label, className }: { type: ResourceType; label?: string; className?: string }) {
  const Icon = TYPE_ICON[type];
  const p = PALETTES[hash(label ?? type) % PALETTES.length];
  return (
    <div className={cn("relative flex size-full items-end overflow-hidden p-5 text-white", p.bg, className)} aria-hidden>
      <div className={cn("absolute -right-10 -top-14 size-64 rounded-full blur-3xl", p.a)} />
      <div className={cn("absolute -bottom-24 -left-10 size-56 rounded-full blur-2xl", p.b)} />
      <Icon size={120} weight="thin" className="absolute -right-2 top-1/2 -translate-y-1/2 text-white/25" />
      {label && <span className="relative text-xs font-semibold uppercase tracking-wider text-white/75">{label}</span>}
    </div>
  );
}

// Tries each candidate image in order, then falls back to the generated cover.
export function Cover({ covers, type, label, play, ratio = "aspect-video", className }: { covers: string[]; type: ResourceType; label?: string; play?: boolean; ratio?: string; className?: string }) {
  const [index, setIndex] = useState(0);
  const src = covers[index];
  return (
    <div className={cn("relative w-full overflow-hidden bg-surface2", ratio, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote video thumbnails, sizes unknown
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            // YouTube serves a 120px grey placeholder when maxres does not exist.
            if (e.currentTarget.naturalWidth <= 120) setIndex((i) => i + 1);
          }}
          onError={() => setIndex((i) => i + 1)}
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <GeneratedCover type={type} label={label} />
      )}
      {play && src && (
        <span className="absolute inset-0 flex items-center justify-center bg-[#0d1c5c]/10">
          <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-[#0d1c5c] shadow-lg transition group-hover:scale-110">
            <Play size={26} weight="fill" />
          </span>
        </span>
      )}
    </div>
  );
}
