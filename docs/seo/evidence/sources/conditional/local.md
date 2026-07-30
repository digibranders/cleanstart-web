# Local & Multi-Location SEO — Evidence Source Document (Conditional Module)

Research conducted 2026-07-29.

> **⚠️ Conditional module — no live implementation to validate against.** CleanStart (the reference site for this SOP) has no physical locations, no service area, and no Google Business Profile — it is a pure SaaS/software vendor with a single virtual presence. Every rule below rests on documentation alone (Google, Bing, Schema.org first-party sources); nothing in this file has been, or can be, cross-checked against a working CleanStart implementation. Apply this module only when a future site actually has a storefront, a service area, or more than one physical/service location. Do not retrofit any of these requirements onto CleanStart itself.

**Scope:** Google Business Profile eligibility and representation guidelines; NAP consistency; `LocalBusiness` structured data and subtypes; service-area businesses vs. storefronts; multi-location site architecture and location-page requirements; store locators and crawlability; review markup and the self-serving-reviews prohibition; local ranking factors as Google documents them; the organic/map-pack relationship; citations and directory listings.

**Tier definitions used below:**
- **Tier 1** — Google Business Profile Help + its guidelines for representing a business, Google Search Central's structured-data documentation, Schema.org, Bing Places for Business.
- **Tier 2** — first-party platform docs (none needed beyond Tier 1 for this scope; noted inline where a claim drops to Tier 2).
- **Tier 3** — named, dated empirical study with published methodology (used only for the ranking-factor survey, and only as corroboration, never as documented fact).
- **Tier 4** — practitioner consensus, labeled `Convention — not vendor-confirmed`. Used for the industry vocabulary ("NAP," "citations") that Google itself does not use.

Total requirements documented below: **22** discrete testable rules across 9 sections.
Source split: **17 Tier 1** citations, **1 Tier 3** citation (Whitespark survey, corroboration only), **4 explicit Tier 4 gap-flags** where industry convention runs ahead of anything Google or Bing documents.

**Headline finding, stated in the framing the task requires:** Google's own documentation states local ranking rests on exactly **three** named factors — relevance, distance, prominence (§7). The industry vocabulary layered on top of that — "NAP consistency," "citation count," "review-count thresholds," a 187-factor weighted survey — is not confirmed by Google in any of the sources fetched for this document. Where Google is silent, this file says so explicitly rather than smoothing over the gap with practitioner claims presented as fact.

---

## 1. Google Business Profile eligibility — in-person contact is the threshold test

**Rule:** Only create/claim a Business Profile for a business that makes in-person contact with customers during its stated hours, or that falls into Google's small set of documented exceptions.

**Mechanism:** Google's eligibility guidelines state the profile exists to represent a place or a service that customers can physically reach: "To qualify for a Business Profile, a business must make in-person contact with customers during its stated hours." Purely online businesses without a physical location customers can visit are not eligible for a **located** profile (a brand/organization-only profile is a separate, more limited product). Google carves out narrow exceptions: unstaffed self-service machines (ATMs, video-rental kiosks, express mail drop boxes) and seasonal businesses "like an ice-skating rink only open in winter months," which remain eligible "as long as they display permanent signage at their location year-round."

**Acceptance criterion:** The business either (a) receives customers face-to-face at a fixed, signed address during posted hours, or (b) travels to customers' locations as a documented service-area business (§4), or (c) is an explicitly listed exception (unstaffed machine, seasonal business with permanent signage). Anything else fails eligibility.

**Verification method:** Cross-check the candidate business against the "Ineligible businesses" list on the eligibility page before attempting verification — rental/for-sale properties, an ongoing service/class/meeting at a location the business doesn't own or have authority to represent, and lead-generation agents/companies are explicitly disqualified.

**Source:** Google Business Profile Help, "Business eligibility and ownership guidelines," https://support.google.com/business/answer/13763036?hl=en. **Tier 1.**

