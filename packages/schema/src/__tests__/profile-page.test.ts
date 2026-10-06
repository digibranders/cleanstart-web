import { describe, expect, it } from "vitest";

import { profilePageSchema } from "../builders/jsonld";
import { SITE_NAME, SITE_URL } from "../builders/site";

describe("profilePageSchema", () => {
  it("emits a Person for a named contributor", () => {
    const node = profilePageSchema({ name: "Jane Doe", slug: "jane-doe", jobTitle: "Engineer" });
    expect(node.mainEntity["@type"]).toBe("Person");
    expect(node.mainEntity["@id"]).toBe(`${SITE_URL}/author/jane-doe#person`);
  });

  it("emits the publishing Organization for the house byline", () => {
    const node = profilePageSchema({
      name: "CleanStart Security",
      slug: "cleanstart-security",
      imageUrl: "https://cdn.example/logo.png",
      description: "Security research by the CleanStart team.",
      sameAs: ["https://www.linkedin.com/company/cleanstart"],
    });
    expect(node.mainEntity).toMatchObject({
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: "CleanStart Security",
      url: SITE_URL,
      logo: "https://cdn.example/logo.png",
    });
    expect(node.mainEntity).not.toHaveProperty("jobTitle");
  });
});
