import { describe, expect, it, vi } from "vitest";

vi.mock("./open-roles", () => ({ fetchOpenRoles: vi.fn() }));

import { fetchOpenRoles } from "./open-roles";
import { fetchOpenRolesCount } from "./careers-feed";

describe("fetchOpenRolesCount", () => {
  it("returns the number of open roles", async () => {
    vi.mocked(fetchOpenRoles).mockResolvedValue([
      { title: "A", slug: "a", location: null },
      { title: "B", slug: "b", location: "Mumbai" },
    ]);
    expect(await fetchOpenRolesCount()).toBe(2);
  });
});
