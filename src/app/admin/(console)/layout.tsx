import { requireStaff } from "@/lib/auth";

export default async function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  await requireStaff();
  return children;
}
