import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "./admin-nav";

// Role check only. Two step verification is optional and only challenged for admins who enrolled it.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await requireUser();
  if (viewer.role !== "admin") redirect("/feed");
  return (
    <>
      <AppHeader isAdmin active="admin" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
        <AdminNav />
        {children}
      </main>
    </>
  );
}
