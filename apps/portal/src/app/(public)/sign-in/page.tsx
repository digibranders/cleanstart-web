import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/screens/SignIn";
import { getViewer, homeFor } from "@/server/auth/viewer";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer));
  return <SignIn />;
}
