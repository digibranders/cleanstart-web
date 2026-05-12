import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { normalizeDepartment, normalizeEmploymentType } from '../../../apps/cms/src/payload/lib/webflow-import/job-normalize';
import { resolveJobLocation } from '../../../apps/cms/src/payload/lib/webflow-import/job-locations';

export const transformJob = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  const department = normalizeDepartment(row.department);
  const jobType = normalizeEmploymentType(row.type ?? row.jobType);
  const normalizedLocation = resolveJobLocation(row);
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title: (row.name as string) ?? '',
    slug,
    body: row.description ?? row.body ?? null,
    department: department ?? null,
    jobType: jobType ?? null,
    applyUrl: row['apply-url'] ?? row.applyUrl ?? null,
    _rawJobLocation: normalizedLocation ?? null,
  };
};
