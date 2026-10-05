"use client";
import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useTx } from "@/components/locale-provider";
import { setWeeklyGoal } from "./actions";
import type { FormState } from "@/app/login/actions";

export function GoalForm({ current }: { current: number }) {
  const tx = useTx();
  const [state, action] = useActionState<FormState, FormData>(setWeeklyGoal, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 text-sm font-semibold">
          {tx("Resurse pe săptămână", "Resources per week")}
          <select name="goal" defaultValue={String(current)} className="h-11 rounded-control border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none">
            <option value="0">{tx("Fără obiectiv", "No goal")}</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <SubmitButton>{tx("Salvează", "Save")}</SubmitButton>
      </div>
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
    </form>
  );
}
