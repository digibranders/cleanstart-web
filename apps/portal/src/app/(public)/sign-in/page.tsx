import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/screens/SignIn";
import { env } from "@/env";
import { buildSocialProviders } from "@/server/auth/auth";
import { getViewer, homeFor } from "@/server/auth/viewer";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer));
  const configured = buildSocialProviders(env);
  return <SignIn providers={{ google: configured.google !== undefined, microsoft: configured.microsoft !== undefined }} />;
}
