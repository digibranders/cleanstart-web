import { cache } from "react";
import { getJobs, type Job, type JobLocation } from "@/lib/jobs";

export type OpenRole = { title: string; slug: string; location: string | null };

function primaryLocation(job: Job): string | null {
  const resolved = (job.locations ?? []).find(
    (entry): entry is JobLocation => typeof entry === "object" && entry !== null,
  );
  if (resolved) return resolved.name;
  return job.remote ? "Remote" : null;
}

/**
 * Open roles for the nav, newest first. Uncached core — exported for tests.
 * Fail-soft: any CMS error yields an empty list so the nav never blocks.
 */
export async function loadOpenRoles(): Promise<OpenRole[]> {
  try {
    const { docs } = await getJobs({ status: "open", limit: 50 });
    return docs.map((job) => ({
      title: job.title,
      slug: job.slug,
      location: primaryLocation(job),
    }));
  } catch {
    return [];
  }
}

/** Per-request memoized open roles for nav rendering. */
export const fetchOpenRoles = cache(loadOpenRoles);
