"use client";
import { useState } from "react";
import { FilePdf, Link as LinkIcon, Play, TextAlignLeft, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/components/ui";
import { categoryColor } from "@/lib/category-color";

const TYPE_ICON = { video: VideoCamera, pdf: FilePdf, text: TextAlignLeft, link: LinkIcon } as const;
export type ResourceType = keyof typeof TYPE_ICON;

const TYPE_LABEL = { video: "Video", pdf: "Document", text: "Articol", link: "Link" } as const;

// Generated cover for resources without an image: category colour, category name and title on a quiet gradient.
export function GeneratedCover({ type, label, title, slug, className }: { type: ResourceType; label?: string; title?: string; slug?: string; className?: string }) {
  const Icon = TYPE_ICON[type];
  const c = categoryColor(slug, label);
  return (
    <div
      className={cn("relative flex size-full flex-col justify-between overflow-hidden p-5 text-white", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${c} 0%, #0d1c5c 135%)` }}
      aria-hidden
    >
      <div aria-hidden className="absolute -right-12 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />
      <Icon size={112} weight="thin" className="absolute -right-3 -bottom-4 text-white/20" />
      {label && <span className="relative text-xs font-semibold uppercase tracking-wider text-white/80">{label}</span>}
      {title && <span className="relative line-clamp-3 max-w-[85%] text-lg font-bold leading-snug sm:text-xl">{title}</span>}
    </div>
  );
}

// Tries each candidate image in order, then falls back to the generated cover.
export function Cover({ covers, type, label, title, slug, play, badge = true, ratio = "aspect-video", className }: { covers: string[]; type: ResourceType; label?: string; title?: string; slug?: string; play?: boolean; badge?: boolean; ratio?: string; className?: string }) {
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
        <GeneratedCover type={type} label={label} title={title} slug={slug} />
      )}
      {badge && src && (
        <span title={TYPE_LABEL[type]} className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
          {(() => { const I = TYPE_ICON[type]; return <I size={18} aria-hidden />; })()}
          <span className="sr-only">{TYPE_LABEL[type]}</span>
        </span>
      )}
      {badge && !src && (
        <span title={TYPE_LABEL[type]} className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur">
          {(() => { const I = TYPE_ICON[type]; return <I size={18} aria-hidden />; })()}
        </span>
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
