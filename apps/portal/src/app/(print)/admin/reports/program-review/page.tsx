import type { Metadata } from "next";
import { ProgramReviewDocument } from "@/components/reports/program-review/ProgramReviewPages";
import { ReportToolbar } from "@/components/reports/program-review/ReportToolbar";
import "@/components/reports/program-review/print-route.css";
import { systemClock } from "@/lib/clock";
import { PROGRAM_REVIEW_PATH, parseEdition, programReviewQuery, REPORT_EDITIONS, type ReportEdition } from "@/lib/program-review";
import { parseReportRange } from "@/lib/report-metrics";
import { ROUTES } from "@/lib/routes";
import { requireCan } from "@/server/auth/viewer";
import { loadProgramReview } from "@/server/reports/program-review";

export const metadata: Metadata = { title: "Partner Program Review" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan("report.read");
  const params = await searchParams;
  const range = parseReportRange(params, systemClock.today());
  const edition = parseEdition(params.edition);
  const { review } = await loadProgramReview(viewer, range, edition, systemClock);
  const editionHref = Object.fromEntries(
    REPORT_EDITIONS.map((e) => [e, `${PROGRAM_REVIEW_PATH}${programReviewQuery(range, e)}`]),
  ) as Record<ReportEdition, string>;
  const autoPrint = (Array.isArray(params.autoprint) ? params.autoprint[0] : params.autoprint) === "1";
  const toolbar = (
    <ReportToolbar
      period={review.period}
      edition={edition}
      editionHref={editionHref}
      backHref={`${ROUTES.admin.reports}${programReviewQuery(range, edition)}`}
      autoPrint={autoPrint}
    />
  );
  return <ProgramReviewDocument dto={review} toolbar={toolbar} />;
}
