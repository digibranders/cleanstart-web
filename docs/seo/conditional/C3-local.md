# Local

**Module:** C3 — Local
**Prefix:** `LOCAL`
**Status:** Conditional — invoked per client (`00-index.md` §8)
**Scope:** Google Business Profile eligibility and representation guidelines, service-area/hybrid business modeling, category selection, local ranking factors as Google documents them, `LocalBusiness` structured data and subtypes, multi-location architecture, store locators, review policy, Bing Places, and citations/directory listings.
**Evidence base:** `docs/seo/evidence/sources/conditional/local.md` (research pass, 2026-07-29).

> **Not exercised by CleanStart — verified against primary documentation only.**
>
> **This module has not been through the adversarial verification pass** that the core
> modules (01–11) received. Its rules rest on a single research pass. Adversarial
> verification found defects in roughly one rule in five across the core modules, so
> re-verify every rule here against its cited source before relying on this module for
> a client engagement.

---

## When this module applies

Apply this module the moment a client has a physical location customers visit, a service area they travel to, or more than one such location or area — a storefront, a multi-branch chain, or a service-area business (plumber, electrician, mobile detailer). It does not apply to a pure SaaS/software vendor with no physical presence and no Google Business Profile — `www.cleanstart.com` has neither, which is why every rule below carries a `CleanStart: N/A` verdict. Google's own documentation names exactly **three** local ranking factors — relevance, distance, prominence (LOCAL-07) — and never uses the term "NAP" or formally defines "citations" as a ranking input; the industry vocabulary layered on top of Google's three factors is marked `Convention — not vendor-confirmed` throughout this module, not smoothed over as if it were documented fact.

---

## P1 — material organic or AI-visibility impact, no immediate loss

### LOCAL-01 — A Google Business Profile is eligible only for in-person contact during stated hours, or a named exception

- **Severity:** P1
- **Applies:** Any business considering creating or claiming a Google Business Profile
- **Rule:** Only create/claim a Business Profile for a business that makes in-person contact with customers during its stated hours, or that falls into Google's small set of documented exceptions (unstaffed self-service machines; seasonal businesses with permanent year-round signage).
- **Why:** Google: "To qualify for a Business Profile, a business must make in-person contact with customers during its stated hours." Purely online businesses without a physical location customers can visit are not eligible for a located profile. Google's "Ineligible businesses" list explicitly disqualifies rental/for-sale properties, an ongoing service/class/meeting at a location the business doesn't own or have authority to represent, and lead-generation agents/companies.
- **Acceptance:** The business either (a) receives customers face-to-face at a fixed, signed address during posted hours, (b) travels to customers as a documented service-area business (LOCAL-04), or (c) is an explicitly listed exception. Anything else fails eligibility.
- **Verify:** `curl -s "https://support.google.com/business/answer/13763036"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/13763036?hl=en
- **Tools:** Not applicable — eligibility is a manual documentation cross-check, not a tool-scored crawl issue.
- **Anti-patterns:** Creating a located Business Profile for a lead-generation company, an affiliate/referral service, or a business operating at an address it has no authority to represent — all three are named disqualifiers, not judgment calls.
- **CleanStart:** N/A

---

### LOCAL-02 — Maintain exactly one profile per physical location or per service-area business; never a duplicate

- **Severity:** P1
- **Applies:** Any business with one or more Google Business Profiles
- **Rule:** Maintain exactly one Business Profile per physical location (or per service-area business overall); never create a second profile for the same location to game category or keyword coverage.
- **Why:** Google states plainly: "There should only be one profile per business," and warns duplicates "can cause problems with how your information displays on Google Maps and Search" — duplicate suppression and split reviews, not added visibility.
- **Acceptance:** A search of the business name + address in Google Maps returns exactly one Business Profile result; no second profile exists for the same address under a variant name or secondary category.
- **Verify:** `curl -s "https://www.google.com/maps/search/?api=1&query=<business+name>+<address>"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/3038177?hl=en
- **Tools:** Business Profile Manager's location list surfaces duplicate entries mapping to the same address.
- **Anti-patterns:** Creating a second profile at the same address under a different DBA to capture an additional category — this is a duplicate-listing violation, not a legitimate second location.
- **CleanStart:** N/A

---

### LOCAL-03 — Represent name, address, and phone exactly as they exist in the real world — Google never uses the term "NAP"

