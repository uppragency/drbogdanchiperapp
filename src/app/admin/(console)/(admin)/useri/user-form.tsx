"use client";
import { useActionState } from "react";
import { Alert, Field, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/app/login/actions";

export type UserValues = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  tagIds: string[];
  accessExpires: string;
  paidAt: string;
  paidNote: string;
  adminNote: string;
  isActive: boolean;
};

export function UserForm({ values, tags, action: serverAction }: { values: UserValues; tags: { id: string; name: string }[]; action: (s: FormState, f: FormData) => Promise<FormState> }) {
  const [state, action] = useActionState<FormState, FormData>(serverAction, {});
  const editing = Boolean(values.id);
  return (
    <form action={action} className="flex flex-col gap-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {editing ? (
        <div className="flex flex-col gap-2"><span className="text-sm font-semibold">Email</span><p className="text-base">{values.email}</p></div>
      ) : (
        <Field label="Email" name="email" type="email" required autoComplete="off" />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prenume" name="firstName" defaultValue={values.firstName} />
        <Field label="Nume" name="lastName" defaultValue={values.lastName} />
      </div>
      {!editing && <Field label="Parolă inițială (opțional)" name="password" autoComplete="off" minLength={10} help="Dacă o lași goală, userul își setează parola din invitație. Altfel, comunic-o tu userului." />}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Grupuri MentorMed</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {tags.map((t) => (
            <label key={t.id} className="flex min-h-11 items-center gap-3 rounded-control border border-line bg-bg px-4 text-sm">
              <input type="checkbox" name="tagIds" value={t.id} defaultChecked={values.tagIds.includes(t.id)} className="size-5 accent-[var(--accent)]" />
              {t.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Acces până la" name="accessExpires" type="date" defaultValue={values.accessExpires} help="Gol înseamnă fără expirare." />
        <Field label="Plătit la data de" name="paidAt" type="date" defaultValue={values.paidAt} />
      </div>
      {editing && <Field label="Mențiune plată" name="paidNote" defaultValue={values.paidNote} help="De exemplu referința transferului." />}
      {editing && <TextArea label="Notă internă" name="adminNote" defaultValue={values.adminNote} rows={3} help="Vizibilă doar pentru administrator." />}
      {editing ? (
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="size-5 accent-[var(--accent)]" />
          Cont activ
        </label>
      ) : (
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="sendInvite" className="size-5 accent-[var(--accent)]" />
          Trimite invitația acum
        </label>
      )}
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>{editing ? "Salvează" : "Creează userul"}</SubmitButton></div>
    </form>
  );
}
