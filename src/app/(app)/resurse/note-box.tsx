"use client";
import { useState, useTransition } from "react";
import { Note } from "@phosphor-icons/react";
import { btn } from "@/components/ui";
import { toast } from "@/components/toaster";
import { useTx } from "@/components/locale-provider";
import { saveNote } from "../profil/actions";

export function NoteBox({ resourceId, initial }: { resourceId: string; initial: string }) {
  const tx = useTx();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = value.trim() !== saved.trim();
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 md:p-6">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold"><Note size={20} /> {tx("Notițele mele", "My notes")}</h2>
      <p className="text-sm text-muted">{tx("Private, le vezi doar tu. Le găsești și în Profil, la Notițe.", "Private, only you can see them. You also find them in Profile, under Notes.")}</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        maxLength={4000}
        aria-label={tx("Notițele mele", "My notes")}
        placeholder={tx("Scrie ce vrei să reții din această resursă", "Write what you want to remember from this resource")}
        className="w-full rounded-control border border-line bg-bg px-4 py-3 text-base text-ink focus:border-accent focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() => start(async () => {
            const ok = await saveNote(resourceId, value);
            if (ok) { setSaved(value); toast(tx("Notița a fost salvată", "Note saved")); }
            else toast(tx("Nu am putut salva notița.", "Could not save the note."), "error");
          })}
          className={btn.primary}
        >
          {tx("Salvează notița", "Save note")}
        </button>
        {!dirty && saved && <span className="text-sm text-muted">{tx("Salvată", "Saved")}</span>}
      </div>
    </section>
  );
}