- **Severity:** P1
- **Applies:** Any Google Business Profile
- **Rule:** Represent the business name exactly as it appears on real-world signage/stationery (no keyword stuffing, taglines, store codes, or trademark symbols); use a precise, real address (no P.O. boxes or unstaffed virtual offices); use a phone number that connects to the individual location, not a central call-center line.
- **Why:** Google's guidelines require the name to "reflect your business accurately" and be "consistently represented and recognized in the real world across signage, stationery, and other branding," explicitly prohibiting marketing taglines, location codes, and keyword/service descriptors appended to the name. On address: "P.O. boxes or mailboxes located at remote locations aren't acceptable." **The industry acronym "NAP" (Name/Address/Phone) consistency does not appear anywhere in Google's own guidelines** — Google documents per-field accuracy but never bundles the three fields under that label or states a formal cross-directory consistency mechanism. Treat "NAP consistency" itself as `Convention — not vendor-confirmed`; the underlying per-field accuracy rules are Tier 1. Bing's own guidance does use "NAP" directly ("Your Name, Address, and Phone number must match your legal business documents and your website"), so the term is Tier 1 for Bing specifically, even though Google never uses it.
- **Acceptance:** The profile's name field contains only the real, signed business name with no appended marketing/location/keyword text; the address resolves to a staffed, signed, physically visitable location; the phone number rings through to that specific location.
- **Verify:** `curl -s "https://support.google.com/business/answer/3038177"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/3038177?hl=en (Google's per-field rules); [Tier 1] Bing Places for Business Help, data quality guidelines, https://www.bing.com/forbusiness/help/manageYourListings?setlang=en (Bing's own use of "NAP")
- **Tools:** Not applicable — a photo audit against physical signage and a call-through test are the only reliable checks.
- **Anti-patterns:** Appending city/keyword text to the business name field ("Acme Plumbing — Best Emergency Plumber Denver"), listing a UPS Store mailbox as the address, or routing the listed phone number to a national call center instead of the branch.
- **CleanStart:** N/A

---

### LOCAL-04 — Service-area businesses get exactly one profile, a hidden address, and a roughly 2-hour driving-time ceiling

- **Severity:** P1
- **Applies:** Any business that travels to customers rather than receiving them at a fixed address
- **Rule:** A business that travels to customers rather than receiving them at a fixed address gets exactly one service-area profile; hide the street address and declare the service area by city/postal code (not a radius), keeping the overall footprint within roughly a 2-hour drive of the business's base.
- **Why:** Google: "Service-area businesses can only have one profile for the whole area that they serve," supports up to 20 declared service areas, and caps geographic scope: "The boundaries of your overall area shouldn't be more than about 2 hours of driving time from where your business is based." If the business does not receive customers at its own address, that address must be removed from the profile.
- **Acceptance:** Exactly one profile exists for the service-area business; the address field is empty (unless hybrid, LOCAL-05); declared service areas are named administrative units, not a radius value; the furthest declared area is within roughly 2 hours' driving time of the base.
- **Verify:** `curl -s "https://support.google.com/business/answer/9157481"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/9157481?hl=en
- **Tools:** Business Profile Manager surfaces address visibility state and service-area declaration format directly.
- **Anti-patterns:** Declaring a nationwide or multi-state service area from a single local base (violates the ~2-hour driving-time ceiling), or leaving the street address visible for a business that never receives customers there.
- **CleanStart:** N/A

---

### LOCAL-05 — Local ranking rests on exactly three Google-documented factors: relevance, distance, prominence — no fourth factor is vendor-confirmed

