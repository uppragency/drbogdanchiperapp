"use client";
import { useFormStatus } from "react-dom";
import { btn, cn } from "@/components/ui";
import { useTx } from "@/components/locale-provider";

export function SubmitButton({ children, variant = "primary", className }: { children: React.ReactNode; variant?: keyof typeof btn; className?: string }) {
  const { pending } = useFormStatus();
  const tx = useTx();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn(btn[variant], className)}>
      {pending ? tx("Se procesează", "Processing") : children}
    </button>
  );
}
