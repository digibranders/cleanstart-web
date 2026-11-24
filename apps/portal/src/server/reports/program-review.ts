import type { Clock } from '@/lib/clock';
import { ALL_REGIONS } from '@/lib/domain';
import type { AdminReportsDto } from '@/lib/dto';
import { buildProgramReview, type ProgramReviewDto, type ReportEdition } from '@/lib/program-review';
import type { ReportInsightsDto } from '@/lib/report-insights';
import { previousRange, type RangedReportDto, type ReportRange } from '@/lib/report-metrics';
import type { Viewer } from '@/server/auth/types';
import { assertStaff, withViewer } from '@/server/repo/context';
import { getReportInsights } from '@/server/repo/report-insights';
import { getRangedReport } from '@/server/repo/report-metrics';
import { getAdminReports } from '@/server/repo/reports';

export interface ReportData {
  allTime: AdminReportsDto;
  current: RangedReportDto;
  previous: RangedReportDto;
  insights: ReportInsightsDto;
  previousInsights: ReportInsightsDto;
}

export interface LoadedReview {
  data: ReportData;
  review: ProgramReviewDto;
}

/**
 * Everything the Reports hub and the Partner Program Review need for `range`: the range itself and the range of the same
 * length just before it, plus the all time partner figures. One transaction, only the existing viewer scoped repo
 * calls, so the document shows exactly the rows the viewer may see.
 */
export async function loadProgramReview(viewer: Viewer, range: ReportRange, edition: ReportEdition, clock: Clock): Promise<LoadedReview> {
  assertStaff(viewer);
  const prior = previousRange(range);
  const data = await withViewer(viewer, async (tx): Promise<ReportData> => ({
    allTime: await getAdminReports(tx, viewer, clock),
    current: await getRangedReport(tx, viewer, range),
    previous: await getRangedReport(tx, viewer, prior),
    insights: await getReportInsights(tx, viewer, range),
    previousInsights: await getReportInsights(tx, viewer, prior),
  }));
  const covered = viewer.regions;
  const review = buildProgramReview({
    ...data,
    edition,
    scope: covered === ALL_REGIONS ? 'all' : data.insights.regions.filter((r) => covered.includes(r.key)).map((r) => r.label),
    preparer: { name: viewer.name, role: viewer.role },
    generatedAt: clock.now().toISOString(),
  });
  return { data, review };
}
