import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTx, pick } from "@/lib/i18n";
import { cn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { votePoll } from "./poll-actions";

type Poll = { id: string; question: string; question_en: string | null };
type Option = { id: string; label: string; label_en: string | null; position: number };

// Most recent active poll. Voting happens once per member; afterwards the results are shown.
export async function PollCard() {
  const viewer = await requireUser();
  const supabase = await createClient();
  const { data: poll } = await supabase.from("polls").select("id,question,question_en").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!poll) return null;
  const p = poll as Poll;
  const [{ data: optRows }, { data: mine }] = await Promise.all([
    supabase.from("poll_options").select("id,label,label_en,position").eq("poll_id", p.id).order("position"),
    supabase.from("poll_votes").select("option_id").eq("poll_id", p.id).eq("user_id", viewer.id).maybeSingle(),
  ]);
  const options = (optRows ?? []) as Option[];
  if (options.length < 2) return null;
  const [locale, tx] = await Promise.all([getLocale(), getTx()]);
  const myOption = (mine as { option_id: string } | null)?.option_id ?? null;

  let results: Map<string, number> | null = null;
  let total = 0;
  if (myOption) {
    const { data } = await supabase.rpc("poll_results", { p_poll: p.id });
    results = new Map(((data ?? []) as { option_id: string; votes: number | string }[]).map((r) => [r.option_id, Number(r.votes)]));
    total = [...results.values()].reduce((a, b) => a + b, 0);
  }
  const question = pick(locale, p.question, p.question_en);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10">
      <section aria-labelledby="sondaj" className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-wider text-violet">{tx("Sondaj", "Poll")}</p>
          <h2 id="sondaj" className="text-xl font-bold leading-snug tracking-tight md:text-2xl">{question}</h2>
        </div>

        {results ? (
          <>
            <ul className="flex flex-col gap-2">
              {options.map((o) => {
                const votes = results.get(o.id) ?? 0;
                const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                const chosen = o.id === myOption;
                return (
                  <li key={o.id} className="relative overflow-hidden rounded-control border border-line bg-bg">
                    <div className={cn("absolute inset-y-0 left-0", chosen ? "bg-violet-soft" : "bg-surface2")} style={{ width: `${pct}%` }} aria-hidden />
                    <div className="relative flex min-h-11 items-center gap-3 px-4 py-2 text-sm">
                      <span className={cn("min-w-0 flex-1", chosen && "font-bold")}>{pick(locale, o.label, o.label_en)}</span>
                      {chosen && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet">
                          <CheckCircle size={16} weight="fill" aria-hidden /> {tx("Votul tău", "Your vote")}
                        </span>
                      )}
                      <span className="w-10 text-right font-semibold tabular-nums">{pct}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-muted">{tx(`${total} ${total === 1 ? "vot" : "voturi"}`, `${total} ${total === 1 ? "vote" : "votes"}`)}</p>
          </>
        ) : (
          <form action={votePoll} className="flex flex-col gap-3">
            <input type="hidden" name="poll" value={p.id} />
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">{question}</legend>
              {options.map((o) => (
                <label key={o.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-line bg-bg px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface2 has-[:checked]:border-accent has-[:checked]:bg-surface2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
                  <input type="radio" name="option" value={o.id} required className="size-4 shrink-0 accent-[var(--accent)]" />
                  {pick(locale, o.label, o.label_en)}
                </label>
              ))}
            </fieldset>
            <SubmitButton className="self-start">{tx("Votează", "Vote")}</SubmitButton>
          </form>
        )}
      </section>
    </div>
  );
}
