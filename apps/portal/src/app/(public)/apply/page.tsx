import type { Metadata } from "next";
import { Apply } from "@/components/screens/Apply";
import { env } from "@/env";
import { SYSTEM_ACTORS } from "@/server/auth/types";
import { withSystem } from "@/server/repo/context";
import { listRegions } from "@/server/repo/regions";

export const metadata: Metadata = { title: "Apply to become a partner" };

// The Turnstile site key is a runtime variable; a prerendered page would freeze it at build time.
export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.JSX.Element> {
  const regions = (await withSystem(SYSTEM_ACTORS.portal, (tx) => listRegions(tx))).filter((r) => r.active);
  return <Apply turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} regions={regions} />;
}
