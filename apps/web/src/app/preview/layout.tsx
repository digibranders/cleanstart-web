import type { Metadata } from "next";

import { PreviewModeBanner } from "@/components/PreviewModeBanner";

/**
 * Every `/preview/*` URL is a stakeholder-review link rendered with draft
 * content. The yellow banner is always shown (no cookie / no client JS gate)
 * and the route is marked `noindex` so leaked links don't end up in Google.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <PreviewModeBanner />
      {children}
    </>
  );
}
