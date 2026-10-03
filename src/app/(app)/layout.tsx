import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireUser();
  return (
    <>
      <AppHeader isAdmin={viewer.role === "admin"} active="feed" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
    </>
  );
}
