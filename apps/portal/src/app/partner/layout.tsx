import { Shell } from "@/components/shell/shell";
import { navFor } from "@/lib/routes";
import { requireKind } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getShell } from "@/server/repo/account";

export default async function PartnerLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const viewer = await requireKind("partner");
  const shell = await withViewer(viewer, (tx) => getShell(tx, viewer));
  return (
    <Shell kind="partner" shell={shell} nav={navFor(viewer)}>
      {children}
    </Shell>
  );
}