**Anti-pattern:** Creating a located Business Profile for a lead-generation company, an affiliate/referral service, or a business operating at an address it has no authority to represent (e.g., a coaching business run out of a gym it doesn't own) — all three are named disqualifiers, not judgment calls.

---

## 2. One profile per location, no duplicates

**Rule:** Maintain exactly one Business Profile per physical location (or per service-area business overall); never create a second profile for the same location to game category or keyword coverage.

**Mechanism:** Google states plainly: "There should only be one profile per business," and warns duplicates "can cause problems with how your information displays on Google Maps and Search" — i.e., duplicate suppression, split reviews, and potential guideline enforcement rather than added visibility.

**Acceptance criterion:** A search of the business name + address in Google Maps returns exactly one Business Profile result; no second profile exists for the same address under a variant name or secondary category.

**Verification method:** Search `"<business name>" <address>` on Google Maps and in Business Profile Manager's location list; if more than one result maps to the same physical address, it is a duplicate requiring merge/removal.

**Source:** Google Business Profile Help, "Guidelines for representing your business on Google," https://support.google.com/business/answer/3038177?hl=en. **Tier 1.**

**Anti-pattern:** Creating a second profile at the same address under a different DBA to capture an additional category (e.g., a restaurant creating a second "bar" profile at the identical address) — this is a duplicate-listing violation, not a legitimate second location.

---

## 3. Business name, address, and phone must be accurate and match the real world — not "NAP consistency" as Google's own term

**Rule:** Represent the business name exactly as it appears on real-world signage/stationery (no keyword stuffing, taglines, store codes, or trademark symbols); use a precise, real address (no P.O. boxes or unstaffed virtual offices); and use a phone number that connects to the individual location, not a central call-center line.

**Mechanism:** Google's representation guidelines require the name to "reflect your business accurately" and be "consistently represented and recognized in the real world across signage, stationery, and other branding" — explicitly prohibiting marketing taglines, store/location codes, trademark symbols, unnecessary full capitalization, hours/status text, phone numbers or URLs embedded in the name field, and keyword/service descriptors appended to the name. On address: "P.O. boxes or mailboxes located at remote locations aren't acceptable," and virtual offices are prohibited "unless staffed during business hours" with customers actually received there; co-working spaces need "clear signage," staffing, and customer reception during business hours. On phone: provide a number that "connects to your individual business location" rather than "a central call center helpline."

**Acceptance criterion:** The profile's name field contains only the real, signed business name with no appended marketing/location/keyword text; the address resolves to a staffed, signed, physically visitable location (not a mailbox or unstaffed virtual office); the phone number rings through to that specific location.

**Verification method:** Compare the profile's name/address/phone fields against the physical storefront signage (photo audit) and the business's own "Contact" page; call the listed number and confirm it reaches the specific location, not a shared call center.

**Source:** Google Business Profile Help, "Guidelines for representing your business on Google," https://support.google.com/business/answer/3038177?hl=en. **Tier 1.**

**Terminology gap — read carefully:** The industry acronym **"NAP" (Name/Address/Phone) consistency does not appear in Google's own guidelines** — Google documents accuracy and real-world consistency for each field individually (as above) but never bundles them under that label or states a formal "cross-directory consistency" ranking mechanism. Treat "NAP consistency" itself as `Convention — not vendor-confirmed` (**Tier 4**); treat the underlying per-field accuracy rules as **Tier 1**. Bing's own guidance does use consistency language directly ("Your Name, Address, and Phone number must match your legal business documents and your website" — Bing Places for Business Help, data quality guidelines, **Tier 1**), so the practice is Tier 1 for Bing specifically, even though Google never uses the "NAP" framing.

**Anti-pattern:** Appending city/keyword text to the business name field ("Acme Plumbing — Best Emergency Plumber Denver"), listing a UPS Store mailbox as the address, or routing the listed phone number to a national call center instead of the branch.

---

## 4. Service-area businesses: one profile, address hidden, ~2-hour driving-time ceiling

**Rule:** A business that travels to customers rather than receiving them at a fixed address gets exactly **one** service-area profile; hide the street address and declare the service area by city/postal code (not a radius), keeping the overall footprint within roughly a 2-hour drive of the business's base.

**Mechanism:** Google's service-area guidance states: "Service-area businesses can only have one profile for the whole area that they serve," supports up to 20 declared service areas, and caps the geographic scope: "The boundaries of your overall area shouldn't be more than about 2 hours of driving time from where your business is based." Areas must be defined "by city, postal code, or another type of area" rather than a radius. If the business does not receive customers at its own address, that address must be removed from the profile: "If you don't serve customers at your business address, remove your address from your Business Profile."

**Acceptance criterion:** Exactly one profile exists for the service-area business; the address field is empty (or, for a hybrid business, populated only if customers are actually received there — see below); declared service areas are named administrative units, not a radius value; the furthest declared area is within roughly 2 hours' driving time of the base.

**Verification method:** Inspect the profile in Business Profile Manager — confirm address visibility state matches whether customers are received on-site, and confirm service areas are listed as place names rather than a mile/km radius.

**Source:** Google Business Profile Help, "Manage your service areas for service-area & hybrid businesses," https://support.google.com/business/answer/9157481?hl=en. **Tier 1.**

**Anti-pattern:** Declaring a nationwide or multi-state service area from a single local base (violates the ~2-hour driving-time ceiling), or leaving the street address visible for a business that never receives customers there.

---

## 5. Hybrid businesses: storefront address + service area, both allowed together

**Rule:** A business that serves customers both at its own address *and* by traveling to them (a "hybrid business") keeps its address visible, sets staffed availability hours, and layers a service area on top — it is not forced to choose one model.

**Mechanism:** Google defines a hybrid business explicitly: "A business that serves customers at its business address but also directly visits or delivers to them." Unlike a pure service-area business, a hybrid business "must include their address if they serve customers there, even if they also have a service area."

**Acceptance criterion:** A hybrid business's profile shows a real, visitable, staffed address AND a declared service area simultaneously; the address is not hidden.

**Verification method:** Confirm in Business Profile Manager that both the address field and the service-area field are populated for a business documented to serve customers on-site.

**Source:** Google Business Profile Help, "Manage your service areas for service-area & hybrid businesses," https://support.google.com/business/answer/9157481?hl=en. **Tier 1.**

**Anti-pattern:** Hiding the address for a business that does, in fact, receive walk-in customers on-site — this misrepresents the business model and is a guideline violation, not a privacy feature.

---

## 6. Category selection — fewest categories, "IS" not "HAS"

**Rule:** Choose the smallest number of categories that fully describes what the business fundamentally *is*, not a longer list describing everything it offers or has on-site.

**Mechanism:** Google's guidance: select categories that complete "This business *IS* a ___" rather than what it "HAS" or "sells," and use "as few categories as possible" to describe the overall core business — categories should not be used "solely as keywords or to describe attributes."

**Acceptance criterion:** The primary category is the single most specific descriptor of the business's core identity; any additional categories describe genuinely distinct services offered at the same location, not synonyms or keyword variants of the primary category.

**Verification method:** Read the selected categories aloud in the "This business IS a ___" template; any category that only fits "This business HAS ___" is miscategorized and should be removed.

**Source:** Google Business Profile Help, "Guidelines for representing your business on Google," https://support.google.com/business/answer/3038177?hl=en. **Tier 1.**

**Anti-pattern:** Selecting the maximum allowed number of categories to maximize keyword surface area (e.g., a plumbing company also selecting "Contractor," "Handyman," and "Bathroom remodeler" purely for search coverage rather than because those are genuinely distinct offered services).

---

## 7. Local ranking factors as Google documents them: relevance, distance, prominence — and nothing else

**Rule:** Treat "relevance, distance, and prominence" as the complete, exhaustive list of local ranking factors Google itself names; do not present any additional weighted factor (review count thresholds, citation counts, response-time windows, etc.) as a Google-confirmed input.

**Mechanism:** Google's own local-ranking help page states verbatim: relevance is "how well a Business Profile matches what someone is searching for"; distance is "how far each business is from the customer who's searching" (using the searcher's location, or an inferred location if none is shared); prominence is "how well-known a business is," influenced by "how many websites link to your business and how many reviews you have," with review count and rating explicitly named as inputs to prominence. Google also states directly that businesses "can't pay to be more prominent in local results — ranking is based on... relevance, distance, and prominence, combined," and there is "no way to request or pay for a better local ranking."

**Acceptance criterion:** Any local-SEO checklist item traces back to one of these three named factors (relevance = complete/accurate business info matching search intent; distance = fixed given user location, not directly actionable; prominence = reviews, backlinks, general web presence/authority) with no fourth, Google-sourced factor invented.

**Verification method:** For any claimed "ranking factor," search Google's own Business Profile Help and Search Central documentation for the specific term; if it does not appear in Google's first-party text, it is industry inference, not documented fact (see §8).

**Source:** Google Business Profile Help, "Tips to improve your local ranking on Google," https://support.google.com/business/answer/7091?hl=en. **Tier 1.**

**Anti-pattern:** Presenting a specific numeric factor weighting ("reviews are 24% of the algorithm," "citations are worth X points") as something Google states — Google names the three factors qualitatively and explicitly declines to publish relative weights or a scoring formula.

---

## 8. The 187-factor industry survey is opinion aggregation, not measurement — cite it as such or not at all

**Rule:** When citing a local-ranking-factors survey (e.g., Whitespark's annual report), label it explicitly as an **expert-opinion survey**, never as an empirical measurement of Google's algorithm, and never blend its category weightings into a claim attributed to Google.

**Mechanism:** Whitespark's 2026 Local Search Ranking Factors survey — methodology as reported: 47 named local-search practitioners complete a roughly two-hour structured survey scoring 187 candidate factors and answering open-ended questions about what they believe drives local rankings; the survey has run in some form since 2008 (originated by David Mihm) and been run by Whitespark since 2017, repeating roughly every 2–3 years. This is a structured, named, dated survey with a disclosed methodology (expert panel scoring), which is why it clears the bar for Tier 3 at all — but it remains **practitioner belief aggregated across a panel**, not a measurement of live ranking behavior, and it is not vendor-confirmed by Google in any way.

**Acceptance criterion:** Any document citing this survey names the survey, its year, its panel size, and states plainly that it reflects expert opinion/consensus, not a Google-confirmed weighting; it is never the sole citation for a claim presented as "Google's algorithm does X."

**Verification method:** Trace any cited "ranking factor weight" back to its source; if the only source is a practitioner survey, the citation notation must read `Tier 3 — expert-opinion survey, not vendor-confirmed`, not `Tier 1`.

**Source:** Whitespark, "Local Search Ranking Factors" (2026 edition, published 2025-11-06 by Darren Shaw), https://whitespark.ca/local-search-ranking-factors/. **Tier 3** (named, dated, disclosed methodology — used for corroboration only, never as a documented-fact citation).

**Anti-pattern:** Writing "Google weighs reviews at roughly a quarter of the local ranking algorithm" and citing only a practitioner survey for that specific number — the number is a panel's aggregated belief, not something Google has published.

---

## 9. Organic and map-pack ranking: related through prominence, but Google does not document a unified formula

**Rule:** Do not claim Google has published a specific, documented relationship or shared scoring formula between organic web ranking and the local map-pack; the only Google-confirmed link is qualitative — organic web presence (links, content, authority) feeds into the "prominence" factor (§7) that also drives map-pack placement.

**Mechanism:** Google's local-ranking documentation names prominence as partly driven by "how many websites link to your business" — i.e., signals normally associated with organic web ranking (backlinks, general web visibility) also feed the local-pack prominence input. Beyond that qualitative overlap, Google has not published a document in the sources checked here that states organic ranking and map-pack ranking share a formula, use the same index, or are computed by the same system; the local pack draws its displayed name/address/phone/reviews/photos from the Business Profile rather than from webpage content directly.

**Acceptance criterion:** A claim about organic/map-pack interaction is limited to: "prominence draws in part on general web signals also relevant to organic ranking" — anything more specific (a shared score, a stated weighting split between the two systems) is not supported by a Tier 1 source and must be labeled `Convention — not vendor-confirmed` (**Tier 4**).

**Verification method:** Search Google Business Profile Help and Google Search Central for an explicit statement equating or formulaically relating organic and local-pack ranking; none was found as of this research date — treat the absence itself as the finding, not as license to fill the gap with a practitioner claim presented as fact.

**Source:** Google Business Profile Help, "Tips to improve your local ranking on Google," https://support.google.com/business/answer/7091?hl=en (documents the prominence/web-links overlap only). **Tier 1** for the overlap statement; **no Tier 1 source found** for any stronger unification claim — flagged as an open gap per the research brief's instruction to say so plainly.

**Anti-pattern:** Advising a client that "ranking #1 organically will guarantee a map-pack top-3 spot" or vice versa — Google documents only a partial, indirect overlap (via prominence), not equivalence or guaranteed correlation.

---

## 10. `LocalBusiness` structured data — no hard-required properties, but incomplete markup forfeits eligibility

**Rule:** Mark up each physical location with the most specific `LocalBusiness` subtype available (not the bare `LocalBusiness` type), populating at minimum `name` and `address`, and add `geo`, `telephone`, `openingHoursSpecification`, `priceRange`, and `url` wherever applicable.

**Mechanism:** Google's structured-data documentation for LocalBusiness lists `name` and `address` (as a `PostalAddress` with `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountry`) as the properties it documents; it recommends `geo` (`GeoCoordinates`, minimum 5 decimal places), `openingHoursSpecification` for hours, `telephone` (with country/area code), `priceRange` (under 100 characters), and `url` (fully-qualified, working link). Google explicitly directs implementers to "use the most specific LocalBusiness sub-type possible" (e.g., `Restaurant`, `DaySpa`, `Electrician`, `Plumber`) rather than the generic `LocalBusiness` type, and clarifies that when a business needs multiple types simultaneously, they must be specified as a JSON array — `additionalType` is explicitly **not** supported for this purpose.

**Acceptance criterion:** Each location's JSON-LD `@type` is the most specific applicable schema.org subtype (verified against the schema.org type hierarchy, §11); `name` and `address` are populated; the page passes Google's Rich Results Test for the Local Business feature with no missing-field warnings on the recommended properties present in the source data.

**Verification method:** Run the URL through the Rich Results Test; separately, `curl -s <url> | grep -A50 'application/ld+json'` to confirm `@type` is not the bare string `"LocalBusiness"` when a more specific subtype applies.

**Source:** Google Search Central, "Local Business (LocalBusiness) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/local-business (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Marking every location as bare `"@type": "LocalBusiness"` when a specific subtype (`Dentist`, `Restaurant`, `AutoRepair`) is available and known — this is valid but forfeits the more precise categorization Google's own guidance recommends; also, using `additionalType` as an array workaround for multiple types instead of the documented array-of-`@type`-strings pattern.

---

## 11. `LocalBusiness` sits under both `Organization` and `Place` in the schema.org hierarchy — pick the deepest applicable subtype

**Rule:** Before writing custom markup, check the schema.org type hierarchy for a subtype that already matches the business (schema.org documents well over 100 `LocalBusiness` specializations); only fall back to bare `LocalBusiness` if genuinely no subtype fits.

**Mechanism:** Schema.org defines `LocalBusiness` as "A particular physical business or branch of an organization. Examples of LocalBusiness include a restaurant, a particular branch of a restaurant chain, a branch of a bank, a medical practice, a club, a bowling alley, etc." It inherits from **both** `Organization` (business-identity properties) and `Place` (location properties: `geo`, `address`, `containedInPlace`), and adds its own properties including `currenciesAccepted`, `openingHours`, `paymentAccepted`, and `priceRange`. Documented subtypes span hospitality (`Restaurant`, `Hotel`/`LodgingBusiness`, `CafeOrCoffeeShop`), healthcare (`Dentist`, `MedicalBusiness`, `Pharmacy`), professional services (`LegalService`, `FinancialService`, `AccountingService`), and dozens more.

**Acceptance criterion:** The `@type` value used for each location resolves to a real, non-deprecated page on `https://schema.org/<TypeName>` and is a documented subtype of `LocalBusiness` (verifiable by walking up the schema.org type hierarchy from that page to `LocalBusiness` → `Organization`/`Place` → `Thing`).

**Verification method:** Fetch `https://schema.org/<chosen-type>` and confirm its "part of" or "subclass of" chain includes `LocalBusiness`; the current schema.org release is version 30.0 (dated 2026-03-19) at time of this research.

**Source:** Schema.org, "LocalBusiness," https://schema.org/LocalBusiness. **Tier 1.**

**Anti-pattern:** Inventing a non-schema.org type name for a business category that already has a documented subtype (e.g., writing a custom `"@type": "CoffeeShop"` instead of the documented `CafeOrCoffeeShop`) — the invented string will not validate and search engines cannot map it to any known type.

---

## 12. Multi-location businesses: `department` nests sub-units, but each physical location still needs its own node

**Rule:** For a business with multiple named departments *at the same address* (e.g., a pharmacy inside a supermarket), use the `department` property to nest the sub-unit under the parent `LocalBusiness` node; for genuinely separate physical addresses, each location gets its own independent `LocalBusiness` node (and, in practice, its own URL — see §13–14) rather than being nested as a "department" of another location.

**Mechanism:** Google's documentation supports `department` specifically for "nested business units" sharing a single physical location, with a stated naming convention: combine the store name with the department name (e.g., "gMart Pharmacy") or use an explicitly branded name for the sub-unit. This property models co-located distinct entities, not a chain's separate branches in different cities.

**Acceptance criterion:** `department` is used only when the nested entity shares the parent's physical address; a chain's branch in a different city is a sibling `LocalBusiness` node with its own `address`, not a `department` of a flagship location.

**Verification method:** For any use of `department` in markup, confirm the nested entity's address (if present) is identical to the parent's; if it differs, the markup is misapplied and should instead be a separate top-level `LocalBusiness` node.

**Source:** Google Search Central, "Local Business (LocalBusiness) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/local-business. **Tier 1.**

**Anti-pattern:** Using `department` to represent a franchise's separate-city branches (conflates distinct physical locations into one node's sub-units, which breaks per-location address/geo data).

---

## 13. Location pages vs. doorway pages — the line is genuine local content, not the mere existence of city-specific URLs

**Rule:** It is legitimate to publish one page per genuine physical/service location; it becomes a policy violation when those pages are built primarily to rank for city/region-name queries and funnel users onward without adding location-specific value.

**Mechanism:** Google's spam policies define doorway abuse as pages "created to rank for specific, similar search queries" that funnel users to another page, explicitly citing as an example: "Having multiple domain names or pages targeted at specific regions or cities that funnel users to one page." The same policy family also warns against "creating substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy" and "multiple websites with slight variations to the URL and home page to maximize... reach for any specific query." Google does **not** publish a dedicated "location page requirements" document — the applicable guidance is this general doorway-abuse policy, applied to the local-page case.

**Acceptance criterion:** Each location page contains content genuinely specific to that location (real address, real hours, real staff/inventory/service-area detail, unique photos) rather than a templated city-name swap over otherwise identical body copy; the page is a genuine destination, not an intermediate funnel to a single central page.

**Verification method:** Diff the body content of two location pages after stripping the NAP block and city name — if the remaining content is substantially identical boilerplate, the pages risk doorway classification; also check whether each page's primary CTA is a real local action (call this branch, get directions) rather than a redirect to one central page.

**Source:** Google Search Central, "Spam policies for Google web search" (doorway abuse section), https://developers.google.com/search/docs/essentials/spam-policies (last updated 2026-05-15 UTC). **Tier 1.**

**Anti-pattern:** Generating one thin page per ZIP code or per nearby city by templating only the place-name token into otherwise-identical copy, with no real local signal (address, hours, local staff, local reviews) behind any of them.

---

## 14. Store locators must expose real, crawlable `<a href>` links to individual location pages — not JS-only or iframe-embedded widgets

**Rule:** A store/location locator must render standard `<a>` elements with real `href` URLs to each location's own page in the initial or execution-time DOM that Googlebot processes; it must not rely solely on `onclick` handlers, custom router directives, non-anchor elements, or an iframe-embedded third-party widget to reach location detail.

**Mechanism:** Google's crawlable-links documentation states plainly: "Google can only crawl your link if it's an `<a>` HTML element (also known as anchor element) with an `href` attribute" — and explicitly calls out that `<a onclick="goto('...')">`, custom-framework attributes like `<a routerLink="...">`, non-anchor elements such as `<span href="...">`, and `javascript:` pseudo-protocol hrefs are **not** reliably parsed, even though Google "may still attempt to parse this." Content embedded inside an iframe is a separate, well-known crawlability gap outside this same document's core rule — the practical consequence for locators is that an iframe-only widget structurally prevents Google from discovering the per-location URLs at all, since there is no crawlable link on the parent page to follow.

**Acceptance criterion:** Viewing the store locator's page source (not the browser's rendered/inspected DOM) shows a real `<a href="/stores/...">` for every listed location, resolving to a real, unique, indexable URL for that location — not merely a JS click-handler or an iframe `src` pointing to a third-party domain.

