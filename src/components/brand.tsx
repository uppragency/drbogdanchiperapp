import Image from "next/image";
import { t } from "@/lib/texts";

export function BrandMark({ height = 28 }: { height?: number }) {
  const w = Math.round(height * 0.62);
  return (
    <>
      <Image src="/brand/mark.png" alt="" width={w} height={height} className="w-auto dark:hidden" style={{ height }} priority />
      <Image src="/brand/mark-dark.png" alt="" width={w} height={height} className="hidden w-auto dark:block" style={{ height }} priority />
    </>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span role="img" aria-label={t.brand} className={`inline-flex items-center ${className}`}>
      <BrandMark height={34} />
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