- **Severity:** P1
- **Applies:** Always, wherever local ranking is discussed
- **Rule:** Treat "relevance, distance, and prominence" as the complete, exhaustive list of local ranking factors Google itself names; do not present any additional weighted factor (review-count thresholds, citation counts, response-time windows, etc.) as a Google-confirmed input.
- **Why:** Google's local-ranking help page states verbatim: relevance is "how well a Business Profile matches what someone is searching for"; distance is "how far each business is from the customer who's searching"; prominence is "how well-known a business is," influenced by "how many websites link to your business and how many reviews you have." Google also states directly that businesses "can't pay to be more prominent in local results" and there is "no way to request or pay for a better local ranking."
- **Acceptance:** Any local-SEO checklist item traces back to one of these three named factors (relevance = complete/accurate business info matching search intent; distance = fixed given user location, not directly actionable; prominence = reviews, backlinks, general web presence/authority) with no fourth, Google-sourced factor invented.
- **Verify:** `curl -s "https://support.google.com/business/answer/7091"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/7091?hl=en
- **Tools:** Not applicable — search Google's own documentation for a specific claimed factor; absence of a match confirms industry inference, not documented fact.
- **Anti-patterns:** Presenting a specific numeric factor weighting ("reviews are 24% of the algorithm," "citations are worth X points") as something Google states — Google names the three factors qualitatively and explicitly declines to publish relative weights or a scoring formula.
- **CleanStart:** N/A

---

### LOCAL-06 — Genuine local content, not the mere existence of city-specific URLs, is what separates a location page from a doorway page

- **Severity:** P1
- **Applies:** Multi-location businesses publishing one page per location
- **Rule:** It is legitimate to publish one page per genuine physical/service location; it becomes a policy violation when those pages are built primarily to rank for city/region-name queries and funnel users onward without adding location-specific value.
- **Why:** Google's spam policies define doorway abuse as pages "created to rank for specific, similar search queries" that funnel users to another page, explicitly citing "having multiple domain names or pages targeted at specific regions or cities that funnel users to one page." Google does not publish a dedicated "location page requirements" document — the applicable guidance is this general doorway-abuse policy, applied to the local-page case.
- **Acceptance:** Each location page contains content genuinely specific to that location (real address, real hours, real staff/inventory/service-area detail, unique photos) rather than a templated city-name swap over otherwise identical body copy; the page is a genuine destination, not an intermediate funnel to one central page.
- **Verify:** Manual — no automated script exists in this repo; diff the body content of location-page pairs after stripping the NAP block and city name, per this rule's own `Tools` field.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/essentials/spam-policies (doorway abuse section, last updated 2026-05-15 UTC)
- **Tools:** Not applicable — diff the body content of two location pages after stripping the NAP block and city name; substantially identical boilerplate is a doorway-risk signal.
- **Anti-patterns:** Generating one thin page per ZIP code or per nearby city by templating only the place-name token into otherwise-identical copy, with no real local signal behind any of them.
- **CleanStart:** N/A

---

### LOCAL-07 — Store locators must expose real, crawlable `<a href>` links to individual location pages — never JS-only or iframe-embedded widgets

- **Severity:** P1
- **Applies:** Any multi-location business with a store/service-area locator
- **Rule:** A store/location locator must render standard `<a>` elements with real `href` URLs to each location's own page in the initial or execution-time DOM that Googlebot processes; it must not rely solely on `onclick` handlers, custom router directives, non-anchor elements, or an iframe-embedded third-party widget to reach location detail.
- **Why:** Google's crawlable-links documentation: "Google can only crawl your link if it's an `<a>` HTML element (also known as anchor element) with an `href` attribute" — explicitly calling out that `<a onclick="goto('...')">`, custom-framework router attributes, non-anchor elements, and `javascript:` pseudo-protocol hrefs are not reliably parsed. Content embedded inside an iframe leaves no crawlable link on the parent page to follow at all.
- **Acceptance:** Viewing the store locator's page source shows a real `<a href="/stores/...">` for every listed location, resolving to a real, unique, indexable URL — not merely a JS click-handler or an iframe `src` pointing to a third-party domain.
- **Verify:** `curl -s <locator-url> | grep -o '<a[^>]*href="[^"]*store[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/links-crawlable (last updated 2025-12-10 UTC)
- **Tools:** Not applicable at a single-tool level — compare raw page source against the browser-rendered/inspected DOM directly.
- **Anti-patterns:** A locator that renders location results only after a client-side API call into a `<div onclick>` card with no underlying `<a href>`, or that loads per-location detail inside an `<iframe>` sourced from a separate locator SaaS domain.
- **CleanStart:** N/A

---

### LOCAL-08 — Self-serving reviews on `LocalBusiness`/`Organization` markup are ineligible for the star rich result