**Verification method:** `curl -s <locator-url> | grep -o '<a[^>]*href="[^"]*store[^"]*"'` (or the site's actual URL pattern) to confirm anchor tags with real hrefs are present in server-rendered or hydration-complete output; separately, search the raw page source for a specific store's street address — if it cannot be found in source, per Google's stated crawling model neither can Googlebot reliably index that location's identity on the locator page.

**Source:** Google Search Central, "SEO for JavaScript Apps: crawlable links," https://developers.google.com/search/docs/crawling-indexing/links-crawlable (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** A locator that renders location results only after a client-side API call into a `<div onclick>` card with no underlying `<a href>`, or that loads per-location detail inside an `<iframe>` sourced from a separate locator SaaS domain — both patterns leave Google with no crawlable path to the individual location's own indexable URL.

---

## 15. Bulk location management: the 10-location threshold and the verified-before-visible rule

**Rule:** Businesses with 10 or more physical locations should use Google's bulk import/verification path rather than creating and verifying each Business Profile individually; regardless of path, no location appears on Search, Maps, or other Google surfaces until it passes verification.

**Mechanism:** Google's bulk-location documentation states: "If your business has 10 or more locations you can add, verify, and manage them in bulk," via a spreadsheet-based data feed uploaded in Business Profile Manager, with a stated preference for a business-domain verification email ("An email address that is not affiliated with your business domain will take longer to verify, and may delay the process"). Google is explicit that this is a hard gate, not a courtesy: "Your locations won't be eligible to appear on Search, Maps, and other Google properties until they are verified." Hotel-specific attribute updates are called out as unsupported through the spreadsheet path and must go through the Business Profile API instead.

**Acceptance criterion:** For a chain of 10+ locations, all location records originate from a single validated data feed (not ad hoc individual entry) and each location shows a "Verified" state in Business Profile Manager before any claim is made about its Search/Maps visibility.

**Verification method:** In Business Profile Manager's location list, filter by verification status; any location still in "Pending" or "Unverified" state should not be represented as live in any reporting or QA checklist.

**Source:** Google Business Profile Help, "Bulk location management overview," https://support.google.com/business/answer/3217744?hl=en. **Tier 1.**

**Anti-pattern:** Reporting a newly added multi-location rollout as "live" based on the spreadsheet upload completing, without confirming each row cleared verification — an unverified location does not appear on Search or Maps regardless of how correct its data feed row is.

---

## 16. Review structured data: self-serving reviews on `LocalBusiness`/`Organization` markup are ineligible for the star rich result

**Rule:** Never mark up `Review`/`AggregateRating` data for a `LocalBusiness` or `Organization` entity on that same entity's own site — including via an embedded third-party reviews widget the business itself controls — and expect it to earn the star-rating rich result.

**Mechanism:** Google's review-snippet documentation states the rule directly: "If the entity that's being reviewed controls the reviews about itself, their pages that use `LocalBusiness` or any other type of `Organization` structured data are ineligible for star review feature." This "self-serving" condition applies whether the reviews are hand-authored in the markup or sourced through an embedded widget (Google's own guidance names both first-party Google Business reviews and third-party widgets like a Facebook-reviews embed as covered cases) — the deciding factor is that the reviewed entity, not an independent third party, controls which reviews appear. This restriction is specific to `LocalBusiness`/`Organization`; it does **not** apply to `Product` review markup, where a merchant collecting and displaying reviews of its own products remains fully eligible.

**Acceptance criterion:** A `LocalBusiness`/`Organization`-typed page's own site does not carry `Review`/`AggregateRating` markup for itself; if third-party review platforms (Google, Yelp, industry directories) display aggregate ratings, those live on the third party's own pages, not re-published as self-authored structured data on the reviewed business's own domain.

**Verification method:** Run the Rich Results Test on the business's own page; if `LocalBusiness`/`Organization` + `AggregateRating`/`Review` markup is present, confirm it is flagged ineligible for the star rich result rather than assuming presence of markup equals eligibility.

**Source:** Google Search Central, "Review Snippet (Review, AggregateRating) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/review-snippet (last updated 2026-07-24 UTC). **Tier 1.**

**Anti-pattern:** Embedding a widget that pulls the business's own Google reviews (or its own curated testimonials) into `LocalBusiness` JSON-LD on the business's own site, expecting star ratings in the SERP snippet — Google explicitly disqualifies this configuration regardless of whether the underlying reviews are genuine.

---

## 17. Review policy prohibits paid, incentivized, or pressured reviews — and self-requesting removal-for-incentive

**Rule:** Never offer any incentive (payment, discount, free goods/services) in exchange for posting, revising, or removing a review, and never pressure customers to leave reviews on-premises or dictate what the review must say.

**Mechanism:** Google's prohibited-and-restricted-content policy states: content is prohibited when it results from an incentive — "payment, discounts, free of cost goods and/or services" — offered "in exchange for posting any review or revision or removal of a negative review." It further restricts content "not based on a real experience" or that "does not accurately represent the location or product," and prohibits posting from multiple accounts by or at the request of one person to manipulate apparent volume. Google separately states merchants "should not require or pressure users to leave ratings or write reviews while on the premises, nor should they request that specific content be included" — but explicitly permits soliciting genuine reviews without incentive: merchants "may solicit or encourage the posting of content that does represent a genuine experience, without offering incentives."

**Acceptance criterion:** No documented instance of the business offering a discount, refund, or free item conditioned on posting (or removing/editing) a review; no in-store script or signage pressuring customers to review on the spot or dictating review content; any review-solicitation process (email/SMS ask) contains no incentive language.

**Verification method:** Audit customer-facing review-request templates (email, SMS, in-store signage/QR flow) for incentive language or scripted-content requests; cross-check any "leave us a review" campaign against whether a reward is attached.

**Source:** Google Business Profile Help, "Prohibited and restricted content," https://support.google.com/business/answer/7400114?hl=en. **Tier 1.**

**Anti-pattern:** A "leave a 5-star review, get 10% off your next visit" promotion — this is a prohibited incentivized-review scheme even though the underlying reviews might be genuine experiences, because the incentive itself is the violation, independent of review sincerity.

---

## 18. Bing Places: comparable eligibility model, explicit NAP-consistency language, and its own guideline-violation suspension risk

**Rule:** Treat Bing Places for Business as a parallel, independently governed listing surface with its own data-quality guidelines — do not assume Google guideline compliance automatically satisfies Bing, and match business info exactly across both.

**Mechanism:** Bing's own data quality guidelines require Name/Address/Phone to "match your legal business documents and your website" — Bing, unlike Google, states this consistency requirement using the NAP framing directly. Bing's eligibility model parallels Google's: local/single-location small businesses and national/regional chains are supported categories, while purely online businesses without a physical presence are generally excluded. Bing explicitly warns that "your business listing may get suspended if the guidelines are not followed and/or the content provided by you can mislead the users in any way," and separately flags category miscategorization (available: one primary + up to nine additional categories) as "a common mistake that can lead to listing suspension."

**Acceptance criterion:** The Bing Places listing's name/address/phone are byte-for-byte identical to the Google Business Profile and the website's own contact information; the selected Bing categories mirror the "IS not HAS" logic used for Google (§6).

**Verification method:** Pull the Bing Places listing detail page and diff its name/address/phone fields against both the Google Business Profile and the site's footer/contact-page NAP block.

**Source:** Bing Places for Business Help, data quality guidelines, https://www.bing.com/forbusiness/help/manageYourListings?setlang=en. **Tier 1** (per this module's source-tier scope, Bing Places is designated Tier 1 alongside Google/Schema.org).

**Anti-pattern:** Letting the Bing Places listing drift out of sync after the Google profile is updated (e.g., a phone number or hours change applied only on Google) — Bing does not auto-sync from Google, so divergence here is a self-inflicted consistency failure.

---

## 19. Citations and directory listings — an industry concept Google does not formally define or confirm as a ranking input

**Rule:** Do not present "citation count" or "citation consistency across directories" as a Google-confirmed ranking factor with a specific threshold or weight; treat it as `Convention — not vendor-confirmed` and limit any citation-building work to what Google's own accuracy guidelines already require (§3) — consistent, accurate business information wherever it appears.

**Mechanism:** No Google Business Profile Help page or Google Search Central document fetched for this research defines "citation" as a term, states a minimum citation count, or confirms citation volume/consistency as an explicit ranking input. The closest Tier 1 material is Google's per-field accuracy requirement in the representation guidelines (§3) and the qualitative "prominence" factor naming inbound links and reviews (§7) — neither is "citations" in the industry sense of structured NAP listings on data aggregators and directories. The concept, the specific aggregator ecosystem (data providers, niche directories), and any claimed count thresholds are entirely industry-originated and appear only in Tier 3/4 sources.

**Acceptance criterion:** Any SOP text referencing "citations" is explicitly labeled as industry convention, not documented Google policy; no specific numeric citation-count target is presented as a documented requirement.

**Verification method:** Search Google Business Profile Help and Google Search Central for the literal term "citation" in a local-SEO ranking context; absence of a match confirms this remains an undocumented, practitioner-only concept as of this research date.

**Source:** Absence-of-evidence finding across Google Business Profile Help (https://support.google.com/business) and Google Search Central (https://developers.google.com/search/docs) — no Tier 1 source found defining or confirming citations as a ranking input. **Flagged gap**, not a citation of documented fact.

**Anti-pattern:** Selling or specifying "50 high-authority citations" as a deliverable with an implied guaranteed ranking effect — no primary source supports a numeric citation target as a documented Google or Bing ranking mechanism.

---

## 20. `AggregateRating`/`Review` required properties — the minimum for any (non-self-serving) implementation

**Rule:** Where review markup is legitimately eligible (i.e., not self-serving per §16), ensure `Review` carries `author`, an identified `itemReviewed`, and a `reviewRating` with a numeric `ratingValue`; ensure `AggregateRating` carries an identified `itemReviewed`/`name`, a numeric `ratingValue`, and at least one of `ratingCount` or `reviewCount`.

**Mechanism:** Google's review-snippet documentation lists these as the required fields for the two supported types: for `Review`, `author` (Person or Organization, under 100 characters), `itemReviewed` (with the reviewed entity's specific schema.org type, if not nested inside it), and `reviewRating.ratingValue` (as a number, fraction, or percentage); for `AggregateRating`, `itemReviewed.name` (or the parent entity's `name`), `ratingValue`, and either `ratingCount` or `reviewCount`.

**Acceptance criterion:** Every `Review`/`AggregateRating` node in production markup contains all fields listed above with no placeholder or missing values; the Rich Results Test reports no "missing required field" errors for the review-snippet feature (independent of the self-serving eligibility question in §16).

**Verification method:** Run the Rich Results Test against the URL; separately parse the JSON-LD with a script asserting the presence of each required key.

**Source:** Google Search Central, "Review Snippet (Review, AggregateRating) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/review-snippet. **Tier 1.**

**Anti-pattern:** Publishing `AggregateRating` with a `ratingValue` but no `ratingCount`/`reviewCount` at all — Google requires at least one of the two count fields; a bare average with no sample size is incomplete markup, not just weak signal.

---

## 21. Suspension triggers and the guideline-violation → restriction pipeline

**Rule:** Treat Business Profile suspension/restriction as a documented enforcement consequence of specific, named guideline violations (not an arbitrary or unappealable event), and build appeal-readiness (evidence, corrected profile) into any multi-location or reinstatement process from the start.

**Mechanism:** Google reserves the right to suspend access to Business Profiles for guideline violations; documented suspension states include a "soft" suspension (profile remains live but uneditable pending appeal) and a "hard" suspension (profile is removed from Search/Maps pending appeal). Google's own fix-and-appeal documentation directs the operator to first bring the profile into compliance with the representation guidelines (§3, §6) before submitting an appeal, and separately allows submitting supporting evidence where the business name and address on the evidence must match the profile under appeal.

**Acceptance criterion:** Before any appeal is filed, the profile has been re-audited against the representation guidelines (name/address/category rules) and any identified violation corrected; evidentiary documents submitted with the appeal show a business name/address matching the profile exactly.

**Verification method:** Re-run the checks in §3 and §6 against the suspended profile prior to appeal; confirm any submitted evidence (business license, utility bill, lease) shows matching name/address before submission.

**Source:** Google Business Profile Help, "Fix suspended or disabled profiles," https://support.google.com/business/answer/4569145?hl=en; "Appeal Business Profile content & profile restrictions," https://support.google.com/business/answer/13597551?hl=en. **Tier 1.**

**Anti-pattern:** Filing a reinstatement appeal without first correcting the underlying guideline violation that triggered the suspension (e.g., appealing while the name field still contains keyword-stuffed text) — Google's own guidance frames compliance-first as the expected order of operations, not appeal-first.

---

## 22. Category-driven markup pattern for department/multi-brand co-located entities must not blur into fake distinct listings

**Rule:** When two nominally distinct brands occupy the same address (e.g., a hotel with an in-house named restaurant), model the relationship with `department`/parent-child structured data rather than creating two independent, separately-verified Business Profiles at the identical address unless each genuinely operates as its own customer-facing entity with distinct signage and hours.

**Mechanism:** This follows directly from combining §2 (one profile per location; duplicates cause display problems) with §12 (`department` is the documented structured-data mechanism for co-located sub-units). Google's guidance on categories (§6) and on duplicates (§2) together imply that a co-located sub-brand should be represented as a nested department relationship in markup, and — on the Business Profile side specifically — only warrants its own separate profile if it independently satisfies the eligibility bar in §1 (its own signage, its own customer-facing hours, genuinely distinguishable to a visitor arriving on-site).

**Acceptance criterion:** A co-located sub-brand either (a) has its own real signage/hours distinct from the host location and thus qualifies for its own Business Profile, or (b) does not, and is represented only as a `department` in structured data with no separate Business Profile created.

**Verification method:** On-site photo audit — does the sub-brand have its own visible signage and posted hours independent of the host business? If not, no separate profile should exist; if markup-only, verify the `department` relationship per §12.

**Source:** Synthesized from Google Business Profile Help, "Guidelines for representing your business on Google," https://support.google.com/business/answer/3038177?hl=en (duplicates/one-profile rule) and Google Search Central, "Local Business (LocalBusiness) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/local-business (`department` property). **Tier 1** (combination of two directly documented rules; the combination itself is this document's synthesis, not a single Google source stating the composite rule).

**Anti-pattern:** Creating and separately verifying a Business Profile for an in-house cafe inside a hotel that has no independent signage or hours of its own — this is functionally a duplicate-adjacent listing at the same address dressed up as a "different business."

---

## Summary of documented gaps (per research brief instruction to flag plainly)

1. **Local ranking factors:** Google names exactly three (relevance, distance, prominence — §7); the ~187-factor industry survey (§8) is opinion aggregation with disclosed methodology, not measurement, and should never be cited as if it were Google's own weighting.
2. **Organic ↔ map-pack relationship:** Google confirms only a partial, qualitative overlap via prominence (§9); no unified formula or equivalence claim is documented anywhere in the sources checked.
3. **"NAP consistency":** the acronym and the "cross-directory consistency" framing are industry vocabulary (§3) — Google enforces per-field accuracy but never uses the NAP term or documents a formal citation-consistency ranking mechanism; Bing is the one primary source that does use consistency language directly.
4. **Citations/directory listings:** entirely undocumented by Google as a formal ranking input (§19) — no citation-count claim in this space should be attributed to Google or Bing without a Tier 1 source, because none was found.

No deprecations specific to local/multi-location SEO surfaced in the last 24 months beyond the general review-snippet policy tightening already covered in §16–17 and the doorway-abuse policy consolidation dated 2026-05-15 (§13); both are folded into their respective sections above rather than listed separately, since neither reverses prior guidance — both sharpen enforcement of a pre-existing rule.
