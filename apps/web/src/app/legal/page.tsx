import { redirect } from "next/navigation";
import { getLegalList } from "@/lib/legal";

/**
 * The legal section has no standalone landing — `/legal` redirects to the
 * lowest-`order` published document so there is one canonical URL per document.
 */
export default async function LegalIndexPage(): Promise<never> {
  const docs = await getLegalList().catch(() => []);
  const first = docs[0]?.slug ?? "additional-third-party-terms";
  redirect(`/legal/${first}`);
}
