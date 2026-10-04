"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert, Field, btn } from "@/components/ui";
import { useT, useTx } from "@/components/locale-provider";

export function MfaChallenge({ next }: { next: string }) {
  const t = useT();
  const tx = useTx();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    const code = String(formData.get("code") ?? "").replace(/\s/g, "");
    start(async () => {
      setError(null);
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      if (!factor) return setError(t.common.error);
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (cErr || !challenge) return setError(t.common.error);
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code });
      if (vErr) return setError(t.mfa.invalid);
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      {error && <Alert>{error}</Alert>}
      <Field label={t.mfa.code} name="code" inputMode="numeric" autoComplete="one-time-code" required />
      <button type="submit" disabled={pending} className={`${btn.primary} w-full`}>
        {pending ? tx("Se verifică", "Verifying") : t.mfa.submit}
      </button>
    </form>
  );
}
