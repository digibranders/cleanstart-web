import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApplyDone } from "@/components/screens/ApplyDone";
import { systemClock } from "@/lib/clock";
import { ROUTES } from "@/lib/routes";
import { loadRegionList } from "@/server/region-names";
import { APPLY_RECEIPT_COOKIE, verifyApplyReceipt } from "@/server/apply-receipt";

export const metadata: Metadata = { title: "Application received" };

export default async function Page(): Promise<React.JSX.Element> {
  const value = (await cookies()).get(APPLY_RECEIPT_COOKIE)?.value ?? "";
  const receipt = verifyApplyReceipt(value, systemClock.now());
  if (!receipt) redirect(ROUTES.apply);
  return <ApplyDone receipt={receipt} regions={await loadRegionList()} />;
}