- **Severity:** P1
- **Applies:** Any `LocalBusiness`/`Organization`-typed page carrying `Review`/`AggregateRating` markup
- **Rule:** Never mark up `Review`/`AggregateRating` data for a `LocalBusiness` or `Organization` entity on that same entity's own site — including via an embedded third-party reviews widget the business itself controls — and expect it to earn the star-rating rich result.
- **Why:** Google's review-snippet documentation: "If the entity that's being reviewed controls the reviews about itself, their pages that use LocalBusiness or any other type of Organization structured data are ineligible for star review feature." This condition applies whether the reviews are hand-authored or sourced through an embedded widget; it does not apply to `Product` review markup, where a merchant collecting reviews of its own products remains fully eligible.
- **Acceptance:** A `LocalBusiness`/`Organization`-typed page's own site does not carry `Review`/`AggregateRating` markup for itself; third-party review platforms display aggregate ratings on the third party's own pages, not re-published as self-authored structured data on the reviewed business's own domain.
- **Verify:** `curl -s <url> | grep -B2 '"@type":"AggregateRating"' | grep -o '"@type":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/review-snippet (last updated 2026-07-24 UTC)
- **Tools:** Rich Results Test flags the markup as ineligible for the star rich result rather than treating presence as sufficient.
- **Anti-patterns:** Embedding a widget that pulls the business's own Google reviews (or its own curated testimonials) into `LocalBusiness` JSON-LD on the business's own site, expecting star ratings in the SERP snippet.
- **CleanStart:** N/A

---

### LOCAL-09 — Never incentivize, pressure, or script reviews; genuine solicitation without incentive is explicitly permitted

- **Severity:** P1
- **Applies:** Any business soliciting Google reviews
- **Rule:** Never offer any incentive (payment, discount, free goods/services) in exchange for posting, revising, or removing a review, and never pressure customers to leave reviews on-premises or dictate what the review must say.
- **Why:** Google's prohibited-and-restricted-content policy: content is prohibited when it results from an incentive "offered in exchange for posting any review or revision or removal of a negative review." Merchants "should not require or pressure users to leave ratings or write reviews while on the premises, nor should they request that specific content be included" — but Google explicitly permits soliciting genuine reviews without incentive.
- **Acceptance:** No documented instance of the business offering a discount, refund, or free item conditioned on posting, editing, or removing a review; no in-store script or signage pressuring customers to review on the spot or dictating review content.
- **Verify:** `grep -rni "review.*discount\|discount.*review" .`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/7400114?hl=en
- **Tools:** Not applicable — audit customer-facing review-request templates for incentive language directly.
- **Anti-patterns:** A "leave a 5-star review, get 10% off your next visit" promotion — a prohibited incentivized-review scheme even if the underlying reviews are genuine, because the incentive itself is the violation.
- **CleanStart:** N/A

---

## P2 — meaningful improvement, non-urgent

### LOCAL-10 — Hybrid businesses keep the address visible and layer a service area on top; they are not forced to choose one model

- **Severity:** P2
- **Applies:** Any business serving customers both at its own address and by traveling to them
- **Rule:** A business that serves customers both at its own address *and* by traveling to them keeps its address visible, sets staffed availability hours, and layers a service area on top.
- **Why:** Google defines a hybrid business explicitly: "A business that serves customers at its business address but also directly visits or delivers to them" — unlike a pure service-area business, a hybrid business "must include their address if they serve customers there, even if they also have a service area."
- **Acceptance:** A hybrid business's profile shows a real, visitable, staffed address AND a declared service area simultaneously; the address is not hidden.
- **Verify:** `curl -s "https://support.google.com/business/answer/9157481"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/9157481?hl=en
- **Tools:** Business Profile Manager confirms both the address field and the service-area field are populated.
- **Anti-patterns:** Hiding the address for a business that does, in fact, receive walk-in customers on-site — this misrepresents the business model and is a guideline violation, not a privacy feature.
- **CleanStart:** N/A

---

### LOCAL-11 — Choose the fewest categories that describe what the business fundamentally IS, not everything it HAS

