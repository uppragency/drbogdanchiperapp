"use client";
import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { changeEmail, changeRole } from "./actions";
import type { FormState } from "@/app/login/actions";

type Role = "user" | "moderator" | "admin";
const LABEL: Record<Role, string> = { user: "Membru", moderator: "Moderator", admin: "Administrator" };

export function AccountForms({ id, email, role, isSelf }: { id: string; email: string; role: Role; isSelf: boolean }) {
  const [emailState, emailAction] = useActionState<FormState, FormData>(changeEmail, {});
  const [roleState, roleAction] = useActionState<FormState, FormData>(changeRole, {});
  return (
    <div className="flex flex-col gap-8">
      <form action={emailAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={id} />
        <Field label="Email de autentificare" name="email" type="email" defaultValue={email} required autoComplete="off" help="Se schimbă imediat, fără email de confirmare. Userul se loghează de acum cu noua adresă." />
        {emailState.error && <Alert>{emailState.error}</Alert>}
        {emailState.ok && <Alert kind="ok">{emailState.ok}</Alert>}
        <div><SubmitButton>Schimbă emailul</SubmitButton></div>
      </form>
      <form action={roleAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={id} />
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Rol
          <select name="role" defaultValue={role} disabled={isSelf} className="h-11 max-w-xs rounded-control border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none disabled:opacity-60">
            {(Object.keys(LABEL) as Role[]).map((r) => <option key={r} value={r}>{LABEL[r]}</option>)}
          </select>
        </label>
        <p className="text-sm text-muted">
          {isSelf
            ? "Nu îți poți schimba propriul rol."
            : "Membru: acces la conținut. Moderator: publică resurse și moderează comentarii, fără acces la useri, plăți sau setări. Administrator: acces complet. La schimbare, contul este deconectat de pe toate dispozitivele."}
        </p>
        {roleState.error && <Alert>{roleState.error}</Alert>}
        {roleState.ok && <Alert kind="ok">{roleState.ok}</Alert>}
        {!isSelf && <div><SubmitButton>Salvează rolul</SubmitButton></div>}
      </form>
    </div>
  );
}
