'use client';

import { useConfig } from '@payloadcms/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';

type JobOption = { readonly id: number | string; readonly title: string };

const FILTER_KEY = 'where[job][equals]';

/**
 * "Job" dropdown above the Applications and Resumes lists. Defaults to all
 * jobs; picking one filters the list through Payload's own `where` query
 * string, so it combines with search, sort and the column picker. Mounted via
 * beforeListTable on both collections.
 */
export const JobFilter = (): ReactElement => {
  const { config } = useConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<readonly JobOption[]>([]);
  const [failed, setFailed] = useState(false);
  const serverURL = config?.serverURL ?? '';
  const selected = searchParams.get(FILTER_KEY) ?? '';

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${serverURL}/api/jobs?limit=200&depth=0&sort=title&select[title]=true`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`jobs request failed: ${res.status}`);
        return res.json() as Promise<{ docs?: JobOption[] }>;
      })
      .then((body) => setJobs(body.docs ?? []))
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) setFailed(true);
      });
    return () => controller.abort();
  }, [serverURL]);

  const onChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const next = new URLSearchParams(searchParams.toString());
    if (event.target.value) next.set(FILTER_KEY, event.target.value);
    else next.delete(FILTER_KEY);
    next.delete('page');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="cs-job-filter">
      <label className="cs-job-filter__label" htmlFor="cs-job-filter">
        Job
      </label>
      <select
        id="cs-job-filter"
        className="cs-job-filter__select"
        value={selected}
        onChange={onChange}
        disabled={failed}
      >
        <option value="">All jobs</option>
        {jobs.map((job) => (
          <option key={job.id} value={String(job.id)}>
            {job.title}
          </option>
        ))}
      </select>
      {failed ? <span className="cs-job-filter__error">Could not load jobs.</span> : null}
    </div>
  );
};

export default JobFilter;
