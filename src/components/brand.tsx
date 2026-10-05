import Image from "next/image";
import { t } from "@/lib/texts";

// Official logo files, used exactly as supplied (269x260): logo.png for light, logo-dark.png (white M and text) for dark. Do not edit or recolor.
export function FullLogo({ height = 96, className = "" }: { height?: number; className?: string }) {
  const w = Math.round(height * (269 / 260));
  return (
    <>
      <Image src="/brand/logo.png" alt={t.brand} width={w} height={height} className={`dark:hidden ${className}`} style={{ height, width: "auto" }} priority />
      <Image src="/brand/logo-dark.png" alt={t.brand} width={w} height={height} className={`hidden dark:block ${className}`} style={{ height, width: "auto" }} priority />
    </>
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
