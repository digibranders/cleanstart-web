import type React from "react";

import type { AuthorDetail } from "@/lib/authors";

interface AuthorDetailsProps {
  author: AuthorDetail;
}

export function AuthorDetails({
  author,
}: AuthorDetailsProps): React.ReactElement | null {
  const hasExperience = !!author.experience?.length;
  const hasEducation = !!author.education?.length;
  const hasSkills = !!author.skills?.length;
  const hasAwards = !!author.awards?.length;

  if (!hasExperience && !hasEducation && !hasSkills && !hasAwards) return null;

  return (
    <section className="relative w-full bg-white">
      <div className="relative mx-auto max-w-[1120px] px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {hasExperience && (
            <Block title="Experience">
              <ul className="flex flex-col gap-4">
                {author.experience!.map((e, i) => (
                  <li key={e.id ?? `${e.company}-${i}`} className="flex flex-col gap-1">
                    <span
                      className="font-medium"
                      style={{ color: "#111111", fontSize: "1rem" }}
                    >
                      {e.role ? `${e.role}, ${e.company}` : e.company}
                    </span>
                    {(e.fromYear || e.toYear) && (
                      <span
                        className="text-sm"
                        style={{ color: "rgba(17,17,17,0.55)" }}
                      >
                        {e.fromYear ?? ""}
                        {e.fromYear && (e.toYear ?? "Present") ? " – " : ""}
                        {e.toYear ?? (e.fromYear ? "Present" : "")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {hasEducation && (
            <Block title="Education">
              <ul className="flex flex-col gap-4">
                {author.education!.map((e, i) => (
                  <li
                    key={e.id ?? `${e.institution}-${i}`}
                    className="flex flex-col gap-1"
                  >
                    <span
                      className="font-medium"
                      style={{ color: "#111111", fontSize: "1rem" }}
                    >
                      {e.institution}
                    </span>
                    {(e.degree || e.year) && (
                      <span
                        className="text-sm"
                        style={{ color: "rgba(17,17,17,0.55)" }}
                      >
                        {e.degree}
                        {e.degree && e.year ? " • " : ""}
                        {e.year ?? ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {hasSkills && (
            <Block title="Skills">
              <div className="flex flex-wrap gap-2">
                {author.skills!.map((s, i) => (
                  <span
                    key={`${s.skill}-${i}`}
                    className="inline-flex items-center px-3 py-1 text-sm"
                    style={{
                      background: "#F5F5F5",
                      color: "rgba(17,17,17,0.78)",
                      borderRadius: "8px",
                    }}
                  >
                    {s.skill}
                  </span>
                ))}
              </div>
            </Block>
          )}

          {hasAwards && (
            <Block title="Awards & recognition">
              <ul className="flex flex-col gap-4">
                {author.awards!.map((a, i) => (
                  <li key={a.id ?? `${a.title}-${i}`} className="flex flex-col gap-1">
                    <span
                      className="font-medium"
                      style={{ color: "#111111", fontSize: "1rem" }}
                    >
                      {a.title}
                    </span>
                    {(a.issuer || a.year) && (
                      <span
                        className="text-sm"
                        style={{ color: "rgba(17,17,17,0.55)" }}
                      >
                        {a.issuer}
                        {a.issuer && a.year ? " • " : ""}
                        {a.year ?? ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      </div>
    </section>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <h2
        className="font-display font-semibold"
        style={{
          fontSize: "clamp(1.125rem, 1.5vw, 1.25rem)",
          color: "#111111",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
