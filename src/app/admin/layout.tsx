import { redirect } from "next/navigation";
import { fullName, isStaff, requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "./admin-nav";

// Role check only. Two step verification is optional and only challenged for admins who enrolled it.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await requireUser();
  if (!isStaff(viewer.role)) redirect("/feed");
  return (
    <>
      <AppHeader viewerId={viewer.id} isAdmin initials={((viewer.firstName?.[0] ?? "") + (viewer.lastName?.[0] ?? "")).toUpperCase() || viewer.email[0]?.toUpperCase() || "?"} name={fullName(viewer) || viewer.email} email={viewer.email} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
        <AdminNav role={viewer.role === "admin" ? "admin" : "moderator"} />
        {children}
      </main>
    </>
  );
}
