"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert, btn } from "@/components/ui";

export function MfaDisable({ factorIds }: { factorIds: string[] }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function disable() {
    start(async () => {
      setError(null);
      const supabase = createClient();
      for (const id of factorIds) {
        const { error: e } = await supabase.auth.mfa.unenroll({ factorId: id });
        if (e) return setError("Nu am putut dezactiva verificarea. Reconectează-te cu codul din aplicație și încearcă din nou.");
      }
      await supabase.auth.refreshSession();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert>{error}</Alert>}
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className={btn.secondary}>Dezactivează verificarea</button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Contul se va putea folosi doar cu parola. O poți reactiva oricând de pe această pagină.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={disable} disabled={pending} className={btn.primary}>Da, dezactivează</button>
            <button type="button" onClick={() => setConfirm(false)} disabled={pending} className={btn.secondary}>Renunță</button>
          </div>
        </div>
      )}
    </div>
  );
}
