import { permanentRedirect } from "next/navigation";
import { getLegalList } from "@/lib/legal";

/**
 * The legal section has no standalone landing — `/legal` permanently (308)
 * redirects to the lowest-`order` published document so there is one canonical
 * URL per document. `/legal` is intentionally excluded from the sitemap (a
 * redirecting URL must not be advertised); the individual docs are listed there.
 */
export default async function LegalIndexPage(): Promise<never> {
  const docs = await getLegalList().catch(() => []);
  const first = docs[0]?.slug ?? "additional-third-party-terms";
  permanentRedirect(`/legal/${first}`);
}
