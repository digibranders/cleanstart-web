import { describe, expect, it } from "vitest";
import type { Testimonial } from "@/components/sections/home/testimonials-data";
import { homeReviewSchema } from "./home-review-schema";

const SAMPLE: Testimonial[] = [
  {
    name: "Mathan Babu K",
    role: "CTSO & DPO, Vodafone Idea",
    company: "Vodafone Idea",
    quote: "CleanStart's shift-left security approach arrived at a critical time.",
  },
];

describe("homeReviewSchema", () => {
  it("builds one Review per testimonial, attributed to the named person", () => {
    const [review] = homeReviewSchema(SAMPLE);

    expect(review).toMatchObject({
      "@type": "Review",
      reviewBody: SAMPLE[0]?.quote,
      author: { "@type": "Person", name: "Mathan Babu K" },
      itemReviewed: { "@id": "https://www.cleanstart.com/#organization" },
    });
  });

  it("never emits a rating, since no rating data is collected", () => {
    const [review] = homeReviewSchema(SAMPLE);

    expect(review).not.toHaveProperty("reviewRating");
  });

  it("records the reviewer's employer as the author's affiliation", () => {
    const [review] = homeReviewSchema(SAMPLE);

    expect(review).toMatchObject({
      author: { affiliation: { "@type": "Organization", name: "Vodafone Idea" } },
    });
  });

  it("skips testimonials missing a name or quote", () => {
    const incomplete: Testimonial[] = [
      { name: "", role: "r", company: "c", quote: "q" },
      { name: "n", role: "r", company: "c", quote: "" },
    ];

    expect(homeReviewSchema(incomplete)).toEqual([]);
  });

  it("returns an empty array for no testimonials", () => {
    expect(homeReviewSchema([])).toEqual([]);
  });
});
