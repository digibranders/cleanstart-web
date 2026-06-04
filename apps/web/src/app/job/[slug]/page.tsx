import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { CareerDetailHero } from "@/components/sections/careers/CareerDetailHero";
import { CareerDetailContent } from "@/components/sections/careers/CareerDetailContent";
import { JobApplyForm } from "@/components/sections/careers/JobApplyForm";
import type { LexicalRoot } from "@/lib/blog";
import {
  DEPARTMENT_LABEL,
  EXPERIENCE_LABEL,
  getJobBySlug,
  locationDisplay,
  resolvedLocations,
  type JobEmploymentType,
} from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, jobPostingSchema } from "@/lib/seo/jsonld";

const SCHEMA_EMPLOYMENT_TYPE: Record<JobEmploymentType, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
};

interface CareerDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CareerDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug).catch(() => null);
  if (!job) {
    return buildPageMetadata({
      title: "Career opening",
      description: "Open role at CleanStart.",
      path: `/job/${slug}`,
      noindex: true,
    });
  }
  const departmentLabel = job.department
    ? DEPARTMENT_LABEL[job.department]
    : null;
  const descriptionParts = [
    `Apply for the ${job.title} role at CleanStart`,
    departmentLabel ? `in ${departmentLabel}` : null,
    `(${locationDisplay(job)})`,
  ].filter(Boolean);
  return buildPageMetadata({
    title: job.title,
    eyebrow: "Careers",
    description: descriptionParts.join(" "),
    path: `/job/${job.slug}`,
    type: "article",
    modifiedTime: job.updatedAt ?? undefined,
    noindex: job.hiringStatus === "closed",
  });
}

export default async function CareerDetailPage({
  params,
}: CareerDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const job = await getJobBySlug(slug).catch(() => null);
  if (!job) notFound();

  // Older CMS bodies prefix the content with a single-line italic department
  // label (e.g. "Marketing", "Sales") as the first paragraph. Lift that line
  // into the hero meta and strip it from the body so it doesn't render twice.
  const { departmentFromBody, bodyWithoutDeptLine } = extractLeadingDepartment(
    job.body ?? null,
  );

  const departmentLabel = job.department
    ? DEPARTMENT_LABEL[job.department]
    : (departmentFromBody ?? null);
  const experienceLabel = job.experienceLevel
    ? `${EXPERIENCE_LABEL[job.experienceLevel]} experience`
    : null;

  const meta = [
    { label: "Location", value: locationDisplay(job) },
    ...(departmentLabel
      ? [{ label: "Department", value: departmentLabel }]
      : []),
    ...(experienceLabel
      ? [{ label: "Experience", value: experienceLabel }]
      : []),
  ];

  // JobPosting requires a description. Build it from the body paragraphs,
  // falling back to a one-line summary when the body is empty.
  const jobDescription =
    (bodyWithoutDeptLine?.root?.children ?? [])
      .map((node) => collectText(node as unknown as LexicalTextLike).trim())
      .filter(Boolean)
      .join("\n\n") ||
    `Apply for the ${job.title} role at CleanStart${
      departmentLabel ? ` in ${departmentLabel}` : ""
    } (${locationDisplay(job)}).`;

  return (
    <>
      <JsonLd
        id={`career-breadcrumbs-${job.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Careers", path: "/careers" },
          { name: job.title },
        ])}
      />
      {/* Omit JobPosting on closed roles — Google penalises expired postings
          that linger in the index, and closed roles are already noindex. */}
      {job.hiringStatus !== "closed" ? (
        <JsonLd
          id={`career-jobposting-${job.slug}`}
          data={jobPostingSchema({
            title: job.title,
            description: jobDescription,
            path: `/job/${job.slug}`,
            datePosted: job.publishedAt ?? job.updatedAt ?? undefined,
            validThrough: job.applicationDeadline ?? job.expiresAt ?? undefined,
            employmentType: job.employmentType
              ? SCHEMA_EMPLOYMENT_TYPE[job.employmentType]
              : undefined,
            locations: resolvedLocations(job).map((l) => ({
              name: l.name,
              isoCountry: l.isoCountry,
              type: l.type,
            })),
            remote: job.remote ?? undefined,
            baseSalary: job.salaryRange ?? undefined,
            identifier: job.slug,
          })}
        />
      ) : null}
      <Header />
      <main>
        <CareerDetailHero title={job.title} meta={meta} />
        <CareerDetailContent body={bodyWithoutDeptLine} />
        {/* CMS-native, open roles accept applications on-site. ATS roles keep
            their existing external-link behaviour (no form rendered). */}
        {job.source === "cms" && job.hiringStatus === "open" ? (
          <JobApplyForm jobSlug={job.slug} jobTitle={job.title} />
        ) : null}
      </main>
      <Footer />
    </>
  );
}

interface LexicalTextLike {
  type: string;
  text?: string;
  children?: LexicalTextLike[];
}

function collectText(node: LexicalTextLike): string {
  if (typeof node.text === "string") return node.text;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(collectText).join("");
}

/**
 * Lifts the leading "department" line from a job's lexical body into the hero
 * meta row. The CMS body for legacy jobs starts with a single short paragraph
 * (one-to-three words) naming the department — we strip it so it doesn't
 * appear above the Overview heading.
 */
function extractLeadingDepartment(
  body: LexicalRoot | null,
): {
  departmentFromBody: string | null;
  bodyWithoutDeptLine: LexicalRoot | null;
} {
  if (!body?.root?.children?.length) {
    return { departmentFromBody: null, bodyWithoutDeptLine: body };
  }
  const [first, ...rest] = body.root.children;
  if (!first || (first as { type?: string }).type !== "paragraph") {
    return { departmentFromBody: null, bodyWithoutDeptLine: body };
  }
  const text = collectText(first as unknown as LexicalTextLike).trim();
  // Heuristic: short single-line label (≤32 chars, no punctuation other than
  // hyphen/ampersand/space). Long paragraphs are body copy and must stay.
  if (!text || text.length > 32 || /[.!?,:;]/.test(text)) {
    return { departmentFromBody: null, bodyWithoutDeptLine: body };
  }
  return {
    departmentFromBody: text,
    bodyWithoutDeptLine: {
      ...body,
      root: { ...body.root, children: rest },
    },
  };
}
