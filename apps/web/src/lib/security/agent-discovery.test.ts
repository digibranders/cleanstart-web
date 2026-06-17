import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  AGENT_DISCOVERY_LINK_HEADER,
  API_CATALOG,
  API_CATALOG_CONTENT_TYPE,
  API_CATALOG_PATH,
} from "./agent-discovery";

const catalogFile = fileURLToPath(
  new URL("../../../public/.well-known/api-catalog", import.meta.url),
);

/** Parse the RFC 8288 `Link` header into `{ href, rel }` entries. */
function parseLinkHeader(value: string): { href: string; rel: string }[] {
  return value.split(/,\s*(?=<)/).map((part) => {
    const href = part.match(/^<([^>]+)>/)?.[1] ?? "";
    const rel = part.match(/rel="([^"]+)"/)?.[1] ?? "";
    return { href, rel };
  });
}

describe("agent-discovery Link header", () => {
  const links = parseLinkHeader(AGENT_DISCOVERY_LINK_HEADER);

  it("advertises registered, agent-useful relation types", () => {
    const rels = links.map((l) => l.rel);
    expect(rels).toContain("api-catalog");
    expect(rels).toContain("sitemap");
    expect(rels).toContain("service-desc");
  });

  it("points api-catalog at the well-known catalog path", () => {
    const catalog = links.find((l) => l.rel === "api-catalog");
    expect(catalog?.href).toBe(API_CATALOG_PATH);
  });

  it("targets root-relative, agent-resolvable URLs", () => {
    for (const { href } of links) {
      expect(href.startsWith("/")).toBe(true);
    }
  });
});

describe("api-catalog document", () => {
  const raw = readFileSync(catalogFile, "utf8");

  it("is valid RFC 9264 link-set JSON matching the source of truth", () => {
    expect(JSON.parse(raw)).toEqual(API_CATALOG);
  });

  it("is anchored at the site root", () => {
    expect(API_CATALOG.linkset[0]?.anchor).toBe("/");
  });

  it("only lists root-relative targets", () => {
    for (const context of API_CATALOG.linkset) {
      for (const [key, value] of Object.entries(context)) {
        if (key === "anchor" || typeof value === "string") continue;
        for (const target of value) {
          expect(target.href.startsWith("/")).toBe(true);
          expect(target.type.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("declares the RFC 9264 link-set media type", () => {
    expect(API_CATALOG_CONTENT_TYPE).toBe("application/linkset+json");
  });
});
