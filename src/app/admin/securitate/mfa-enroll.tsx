"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert, Field, btn } from "@/components/ui";

type Enrol = { factorId: string; qr: string; secret: string };

export function MfaEnroll() {
  const router = useRouter();
  const [enrol, setEnrol] = useState<Enrol | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function begin() {
    start(async () => {
      setError(null);
      const supabase = createClient();
      const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `MentorMed admin ${Date.now()}` });
      if (e || !data) return setError("Nu am putut porni configurarea. Încearcă din nou.");
      setEnrol({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    });
  }

  function verify(formData: FormData) {
    const code = String(formData.get("code") ?? "").replace(/\s/g, "");
    start(async () => {
      if (!enrol) return;
      setError(null);
      const supabase = createClient();
      const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrol.factorId });
      if (cErr || !ch) return setError("Nu am putut verifica codul. Încearcă din nou.");
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId: enrol.factorId, challengeId: ch.id, code });
      if (vErr) return setError("Cod incorect. Încearcă din nou.");
      router.replace("/admin");
      router.refresh();
    });
  }

  if (!enrol) {
    return (
      <div className="flex flex-col gap-3">
        {error && <Alert>{error}</Alert>}
        <button type="button" onClick={begin} disabled={pending} className={btn.primary}>
          Activează verificarea
        </button>
      </div>
    );
  }

  return (
    <form action={verify} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <p className="text-sm">Scanează codul QR cu aplicația de autentificare, apoi introdu codul din 6 cifre.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enrol.qr} alt="Cod QR pentru aplicația de autentificare" width={176} height={176} className="rounded-control bg-white p-2" />
      <p className="text-sm text-muted">
        Nu poți scana? Introdu manual cheia: <span className="font-mono break-all text-ink">{enrol.secret}</span>
      </p>
      <Field label="Cod din 6 cifre" name="code" inputMode="numeric" autoComplete="one-time-code" required />
      <button type="submit" disabled={pending} className={btn.primary}>
        Confirmă și activează
      </button>
    </form>
  );
}