- **Severity:** P2
- **Applies:** Any Google Business Profile
- **Rule:** Choose the smallest number of categories that fully describes what the business fundamentally *is*, not a longer list describing everything it offers or has on-site.
- **Why:** Google's guidance: select categories that complete "This business IS a ___" rather than what it "HAS" or "sells," and use "as few categories as possible" — categories should not be used "solely as keywords or to describe attributes."
- **Acceptance:** The primary category is the single most specific descriptor of the business's core identity; any additional categories describe genuinely distinct services offered at the same location, not synonyms or keyword variants of the primary category.
- **Verify:** `curl -s "https://support.google.com/business/answer/3038177"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/3038177?hl=en
- **Tools:** Not applicable — read the selected categories aloud in the "This business IS a ___" template as a manual check.
- **Anti-patterns:** Selecting the maximum allowed number of categories to maximize keyword surface area (e.g., a plumbing company also selecting "Contractor," "Handyman," and "Bathroom remodeler" purely for search coverage rather than because those are genuinely distinct offered services).
- **CleanStart:** N/A

---

### LOCAL-12 — Mark up each location with the most specific `LocalBusiness` subtype and the recommended `geo`/`telephone`/`openingHoursSpecification` fields

- **Severity:** P2
- **Applies:** Any physical location with structured data
- **Rule:** Mark up each physical location with the most specific `LocalBusiness` subtype available (not the bare `LocalBusiness` type), populating at minimum `name` and `address`, and add `geo`, `telephone`, `openingHoursSpecification`, `priceRange`, and `url` wherever applicable.
- **Why:** Google documents `name` and `address` (as a `PostalAddress`) as the properties it lists, recommends `geo` (minimum 5 decimal places), `openingHoursSpecification`, `telephone`, and `priceRange` (under 100 characters), and directs implementers to "use the most specific LocalBusiness sub-type possible." When a business needs multiple types simultaneously, they must be a JSON array — `additionalType` is explicitly not supported for this purpose.
- **Acceptance:** Each location's JSON-LD `@type` is the most specific applicable schema.org subtype; `name` and `address` are populated; the page passes Rich Results Test for the Local Business feature with no missing-field warnings on recommended properties present in the source data.
- **Verify:** `curl -s <url> | grep -o '"@type":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/local-business (last updated 2025-12-10 UTC)
- **Tools:** Rich Results Test reports missing-field warnings on recommended properties directly.
- **Anti-patterns:** Marking every location as bare `"@type": "LocalBusiness"` when a specific subtype (`Dentist`, `Restaurant`, `AutoRepair`) is available and known; using `additionalType` as an array workaround instead of the documented array-of-`@type`-strings pattern.
- **CleanStart:** N/A

---

### LOCAL-13 — `department` nests co-located sub-units at the same address; a different-city branch is always a separate `LocalBusiness` node

- **Severity:** P2
- **Applies:** Multi-unit or multi-brand businesses
- **Rule:** For a business with multiple named departments *at the same address* (e.g., a pharmacy inside a supermarket), use the `department` property to nest the sub-unit under the parent `LocalBusiness` node; for genuinely separate physical addresses, each location gets its own independent `LocalBusiness` node rather than being nested as a "department" of another location.
- **Why:** Google's documentation supports `department` specifically for "nested business units" sharing a single physical location, with a stated naming convention (e.g., "gMart Pharmacy"). This models co-located distinct entities, not a chain's separate branches in different cities.
- **Acceptance:** `department` is used only when the nested entity shares the parent's physical address; a chain's branch in a different city is a sibling `LocalBusiness` node with its own `address`, not a `department` of a flagship location.
- **Verify:** `curl -s <url> | grep -A5 '"department"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/local-business
- **Tools:** Not applicable — confirm the nested entity's address matches the parent's as a manual check.
- **Anti-patterns:** Using `department` to represent a franchise's separate-city branches — conflates distinct physical locations into one node's sub-units, breaking per-location address/geo data.
- **CleanStart:** N/A

---

### LOCAL-14 — Businesses with 10+ locations should use bulk import/verification; no location is live until verified

- **Severity:** P2
- **Applies:** Chains with 10 or more physical locations
- **Rule:** Businesses with 10 or more physical locations should use Google's bulk import/verification path rather than creating and verifying each Business Profile individually; regardless of path, no location appears on Search, Maps, or other Google surfaces until it passes verification.
- **Why:** Google: "If your business has 10 or more locations you can add, verify, and manage them in bulk," via a spreadsheet-based data feed. Google is explicit this is a hard gate: "Your locations won't be eligible to appear on Search, Maps, and other Google properties until they are verified." Hotel-specific attribute updates are unsupported through the spreadsheet path and must go through the Business Profile API.
- **Acceptance:** For a chain of 10+ locations, all location records originate from a single validated data feed and each location shows a "Verified" state before any claim is made about its Search/Maps visibility.
- **Verify:** `curl -s "https://support.google.com/business/answer/3217744"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/3217744?hl=en
- **Tools:** Business Profile Manager's location list, filtered by verification status.
- **Anti-patterns:** Reporting a newly added multi-location rollout as "live" based on the spreadsheet upload completing, without confirming each row cleared verification.
- **CleanStart:** N/A

