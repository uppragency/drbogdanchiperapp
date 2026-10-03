import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";

// v1b replaces this redirect with the public landing page.
export default async function Home() {
  const viewer = await getViewer();
  redirect(viewer ? "/feed" : "/login");
}
