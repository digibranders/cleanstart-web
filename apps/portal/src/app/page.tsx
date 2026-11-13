import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getViewer, homeFor } from "@/server/auth/viewer";

export default async function Home(): Promise<never> {
  const viewer = await getViewer();
  redirect(viewer ? homeFor(viewer) : ROUTES.signIn);
}