---

### LOCAL-15 — Cite local ranking-factor surveys as expert-opinion aggregation, never as a measurement of Google's algorithm

- **Severity:** P2
- **Applies:** Any local-SEO document citing a ranking-factor survey (e.g., Whitespark)
- **Rule:** When citing a local-ranking-factors survey, label it explicitly as an expert-opinion survey, never as an empirical measurement of Google's algorithm, and never blend its category weightings into a claim attributed to Google.
- **Why:** Whitespark's Local Search Ranking Factors survey methodology is a structured, named, dated panel of practitioners (47 named local-search practitioners in the 2026 edition) scoring 187 candidate factors and answering open-ended questions — this clears the bar for Tier 3 citation, but remains practitioner belief aggregated across a panel, not a measurement of live ranking behavior, and is not vendor-confirmed by Google in any way.
- **Acceptance:** Any document citing this survey names the survey, its year, its panel size, and states plainly that it reflects expert opinion, not a Google-confirmed weighting; it is never the sole citation for a claim presented as "Google's algorithm does X."
- **Verify:** `grep -rni "whitespark\|ranking factor.*survey" docs/seo/`
- **Reference:** None — no reference implementation
- **Source:** Convention — not vendor-confirmed (Tier 3 named, dated, disclosed-methodology survey, used for corroboration only): Whitespark, "Local Search Ranking Factors" (2026 edition, published 2025-11-06 by Darren Shaw), https://whitespark.ca/local-search-ranking-factors/
- **Tools:** Not applicable — trace any cited ranking-factor weight back to its source before citing it.
- **Anti-patterns:** Writing "Google weighs reviews at roughly a quarter of the local ranking algorithm" and citing only a practitioner survey for that specific number.
- **CleanStart:** N/A

---

### LOCAL-16 — Do not present "citations" or citation counts as a Google-confirmed ranking input

- **Severity:** P2
- **Applies:** Always, wherever local-SEO citation-building work is discussed
- **Rule:** Do not present "citation count" or "citation consistency across directories" as a Google-confirmed ranking factor with a specific threshold or weight; treat it as `Convention — not vendor-confirmed` and limit any citation-building work to what Google's own accuracy guidelines already require (LOCAL-03) — consistent, accurate business information wherever it appears.
- **Why:** No Google Business Profile Help page or Google Search Central document defines "citation" as a term, states a minimum citation count, or confirms citation volume/consistency as an explicit ranking input. The closest Tier 1 material is the per-field accuracy requirement (LOCAL-03) and the qualitative "prominence" factor naming inbound links and reviews (LOCAL-05) — neither is "citations" in the industry sense of structured NAP listings on data aggregators and directories.
- **Acceptance:** Any SOP text referencing "citations" is explicitly labeled as industry convention, not documented Google policy; no specific numeric citation-count target is presented as a documented requirement.
- **Verify:** `grep -rni "citation" docs/seo/conditional/C3-local.md`
- **Reference:** None — no reference implementation
- **Source:** Convention — not vendor-confirmed (absence-of-evidence finding across Google Business Profile Help and Google Search Central — no Tier 1 source found defining or confirming citations as a ranking input)
- **Tools:** Not applicable — search Google's own documentation for the literal term "citation" in a local-ranking context as the verification method.
- **Anti-patterns:** Selling or specifying "50 high-authority citations" as a deliverable with an implied guaranteed ranking effect — no primary source supports a numeric citation target as a documented Google or Bing ranking mechanism.
- **CleanStart:** N/A

---

### LOCAL-17 — `Review`/`AggregateRating` requires `author`, `itemReviewed`, `ratingValue`, and at least one of `ratingCount`/`reviewCount` — where legitimately eligible

