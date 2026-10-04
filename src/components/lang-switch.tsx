import { setLocale } from "@/app/actions";
import { getLocale } from "@/lib/i18n";
import { cn } from "@/components/ui";

// Works without JavaScript: each button posts the chosen language to a server action.
export async function LangSwitch({ className }: { className?: string }) {
  const current = await getLocale();
  return (
    <form action={setLocale} className={cn("inline-flex items-center rounded-full border border-line p-0.5 text-xs font-bold", className)} aria-label="Language">
      {(["ro", "en"] as const).map((l) => (
        <button
          key={l}
          name="lang"
          value={l}
          lang={l}
          aria-pressed={current === l}
          className={cn("min-h-8 min-w-9 rounded-full px-2 uppercase transition-colors", current === l ? "bg-ink text-bg" : "text-muted hover:text-ink")}
        >
          {l}
        </button>
      ))}
    </form>
  );
}
