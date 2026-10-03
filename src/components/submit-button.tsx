"use client";
import { useFormStatus } from "react-dom";
import { btn, cn } from "@/components/ui";

export function SubmitButton({ children, variant = "primary", className }: { children: React.ReactNode; variant?: keyof typeof btn; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn(btn[variant], className)}>
      {pending ? "Se procesează" : children}
    </button>
  );
}
