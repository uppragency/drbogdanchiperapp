"use client";
import { useState } from "react";
import { Play } from "@phosphor-icons/react/dist/ssr";
import { Cover } from "@/components/cover";

// Lazy embed: shows the cover first, loads the provider iframe only after a click.
export function VideoPlayer({ title, embed, covers }: { title: string; embed: string; covers: string[] }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-card border border-line bg-black shadow-card">
      {playing ? (
        <iframe
          src={embed}
          title={title}
          className="size-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group relative block size-full" aria-label={`Redă: ${title}`}>
          <Cover covers={covers} type="video" badge={false} ratio="aspect-auto" className="size-full" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-white text-[#0d1c5c] shadow-xl transition group-hover:scale-110">
              <Play size={32} weight="fill" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
