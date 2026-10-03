import Image from "next/image";
import { t } from "@/lib/texts";

export function BrandMark({ height = 28 }: { height?: number }) {
  return <Image src="/brand/mark.png" alt="" width={Math.round(height * 0.64)} height={height} className="w-auto" style={{ height }} priority />;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-lg font-bold tracking-tight ${className}`}>
      <BrandMark />
      {t.brand}
    </span>
  );
}

// Full logo. The dark variant swaps the black parts to white so it stays readable in dark mode.
export function FullLogo({ height = 96 }: { height?: number }) {
  const w = Math.round(height * 1.118);
  return (
    <>
      <Image src="/brand/logo.png" alt={t.brand} width={w} height={height} className="dark:hidden" style={{ height, width: "auto" }} priority />
      <Image src="/brand/logo-dark.png" alt={t.brand} width={w} height={height} className="hidden dark:block" style={{ height, width: "auto" }} priority />
    </>
  );
}
