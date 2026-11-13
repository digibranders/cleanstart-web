import { redirect } from "next/navigation";
import { homeFor, requireKind } from "@/server/auth/viewer";

export default async function PartnerIndex(): Promise<never> {
  redirect(homeFor(await requireKind("partner")));
}
