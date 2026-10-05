import Image from "next/image";
import { t } from "@/lib/texts";

// The official logo file, used exactly as supplied (public/brand/logo.png, 269x260). Do not edit or recolor it.
// In dark mode it sits on a white chip so the black parts stay readable.
export function FullLogo({ height = 96, className = "" }: { height?: number; className?: string }) {
  const w = Math.round(height * (269 / 260));
  return (
    <Image src="/brand/logo.png" alt={t.brand} width={w} height={height} className={`dark:rounded-lg dark:bg-white dark:p-1 ${className}`} style={{ height, width: "auto" }} priority />
  );
}

export function BrandMark({ height = 44 }: { height?: number }) {
  return <FullLogo height={height} />;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <FullLogo height={48} />
    </span>
  );
}
