import { redirect } from "next/navigation";
import { homeFor, requireKind } from "@/server/auth/viewer";

export default async function AdminIndex(): Promise<never> {
  redirect(homeFor(await requireKind("staff")));
}
