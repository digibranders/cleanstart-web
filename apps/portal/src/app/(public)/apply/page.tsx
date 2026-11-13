import type { Metadata } from "next";
import { Apply } from "@/components/screens/Apply";
import { env } from "@/env";

export const metadata: Metadata = { title: "Apply to become a partner" };

export default function Page(): React.JSX.Element {
  return <Apply turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />;
}
