import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

// Pages own their own width so the feed hero can run edge to edge.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireUser();
  return (
    <>
      <AppHeader isAdmin={viewer.role === "admin"} active="feed" />
      <main className="flex-1">{children}</main>
    </>
  );
}
