import type { Metadata } from "next";
import { CoverPage, SummaryPage } from "@/components/reports/program-review/ProgramReviewPages";
import { AdminReports } from "@/components/screens/AdminReports";
import { systemClock } from "@/lib/clock";
import { parseEdition } from "@/lib/program-review";
import { parseReportRange } from "@/lib/report-metrics";
import { requireCan } from "@/server/auth/viewer";
import { loadProgramReview } from "@/server/reports/program-review";

export const metadata: Metadata = { title: "Reports" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan("report.read");
  const today = systemClock.today();
  const params = await searchParams;
  const range = parseReportRange(params, today);
  const edition = parseEdition(params.edition);
  const { data, review } = await loadProgramReview(viewer, range, edition, systemClock);
  return (
    <AdminReports
      review={review}
      ranged={data.current}
      insights={data.insights}
      allTime={data.allTime}
      today={today}
      edition={edition}
      cover={<CoverPage dto={review} />}
      summary={<SummaryPage dto={review} />}
    />
  );
}
