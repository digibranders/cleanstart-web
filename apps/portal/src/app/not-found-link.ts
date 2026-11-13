import { ROUTES } from "@/lib/routes";
import { getViewer, homeFor } from "@/server/auth/viewer";

/** Where "back" goes: the viewer's own home when signed in, otherwise sign in. */
export async function backLink(): Promise<{ href: string; label: string }> {
  const viewer = await getViewer().catch(() => null);
  if (!viewer) return { href: ROUTES.signIn, label: "Back to sign in" };
  const href = homeFor(viewer);
  if (href === ROUTES.admin.approvals) return { href, label: "Back to deal approvals" };
  if (href === ROUTES.partner.overview) return { href, label: "Back to overview" };
  return { href, label: "Back to documents" };
}
