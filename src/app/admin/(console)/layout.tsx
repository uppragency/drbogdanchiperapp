import { requireAdmin } from "@/lib/auth";

export default async function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return children;
}
