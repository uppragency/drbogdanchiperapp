import { redirect } from "next/navigation";
import { requireAdmin, requireStaff } from "@/lib/auth";

// Everything outside resources, comments and own security is admin only. A moderator is sent to the resource list.
export default async function AdminOnlyLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await requireStaff();
  if (viewer.role === "moderator") redirect("/admin/resurse");
  await requireAdmin();
  return children;
}
