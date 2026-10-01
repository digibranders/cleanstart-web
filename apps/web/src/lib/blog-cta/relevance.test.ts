import { describe, expect, it } from "vitest";

import {
  type ArticleText,
  type ResourceCandidate,
  baseImageNames,
  firstSentence,
  matchCatalogImage,
  pickRelatedResource,
  tokenize,
} from "./relevance";

const article = (over: Partial<ArticleText> = {}): ArticleText => ({
  title: "",
  abstract: "",
  category: "",
  headings: [],
  body: "",
  ...over,
});

const CATALOG = ["redis", "redis-fips", "redis-exporter", "python", "go", "node", "postgres", "cert-manager-controller", "nginx"];

describe("baseImageNames", () => {
  it("folds FIPS variants into their base image", () => {
    expect(baseImageNames(["redis", "redis-fips", "nginx-fips"])).toEqual(["nginx", "redis"]);
  });
});

describe("matchCatalogImage", () => {
  it("matches the image named in the title", () => {
    const a = article({ title: "Official Redis Docker Image vs CleanStart Redis Image" });
    expect(matchCatalogImage(a, CATALOG)).toBe("redis");
  });

  it("prefers the canonical image over a longer name with the same score", () => {
    const a = article({ title: "Redis exporter and Redis in production" });
    expect(matchCatalogImage(a, CATALOG)).toBe("redis");
  });

  it("matches hyphenated names written with spaces", () => {
    const a = article({ headings: ["Running cert manager controller with least privilege"] });
    expect(matchCatalogImage(a, CATALOG)).toBe("cert-manager-controller");
  });

  it("ignores ambiguous names used as ordinary words", () => {
    const a = article({ body: "Teams go fast. Each node in the graph matters. We go further." });
    expect(matchCatalogImage(a, CATALOG)).toBeNull();
  });

  it("still reaches ambiguous names through an alias", () => {
    const a = article({ title: "Hardening Golang services", body: "golang golang" });
    expect(matchCatalogImage(a, CATALOG)).toBe("go");
  });

  it("does not match inside other words or file names", () => {
    const a = article({ body: "pythonic code, nginx.conf tuning, redisearch" });
    expect(matchCatalogImage(a, CATALOG)).toBeNull();
  });

  it("returns null below the confidence threshold", () => {
    const a = article({ body: "We also briefly mention python once." });
    expect(matchCatalogImage(a, CATALOG)).toBeNull();
  });
});

const resource = (over: Partial<ResourceCandidate> & { slug: string }): ResourceCandidate => ({
  title: "",
  summary: "",
  gated: false,
  publishedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const RESOURCES: ResourceCandidate[] = [
  resource({
    slug: "kubernetes-policy",
    title: "The Kubernetes Policy Trust Gap",
    summary: "Admission control and policy engines for Kubernetes clusters.",
    gated: true,
    publishedAt: "2026-08-01T00:00:00.000Z",
  }),
  resource({
    slug: "fips-compliance",
    title: "FIPS Compliance",
    summary: "FIPS 140-3 validated cryptography in container images.",
  }),
  resource({
    slug: "ciso-guide",
    title: "2026 CISO Guide to Software Trust",
    summary: "Software trust is a board-level priority for container security.",
    gated: true,
    publishedAt: "2026-09-28T00:00:00.000Z",
  }),
];

describe("pickRelatedResource", () => {
  it("picks the resource that shares the article's distinctive terms", () => {
    const a = article({
      title: "Why FIPS 140-3 matters for federal workloads",
      body: "FIPS validated modules and cryptography",
    });
    expect(pickRelatedResource(a, RESOURCES)?.slug).toBe("fips-compliance");
  });

  it("weights the article title over body mentions", () => {
    const a = article({
      title: "Kubernetes admission policy in practice",
      body: "fips is mentioned once here",
    });
    expect(pickRelatedResource(a, RESOURCES)?.slug).toBe("kubernetes-policy");
  });

  it("falls back to the newest gated resource when nothing is related", () => {
    const a = article({ title: "Our team offsite recap", body: "We went hiking." });
    expect(pickRelatedResource(a, RESOURCES)?.slug).toBe("ciso-guide");
  });

  it("returns null for an empty resource list", () => {
    expect(pickRelatedResource(article({ title: "x" }), [])).toBeNull();
  });
});

describe("tokenize", () => {
  it("drops stopwords and short tokens and folds simple plurals", () => {
    expect(tokenize("The images and the containers of an SBOM")).toEqual(["image", "container", "sbom"]);
  });
});

describe("firstSentence", () => {
  it("returns the first full sentence of a truncated description", () => {
    expect(firstSentence("The CleanStart Redis image is hardened. Built on a minimal base OS with…")).toBe(
      "The CleanStart Redis image is hardened.",
    );
  });

  it("returns null when the only sentence was cut off", () => {
    expect(firstSentence("A production-ready image built on a minimal…")).toBeNull();
  });
});