- **Severity:** P2
- **Applies:** Any page with legitimately eligible (non-self-serving, per LOCAL-08) review markup
- **Rule:** Where review markup is legitimately eligible, ensure `Review` carries `author`, an identified `itemReviewed`, and a `reviewRating` with a numeric `ratingValue`; ensure `AggregateRating` carries an identified `itemReviewed`/`name`, a numeric `ratingValue`, and at least one of `ratingCount` or `reviewCount`.
- **Why:** Google's review-snippet documentation lists these as the required fields for the two supported types — `author` (Person or Organization, under 100 characters), `itemReviewed` with the reviewed entity's specific schema.org type, and `reviewRating.ratingValue` as a number, fraction, or percentage.
- **Acceptance:** Every `Review`/`AggregateRating` node in production markup contains all required fields with no placeholder or missing values; the Rich Results Test reports no "missing required field" errors for the review-snippet feature, independent of the self-serving eligibility question in LOCAL-08.
- **Verify:** `curl -s <url> | grep -o '"ratingValue":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- **Tools:** Rich Results Test reports missing-required-field errors directly.
- **Anti-patterns:** Publishing `AggregateRating` with a `ratingValue` but no `ratingCount`/`reviewCount` at all — a bare average with no sample size is incomplete markup, not just weak signal.
- **CleanStart:** N/A

---

### LOCAL-18 — Suspension appeals must correct the underlying guideline violation before filing, not after

- **Severity:** P2
- **Applies:** Any suspended or restricted Google Business Profile
- **Rule:** Treat Business Profile suspension/restriction as a documented enforcement consequence of specific, named guideline violations, and build appeal-readiness (evidence, corrected profile) into any reinstatement process from the start — compliance-first, not appeal-first.
- **Why:** Google's fix-and-appeal documentation directs the operator to first bring the profile into compliance with the representation guidelines (LOCAL-03, LOCAL-11) before submitting an appeal, and separately requires the business name/address on any submitted evidence to match the profile under appeal. Documented suspension states include "soft" (profile live but uneditable) and "hard" (profile removed from Search/Maps).
- **Acceptance:** Before any appeal is filed, the profile has been re-audited against the representation guidelines and any identified violation corrected; evidentiary documents submitted with the appeal show a business name/address matching the profile exactly.
- **Verify:** `curl -s "https://support.google.com/business/answer/4569145"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/4569145?hl=en; https://support.google.com/business/answer/13597551?hl=en
- **Tools:** Not applicable — re-run the LOCAL-03/LOCAL-11 checks against the suspended profile prior to appeal.
- **Anti-patterns:** Filing a reinstatement appeal without first correcting the underlying guideline violation that triggered the suspension (e.g., appealing while the name field still contains keyword-stuffed text).
- **CleanStart:** N/A

---

### LOCAL-19 — A co-located sub-brand needs its own signage/hours to warrant a separate profile; otherwise it is a `department`, not a duplicate listing

