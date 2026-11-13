import type { Metadata } from "next";
import { Apply } from "@/components/screens/Apply";
import { env } from "@/env";

export const metadata: Metadata = { title: "Apply to become a partner" };

// The Turnstile site key is a runtime variable; a prerendered page would freeze it at build time.
export const dynamic = "force-dynamic";

export default function Page(): React.JSX.Element {
  return <Apply turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />;
}
