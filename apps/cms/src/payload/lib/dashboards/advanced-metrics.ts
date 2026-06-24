import type { MetricDelta, PositionBucket, RealtimePayload, ScatterPoint } from './overview-types';

export const computeDelta = (value: number, prior: number): MetricDelta => ({
  value,
  deltaPct: prior > 0 ? (value - prior) / prior : null,
});

export const bucketPositions = (rows: Array<{ position: number }>): PositionBucket[] => {
  const b = { '1–3': 0, '4–10': 0, '11–20': 0, '21+': 0 };
  for (const r of rows) {
    if (r.position <= 3) b['1–3'] += 1;
    else if (r.position <= 10) b['4–10'] += 1;
    else if (r.position <= 20) b['11–20'] += 1;
    else b['21+'] += 1;
  }
  return (Object.keys(b) as Array<keyof typeof b>).map((label) => ({ label, count: b[label] }));
};

export const buildScatter = (
  rows: Array<{ position: number; ctr: number; impressions: number }>,
  cap: number,
): ScatterPoint[] =>
  [...rows]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, cap)
    .map((r) => ({ position: r.position, ctr: r.ctr, impressions: r.impressions }));

interface RtBatch {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string | null }> | null;
    metricValues?: Array<{ value?: string | null }> | null;
  }> | null;
}

export const shapeRealtime = (totalRows: RtBatch, pageRows: RtBatch): RealtimePayload => ({
  activeUsers: Number(totalRows.rows?.[0]?.metricValues?.[0]?.value ?? 0),
  byPage: (pageRows.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? '',
    users: Number(r.metricValues?.[0]?.value ?? 0),
  })),
});
