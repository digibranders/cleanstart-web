import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "@/lib/jobs";

vi.mock("@/lib/jobs", () => ({ getJobs: vi.fn() }));

import { getJobs } from "@/lib/jobs";
import { loadOpenRoles } from "./open-roles";

const job = (over: Partial<Job>): Job =>
  ({
    id: 1,
    title: "Sales Engineer",
    slug: "sales-engineer",
    source: "cms",
    locations: [
      { id: 9, name: "Singapore", slug: "singapore", type: "city", isoCountry: "SG" },
    ],
    ...over,
  }) as Job;

const list = (docs: Job[]) => ({
  docs,
  totalDocs: docs.length,
  hasNextPage: false,
  page: 1,
  totalPages: 1,
});

describe("loadOpenRoles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps open jobs to {title, slug, location} and requests open roles", async () => {
    vi.mocked(getJobs).mockResolvedValue(list([job({})]));
    expect(await loadOpenRoles()).toEqual([
      { title: "Sales Engineer", slug: "sales-engineer", location: "Singapore" },
    ]);
    expect(getJobs).toHaveBeenCalledWith({ status: "open", limit: 100 });
  });

  it("falls back to Remote then null when there is no resolved location", async () => {
    vi.mocked(getJobs).mockResolvedValue(
      list([
        job({ slug: "a", locations: [], remote: true }),
        job({ slug: "b", locations: [], remote: false }),
      ]),
    );
    expect((await loadOpenRoles()).map((r) => r.location)).toEqual(["Remote", null]);
  });

  it("ignores unresolved relationship ids when picking a location", async () => {
    vi.mocked(getJobs).mockResolvedValue(
      list([job({ slug: "c", locations: [12, { id: 9, name: "Mumbai", slug: "mumbai", type: "city", isoCountry: "IN" }] })]),
    );
    expect((await loadOpenRoles())[0]?.location).toBe("Mumbai");
  });

  it("returns [] when getJobs throws (fail-soft)", async () => {
    vi.mocked(getJobs).mockRejectedValue(new Error("CMS down"));
    expect(await loadOpenRoles()).toEqual([]);
  });
});
