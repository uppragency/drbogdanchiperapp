import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { loadCommunity } from "@/lib/community";
import { AppSidebar, MobileBars } from "@/components/app-sidebar";

// Sidebar on desktop, bars on mobile. Pages own their content width.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireUser();
  const isAdmin = viewer.role === "admin";
  const c = await loadCommunity(viewer.id, isAdmin);
  return (
    <div className="flex flex-1 flex-col lg:flex-row lg:items-start">
      <Suspense>
        <AppSidebar isAdmin={isAdmin} name={viewer.firstName} email={viewer.email} categories={c.categories} newByCategory={c.newByCategory} newTotal={c.newTotal} />
        <MobileBars isAdmin={isAdmin} />
      </Suspense>
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</main>
    </div>
  );
}
