import { describe, expect, it } from "vitest";

import {
  type ArticleText,
  type ResourceCandidate,
  baseImageNames,
  firstSentence,
  matchCatalogImage,
  pickEditorImage,
  pickEditorResource,
  pickRelatedResource,
  relationId,
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

  it("matches an everyday-word image name beside a word that makes it the image", () => {
    const a = article({ title: "Official Go Docker Image vs CleanStart Hardened Go Image" });
    expect(matchCatalogImage(a, CATALOG)).toBe("go");
  });

  it("still ignores an everyday-word image name used as a plain word", () => {
    const a = article({ title: "Why teams go further with hardened images", body: "We go and we node." });
    expect(matchCatalogImage(a, CATALOG)).toBeNull();
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

  it("treats SBOM and software bill of materials as the same term", () => {
    const sbom = resource({ slug: "sbom", title: "Software Bill of Materials", summary: "Inventory of components." });
    const a = article({ title: "SBOM 101: What It Is and How It Works" });
    expect(pickRelatedResource(a, [...RESOURCES, sbom])?.slug).toBe("sbom");
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

describe("relationId", () => {
  it("reads an id, a numeric id, or a hydrated doc", () => {
    expect(relationId("7")).toBe("7");
    expect(relationId(7)).toBe("7");
    expect(relationId({ id: 7, slug: "a" })).toBe("7");
  });

  it("returns null for empty values", () => {
    expect(relationId(null)).toBeNull();
    expect(relationId(undefined)).toBeNull();
    expect(relationId({})).toBeNull();
  });
});

describe("pickEditorResource", () => {
  const published = [
    { id: 3, slug: "a" },
    { id: "5", slug: "b" },
  ];

  it("returns the picked resource whether the id is a number, a string or a hydrated doc", () => {
    expect(pickEditorResource(3, published)?.slug).toBe("a");
    expect(pickEditorResource("5", published)?.slug).toBe("b");
    expect(pickEditorResource({ id: 3, slug: "a" }, published)?.slug).toBe("a");
  });

  it("returns null for a pick that is no longer published, so the caller falls back", () => {
    expect(pickEditorResource(99, published)).toBeNull();
  });

  it("returns null when nothing is picked", () => {
    expect(pickEditorResource(null, published)).toBeNull();
  });
});

describe("pickEditorImage", () => {
  it("accepts a catalog slug, ignoring case and spacing", () => {
    expect(pickEditorImage(" Redis ", CATALOG)).toBe("redis");
  });

  it("folds a FIPS variant to its base image", () => {
    expect(pickEditorImage("redis-fips", CATALOG)).toBe("redis");
  });

  it("ignores a slug that is not in the catalog", () => {
    expect(pickEditorImage("not-an-image", CATALOG)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(pickEditorImage("  ", CATALOG)).toBeNull();
    expect(pickEditorImage(null, CATALOG)).toBeNull();
    expect(pickEditorImage(undefined, CATALOG)).toBeNull();
  });
});
