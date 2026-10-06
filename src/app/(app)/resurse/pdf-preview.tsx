"use client";
import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useTx } from "@/components/locale-provider";

// Shows a PDF attachment inside the page. The frame loads only after the first click.
export function PdfPreview({ id, label }: { id: string; label: string }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-line px-4 text-sm font-semibold transition-colors hover:bg-surface2"
      >
        {open ? <EyeSlash size={18} /> : <Eye size={18} />}
        {open ? tx("Ascunde previzualizarea", "Hide preview") : tx("Previzualizează", "Preview")}
      </button>
      {open && (
        <iframe
          src={`/fisiere/${id}/vizualizare#view=FitH`}
          title={label}
          loading="lazy"
          className="h-[70dvh] min-h-[420px] w-full rounded-control border border-line bg-surface2"
        />
      )}
    </div>
  );
}
