import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Shape system: controls 12px, cards 20px. Single accent colour.
const base =
  "inline-flex items-center justify-center gap-2 rounded-control px-5 h-11 text-sm font-semibold whitespace-nowrap transition-colors active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none";
export const btn = {
  primary: cn(base, "bg-accent text-accent-ink hover:bg-accent-hover"),
  secondary: cn(base, "border border-line bg-surface text-ink hover:bg-surface2"),
  ghost: cn(base, "text-muted hover:text-ink hover:bg-surface2"),
  danger: cn(base, "bg-danger-bg text-danger hover:bg-danger hover:text-bg"),
};

export function LinkButton({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: keyof typeof btn }) {
  return <Link {...props} className={cn(btn[variant], className)} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("rounded-card border border-line bg-surface p-6 md:p-8", className)} />;
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  autoComplete,
  help,
  error,
  placeholder,
  inputMode,
  minLength,
  disabled,
}: {
  disabled?: boolean;
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  autoComplete?: string;
  help?: string;
  error?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text" | "email";
  minLength?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        minLength={minLength}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={help ? `${name}-help` : undefined}
        className="h-11 rounded-control border border-line bg-bg px-4 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />
      {help && (
        <p id={`${name}-help`} className="text-sm text-muted">
          {help}
        </p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function TextArea({ label, name, defaultValue, rows = 6, help }: { label: string; name: string; defaultValue?: string; rows?: number; help?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="rounded-control border border-line bg-bg px-4 py-3 text-base text-ink focus:border-accent focus:outline-none"
      />
      {help && <p className="text-sm text-muted">{help}</p>}
    </div>
  );
}

export function Select({ label, name, defaultValue, children, required }: { label: string; name: string; defaultValue?: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-11 rounded-control border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none"
      >
        {children}
      </select>
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "ok"; children: ReactNode }) {
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("rounded-control px-4 py-3 text-sm", kind === "error" ? "bg-danger-bg text-danger" : "bg-ok-bg text-ok")}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "ok" | "danger" }) {
  const tones = {
    neutral: "bg-surface2 text-muted",
    accent: "bg-accent text-accent-ink",
    ok: "bg-ok-bg text-ok",
    danger: "bg-danger-bg text-danger",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {children}
    </div>
  );
}
