"use client";
import { useActionState, useRef, useState } from "react";
import { Alert, btn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { setUserPassword } from "./actions";
import type { FormState } from "@/app/login/actions";

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generate(length = 16) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function PasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState<FormState, FormData>(setUserPassword, {});
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={userId} />
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold">Parolă nouă</label>
        <input
          ref={input}
          id="password"
          name="password"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setCopied(false);
          }}
          autoComplete="off"
          spellCheck={false}
          minLength={10}
          maxLength={72}
          required
          className="h-11 rounded-control border border-line bg-bg px-4 font-mono text-base focus:border-accent focus:outline-none"
        />
        <p className="text-sm text-muted">Minimum 10 caractere. Parola nu se salvează în clar și nu se trimite pe email.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={() => { setValue(generate()); setCopied(false); }}>Generează parolă</button>
        <button
          type="button"
          className={btn.secondary}
          disabled={!value}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
            } catch {
              input.current?.select();
            }
          }}
        >
          {copied ? "Copiată" : "Copiază"}
        </button>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="logout" defaultChecked className="size-5 accent-[var(--accent)]" />
        Deconectează userul de pe toate dispozitivele
      </label>
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>Setează parola</SubmitButton></div>
    </form>
  );
}