- **Severity:** P2
- **Applies:** Co-located multi-brand entities (e.g., a hotel with an in-house named restaurant)
- **Rule:** When two nominally distinct brands occupy the same address, model the relationship with `department`/parent-child structured data rather than creating two independent, separately-verified Business Profiles at the identical address, unless each genuinely operates as its own customer-facing entity with distinct signage and hours.
- **Why:** This follows directly from combining LOCAL-02 (one profile per location; duplicates cause display problems) with LOCAL-13 (`department` is the documented mechanism for co-located sub-units). A co-located sub-brand warrants its own separate profile only if it independently satisfies the eligibility bar in LOCAL-01 — its own signage, its own customer-facing hours, genuinely distinguishable to a visitor arriving on-site.
- **Acceptance:** A co-located sub-brand either (a) has its own real signage/hours distinct from the host location and thus qualifies for its own Business Profile, or (b) does not, and is represented only as a `department` in structured data with no separate Business Profile created.
- **Verify:** `curl -s <url> | grep -A5 '"department"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] Synthesized from https://support.google.com/business/answer/3038177?hl=en (duplicates/one-profile rule) and https://developers.google.com/search/docs/appearance/structured-data/local-business (`department` property) — the combination is this module's synthesis, not a single Google source stating the composite rule
- **Tools:** On-site photo audit for independent signage/hours.
- **Anti-patterns:** Creating and separately verifying a Business Profile for an in-house cafe inside a hotel that has no independent signage or hours of its own — functionally a duplicate-adjacent listing dressed up as a "different business."
- **CleanStart:** N/A

---

## P3 — hygiene, marginal or speculative gain

### LOCAL-20 — `LocalBusiness` sits under both `Organization` and `Place`; check the schema.org type hierarchy before writing custom markup

- **Severity:** P3
- **Applies:** Any location choosing a `LocalBusiness` subtype
- **Rule:** Before writing custom markup, check the schema.org type hierarchy for a subtype that already matches the business (schema.org documents well over 100 `LocalBusiness` specializations); only fall back to bare `LocalBusiness` if genuinely no subtype fits.
- **Why:** Schema.org defines `LocalBusiness` as "A particular physical business or branch of an organization," inheriting from both `Organization` (business-identity properties) and `Place` (`geo`, `address`, `containedInPlace`), and adds `currenciesAccepted`, `openingHours`, `paymentAccepted`, `priceRange`. Documented subtypes span hospitality, healthcare, and professional services.
- **Acceptance:** The `@type` value used for each location resolves to a real, non-deprecated page on `https://schema.org/<TypeName>` and is a documented subtype of `LocalBusiness`.
- **Verify:** `curl -s https://schema.org/<chosen-type> | grep -o 'subClassOf'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://schema.org/LocalBusiness
- **Tools:** Not applicable — walk the schema.org type hierarchy from the chosen type to `LocalBusiness` → `Organization`/`Place` → `Thing` manually.
- **Anti-patterns:** Inventing a non-schema.org type name for a business category that already has a documented subtype (e.g., writing a custom `"@type": "CoffeeShop"` instead of the documented `CafeOrCoffeeShop`) — the invented string will not validate.
- **CleanStart:** N/A

---

### LOCAL-21 — Bing Places is a parallel, independently governed listing surface; Google compliance does not automatically satisfy it

- **Severity:** P3
- **Applies:** Any business also listed on Bing Places for Business
- **Rule:** Treat Bing Places for Business as a parallel, independently governed listing surface with its own data-quality guidelines — do not assume Google guideline compliance automatically satisfies Bing, and match business info exactly across both.
- **Why:** Bing's own data quality guidelines require Name/Address/Phone to "match your legal business documents and your website," using the NAP framing directly (unlike Google — see LOCAL-03). Bing warns "your business listing may get suspended if the guidelines are not followed," and flags category miscategorization as a common cause of listing suspension. Bing does not auto-sync from Google, so divergence between the two listings is a self-inflicted consistency failure.
- **Acceptance:** The Bing Places listing's name/address/phone are byte-for-byte identical to the Google Business Profile and the website's own contact information; the selected Bing categories mirror the "IS not HAS" logic used for Google (LOCAL-11).
- **Verify:** `curl -s "https://www.bing.com/forbusiness/help/manageYourListings"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://www.bing.com/forbusiness/help/manageYourListings?setlang=en
- **Tools:** Not applicable — diff the Bing Places listing detail page against both the Google Business Profile and the site's footer/contact-page NAP block manually.
- **Anti-patterns:** Letting the Bing Places listing drift out of sync after the Google profile is updated (e.g., a phone number or hours change applied only on Google).
- **CleanStart:** N/A

---

### LOCAL-22 — Do not claim a unified formula or equivalence between organic ranking and map-pack placement

- **Severity:** P3
- **Applies:** Always, wherever local/organic ranking interaction is discussed
- **Rule:** Do not claim Google has published a specific, documented relationship or shared scoring formula between organic web ranking and the local map-pack; the only Google-confirmed link is qualitative — organic web presence (links, content, authority) feeds into the "prominence" factor (LOCAL-05) that also drives map-pack placement.
- **Why:** Google's local-ranking documentation names prominence as partly driven by "how many websites link to your business" — signals normally associated with organic ranking also feed local-pack prominence. Beyond that qualitative overlap, no Tier 1 source states organic ranking and map-pack ranking share a formula, use the same index, or are computed by the same system.
- **Acceptance:** A claim about organic/map-pack interaction is limited to "prominence draws in part on general web signals also relevant to organic ranking" — anything more specific is labeled `Convention — not vendor-confirmed`.
- **Verify:** `grep -rni "map.pack.*organic\|organic.*map.pack" docs/seo/`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/business/answer/7091?hl=en (documents the prominence/web-links overlap only; no stronger unification claim found — flagged as an open gap)
- **Tools:** Not applicable — search Google Business Profile Help and Search Central for an explicit unifying statement; none was found as of this module's research date.
- **Anti-patterns:** Advising a client that "ranking #1 organically will guarantee a map-pack top-3 spot" or vice versa — Google documents only a partial, indirect overlap via prominence, not equivalence or guaranteed correlation.
- **CleanStart:** N/A
