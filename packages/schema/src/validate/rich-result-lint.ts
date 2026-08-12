import type { GraphNode } from "../types";
import { primaryType } from "../compose/merge";

/**
 * Rich-result required/recommended-field linter.
 *
 * `validateOverride` (override-validator.ts) only checks STRUCTURAL validity —
 * allowlisted @type, no nested @id, size cap. It does NOT check whether a node
 * carries the fields Google needs to award a rich result (Article→headline,
 * FAQPage→non-empty mainEntity, …). This module adds that semantic layer.
 *
 * Consumed by:
 *   - the Pages (Schema) list health badge (lint the live composed @graph)
 *   - the guided block-builder (show required/recommended fields per @type and
 *     pre-fill a stub template)
 *
 * Pure + isomorphic (runs in the Payload admin browser bundle and Node).
 */

export type LintSeverity = "error" | "warning";

export interface FieldIssue {
  readonly field: string;
  readonly severity: LintSeverity;
  readonly message: string;
}

export interface NodeLint {
  readonly type: string;
  readonly ok: boolean;
  readonly errors: readonly FieldIssue[];
  readonly warnings: readonly FieldIssue[];
}

export interface GraphLint {
  readonly ok: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly nodes: readonly NodeLint[];
  /** Types present in the graph that have no lint rule (informational). */
  readonly unknownTypes: readonly string[];
}

interface TypeRule {
  /** Missing/empty → error (blocks the rich result). */
  readonly required: readonly string[];
  /** Missing/empty → warning (recommended for a richer result). */
  readonly recommended: readonly string[];
  /** Extra per-type semantic checks beyond simple presence. */
  readonly extra?: (node: GraphNode) => readonly FieldIssue[];
}

const isEmpty = (value: unknown): boolean => {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
};

/** mainEntity must be a non-empty array of Question with name + acceptedAnswer.text. */
const lintFaqEntries = (node: GraphNode): FieldIssue[] => {
  const entries = node.mainEntity;
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const issues: FieldIssue[] = [];
  entries.forEach((raw, i) => {
    const q = raw as Record<string, unknown> | null;
    if (q == null || typeof q !== "object") return;
    if (isEmpty(q.name)) {
      issues.push({ field: `mainEntity[${i}].name`, severity: "error", message: "Each question needs a name." });
    }
    const answer = q.acceptedAnswer as Record<string, unknown> | undefined;
    if (answer == null || isEmpty(answer.text)) {
      issues.push({
        field: `mainEntity[${i}].acceptedAnswer.text`,
        severity: "error",
        message: "Each question needs an acceptedAnswer with text.",
      });
    }
  });
  return issues;
};

/**
 * Per-@type field requirements, aligned with Google's rich-result docs.
 * Keep this in sync with ALLOWED_OVERRIDE_TYPES and the auto-emit builders —
 * every type we emit or allow as an override should have a rule here.
 */
export const RICH_RESULT_RULES: Readonly<Record<string, TypeRule>> = {
  Article: { required: ["headline"], recommended: ["image", "datePublished", "author"] },
  NewsArticle: { required: ["headline"], recommended: ["image", "datePublished", "author"] },
  TechArticle: { required: ["headline"], recommended: ["image", "datePublished", "author"] },
  BlogPosting: { required: ["headline"], recommended: ["image", "datePublished", "author"] },
  CreativeWork: { required: ["name"], recommended: ["author", "datePublished"] },
  FAQPage: { required: ["mainEntity"], recommended: [], extra: lintFaqEntries },
  QAPage: { required: ["mainEntity"], recommended: [] },
  HowTo: { required: ["name", "step"], recommended: ["image", "totalTime"] },
  Event: {
    required: ["name", "startDate", "location"],
    recommended: ["endDate", "image", "offers", "description"],
  },
  JobPosting: {
    required: ["title", "datePosted", "hiringOrganization", "jobLocation"],
    recommended: ["baseSalary", "validThrough", "employmentType"],
  },
  VideoObject: {
    required: ["name", "thumbnailUrl", "uploadDate"],
    recommended: ["description", "contentUrl", "embedUrl"],
  },
  SoftwareApplication: {
    required: ["name"],
    recommended: ["applicationCategory", "operatingSystem", "offers", "aggregateRating"],
  },
  WebApplication: {
    required: ["name"],
    recommended: ["applicationCategory", "offers"],
  },
  Service: { required: ["name"], recommended: ["provider", "description", "areaServed"] },
  Course: { required: ["name", "description"], recommended: ["provider"] },
  Dataset: { required: ["name", "description"], recommended: ["creator", "license"] },
  WebPage: { required: ["name"], recommended: ["description", "url", "isPartOf"] },
  AboutPage: { required: ["name"], recommended: ["description", "url", "isPartOf"] },
  ContactPage: { required: ["name"], recommended: ["description", "url", "isPartOf"] },
  CollectionPage: { required: ["name"], recommended: ["description", "url", "isPartOf"] },
  ProfilePage: { required: ["mainEntity"], recommended: ["dateCreated"] },
  Person: { required: ["name"], recommended: ["url", "jobTitle"] },
  Organization: { required: ["name", "url"], recommended: ["logo", "sameAs"] },
  WebSite: { required: ["name", "url"], recommended: ["publisher"] },
  BreadcrumbList: { required: ["itemListElement"], recommended: [] },
  ItemList: { required: ["itemListElement"], recommended: ["name"] },
  // reviewRating is recommended, not required: Schema.org's own Review type
  // doesn't mandate a rating, and a sourced testimonial with no rating data
  // is a valid, honest Review — fabricating one to satisfy this rule would
  // be worse than omitting it.
  Review: { required: ["itemReviewed", "author"], recommended: ["reviewRating"] },
  AggregateRating: {
    required: ["itemReviewed", "ratingValue"],
    recommended: ["ratingCount", "reviewCount"],
  },
  SpeakableSpecification: { required: [], recommended: ["xpath", "cssSelector"] },
};

/** Lint a single graph node against its @type rule. */
export const lintNode = (node: GraphNode): NodeLint => {
  const type = primaryType(node);
  const rule = RICH_RESULT_RULES[type];
  if (rule == null) {
    return { type, ok: true, errors: [], warnings: [] };
  }
  const errors: FieldIssue[] = [];
  const warnings: FieldIssue[] = [];

  for (const field of rule.required) {
    if (isEmpty((node as Record<string, unknown>)[field])) {
      errors.push({ field, severity: "error", message: `Missing required field "${field}".` });
    }
  }
  for (const field of rule.recommended) {
    if (isEmpty((node as Record<string, unknown>)[field])) {
      warnings.push({ field, severity: "warning", message: `Recommended field "${field}" is not set.` });
    }
  }
  if (rule.extra) {
    for (const issue of rule.extra(node)) {
      (issue.severity === "error" ? errors : warnings).push(issue);
    }
  }
  return { type, ok: errors.length === 0, errors, warnings };
};

/** Lint every node in a composed @graph. */
export const lintGraph = (nodes: readonly GraphNode[]): GraphLint => {
  const results = nodes.map(lintNode);
  const errorCount = results.reduce((n, r) => n + r.errors.length, 0);
  const warningCount = results.reduce((n, r) => n + r.warnings.length, 0);
  const unknownTypes = results
    .filter((r) => RICH_RESULT_RULES[r.type] == null)
    .map((r) => r.type);
  return {
    ok: errorCount === 0,
    errorCount,
    warningCount,
    nodes: results,
    unknownTypes: [...new Set(unknownTypes)],
  };
};
