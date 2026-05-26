import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CareerDetailHero } from "@/components/sections/careers/CareerDetailHero";
import { CareerDetailContent } from "@/components/sections/careers/CareerDetailContent";
import type { LexicalRoot } from "@/lib/blog";
import {
  DEPARTMENT_LABEL,
  EXPERIENCE_LABEL,
  getJobBySlug,
  locationDisplay,
} from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const CONTACT_EMAIL = "hr@cleanstart.com";

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
      path: `/careers/${slug}`,
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
    description: descriptionParts.join(" "),
    path: `/careers/${job.slug}`,
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
      <Header />
      <main>
        <CareerDetailHero title={job.title} meta={meta} />
        <CareerDetailContent
          title={job.title}
          slug={job.slug}
          body={bodyWithoutDeptLine}
          contactEmail={CONTACT_EMAIL}
        />
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
