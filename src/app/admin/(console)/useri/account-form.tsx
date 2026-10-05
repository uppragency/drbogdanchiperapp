"use client";
import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { changeEmail, changeRole } from "./actions";
import type { FormState } from "@/app/login/actions";

export function AccountForms({ id, email, role, isSelf }: { id: string; email: string; role: "user" | "admin"; isSelf: boolean }) {
  const [emailState, emailAction] = useActionState<FormState, FormData>(changeEmail, {});
  const [roleState, roleAction] = useActionState<FormState, FormData>(changeRole, {});
  const next = role === "admin" ? "user" : "admin";
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
        <input type="hidden" name="role" value={next} />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Rol curent: {role === "admin" ? "Administrator" : "Membru"}</span>
          <p className="text-sm text-muted">
            {isSelf ? "Nu îți poți schimba propriul rol." : next === "admin" ? "Administratorul are acces la consola de administrare și este deconectat de pe toate dispozitivele la schimbare." : "Revine la cont de membru, fără acces la consola de administrare."}
          </p>
        </div>
        {roleState.error && <Alert>{roleState.error}</Alert>}
        {roleState.ok && <Alert kind="ok">{roleState.ok}</Alert>}
        {!isSelf && <div><SubmitButton>{next === "admin" ? "Fă administrator" : "Fă membru obișnuit"}</SubmitButton></div>}
      </form>
    </div>
  );
}
