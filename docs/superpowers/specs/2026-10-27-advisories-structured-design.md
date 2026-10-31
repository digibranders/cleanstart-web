# Advisories: structured security advisories

Approved 2026-10-27. Replaces the blog-style advisory shipped on 2026-10-23
(`15fbe79f`), which had no published content on prod.

## Source

Client brief (Biplab Paul, 2026-10-26) and a sample advisory for
CVE-2026-111497 (Node.js Brotli decoder out-of-bounds write).

- Listing shows Technology, vulnerability name, CVE ID, publish date, status.
- Filters: Technology, Status. Search: CVE ID.
- Detail shows CVE ID and name, severity, vulnerability description, impacted
  packages and versions, resolution.
- Status values: Identified, In progress, Fixed, Not affected.
- Severity is the CVSS score as a decimal (9.2). The label is derived.
- Technology is free text. Icons are out of scope until images.cleanstart.com
  can supply them.
- One advisory can carry several CVEs.
- Impacted packages list affected versions only.
- Listing is a plain table with no outline, not cards.

## CMS (`advisories`)

| Field | Type | Notes |
|---|---|---|
| `title` | text | Vulnerability name |
| `cves` | text, hasMany | Each matches `CVE-YYYY-NNNN+`, stored upper-case |
| `technology` | text | Free text; the listing filter is built from values in use |
| `cvssScore` | number 0.0 to 10.0 | Label from CVSS bands: 9.0 Critical, 7.0 High, 4.0 Medium, above 0 Low, 0 None |
| `fixStatus` | select, labelled Status | `identified`, `in_progress`, `fixed`, `not_affected`. Not named `status`: its enum would collide with the drafts `_status` enum (`enum_advisories_status`) |
| `body` | rich text | Labelled "Vulnerability"; reuses the existing column |
| `impact` | rich text | "Impacted packages and versions": table plus notes |
| `resolution` | rich text | Tables, inline code, code blocks |
| `abstract`, `slug`, `publishedAt`, SEO | as before | `abstract` stays the SEO description fallback |

Hero image, authors, reviewer, FAQs, featured flag and the table of contents
stay defined but hidden from editors, so their columns remain untouched until
they are dropped in a separate, approved migration. Advisories leave the publish
gate's hero-image check.

## Listing (`/advisories`)

Static page, filtered in the browser like `/blogs`. Hero keeps the title,
subtitle and search bar. Below it, two pill rows (Technology, Status) and a
table: Technology, Vulnerability, CVE IDs, Published, Status. Filters and search
live in the URL (`technology`, `status`, `q`). Search matches any CVE ID or the
name, case-insensitive and partial. Rows stack on mobile. No pagination yet.

## Detail (`/advisories/[slug]`)

H1 `CVE-A, CVE-B: Name`. Meta line `CVSS: 9.2 Critical · Published: <date>`.
Sections in order: Vulnerability, Impacted packages and versions, Resolution,
each rendered with the existing article styles. Breadcrumb, SEO metadata,
Article JSON-LD and the newsletter card stay. No TOC, author block or related
posts.

## Clean-up

The blog listing and article components no longer serve advisories, so the
`section` prop added to them on 2026-10-23 is removed again, except on
`BlogsHero`, which the advisory listing still uses.
