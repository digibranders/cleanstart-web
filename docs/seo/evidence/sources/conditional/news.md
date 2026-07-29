# News & Publisher SEO — Evidence Source Document (Conditional Module)

> **⚠ Untested against a working implementation.** CleanStart publishes marketing and technical content — it is not a news publisher, is not enrolled in Google News, and implements none of the mechanisms below (no `NewsArticle` markup, no Google News sitemap, no paywall, no live-blog content). Every rule in this document rests **on documentation alone**; nothing here has been validated against CleanStart's codebase or a live deployment. Treat this module as reference material to apply only if/when the org takes on a news-classified property, and re-verify every acceptance criterion against the actual target site before shipping.

Research conducted 2026-07-29. Scope: Google News eligibility and inclusion process; `NewsArticle` structured data; Google News sitemaps (format, 48-hour window, limits); Top Stories eligibility; article dating (`datePublished`/`dateModified` semantics, updating vs. republishing); bylines and author markup; paywalled content (`isAccessibleForFree`/`hasPart`); content licensing signals; E-E-A-T as the Search Quality Rater Guidelines actually define it; corrections/retractions markup; live-blog markup.

**Tier definitions used below:**
- **Tier 1** — Google Search Central (developers.google.com), Google News Publisher Center Help (support.google.com/news/publisher-center), Schema.org, the Search Quality Rater Guidelines PDF itself.
- **Tier 2** — first-party platform docs (none needed beyond Tier 1 for this scope).
- **Tier 3** — named, dated empirical study with published methodology (none found load-bearing for this scope).
- **Tier 4** — practitioner consensus / trade press, labeled `Convention — not vendor-confirmed`, used only to corroborate or explicitly rebut widely-repeated claims.

Total requirements documented below: **17** discrete testable rules across 17 sections.
Source split: **15 Tier 1** citations (primary), **2 sections** where the honest Tier‑1 finding is an *absence* of Google documentation (corrections markup, live-blog markup) corroborated against Tier 4 practitioner claims that turn out to be unconfirmed or stale.

---

## 1. Google News inclusion is automatic, not an application

**Rule:** Do not build or budget for a Google News "application" step — treat inclusion as a compliance gate, not a submission workflow.

**Mechanism:** Google Publisher Center Help states verbatim: **"Google automatically considers all web content for inclusion in Google News, so you don't need to apply."** Eligibility instead depends on (1) complying with Google's overall Search requirements/policies and (2) complying with Google News content policies. Publisher Center itself "isn't an authoring tool or a content management system" — it's a configuration surface (name, logo, sections, monetization settings), not a gatekeeper you submit content through.

**Acceptance criterion:** A news-classified URL that (a) is indexed by Google, (b) meets Google Search Essentials, and (c) meets Google News content policies is eligible to surface in Google News / Top Stories / Discover without any separate submission action. Conversely, a site cannot "fix" non-eligibility by filing a Publisher Center application — it must fix the underlying policy or technical violation.

**Verification method:** Confirm the article URL is indexed (`site:` search or Search Console URL Inspection), then run it through Search Console's News/Discover-relevant reports; if absent, diagnose against the technical guidelines (§7 below) and content policies (§9 below) rather than looking for an "approval" step.

**Source:** Google Publisher Center Help, "Publisher Center overview," https://support.google.com/news/publisher-center/answer/9606538. **Tier 1.**

**Anti-pattern:** Treating "Google News approval" as a discrete milestone to chase (a common framing in practitioner forums) — there is no approval gate to pass; there is only continuous compliance to maintain.

---

## 2. `NewsArticle`/`Article`/`BlogPosting` structured data has no required properties — but Top Stories does not depend on markup at all

**Rule:** Implement `Article`, `NewsArticle`, or `BlogPosting` JSON-LD on news content for explicit machine-readability, but do not treat any single property as a hard eligibility gate, and do not treat the markup itself as a Top Stories prerequisite.

**Mechanism:** Google's Article structured data doc states "there are no required properties; instead, add the properties that apply to your content," and explicitly: **"While there's no markup requirement to be eligible for Google News features like Top stories, you can add `Article` to more explicitly tell Google what your content is about."** `NewsArticle` and `BlogPosting` are both valid base types alongside `Article`.

**Acceptance criterion:** A `<script type="application/ld+json">` block with `@type` one of `Article`/`NewsArticle`/`BlogPosting` validates in the Rich Results Test with zero errors; absence of this markup does not, by itself, explain a Top Stories absence — that diagnosis must instead look at content policy compliance and indexing.

**Verification method:** Rich Results Test against the live article URL; if a rich result doesn't render, check for missing `headline`/`image`/`datePublished`/`author` (recommended, not required) before assuming a hard failure.

**Source:** Google Search Central, "Learn About Article Schema Markup," https://developers.google.com/search/docs/appearance/structured-data/article (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Assuming a missing/invalid `NewsArticle` block is *the* reason a site is absent from Top Stories — Google explicitly decouples the two.

---

## 3. Author markup — `Person`/`Organization`, `name` only, `url` to a bio

**Rule:** Populate `author` with one entry per contributing author, each typed `Person` (or `Organization` for house bylines), `name` holding the bare name only, and `url` pointing to that author's profile/bio page.

**Mechanism:** Google's guidance: "Include all authors in the markup" (repeat the `author` field per contributor); `author.name` should be "Author's name only—don't include job titles, publisher names, or honorifics"; `author.url` should link to "author's profile, social media, or 'about me' page." Google explicitly: "Use the `Person` type for people, and the `Organization` type for organizations."

**Acceptance criterion:** Every byline on the page has a corresponding `author` object in the JSON-LD; `author.name` string matches the visible byline text exactly (no title/honorific suffix); `author.url` resolves (HTTP 200) to a page containing further biographical information about that person.

**Verification method:** Diff the visible byline text against `author.name` in the rendered JSON-LD; `curl -I` each `author.url` to confirm it resolves; confirm the target page is not a 404 stub.

**Source:** Google Search Central, "Learn About Article Schema Markup," https://developers.google.com/search/docs/appearance/structured-data/article (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** A single `author` object listing "Staff" or a comma-joined string of names inside one `name` field instead of separate `author` entries per contributor.

---

## 4. `datePublished`/`dateModified` — ISO 8601, timezone-aware

**Rule:** Emit both `datePublished` and `dateModified` in ISO 8601 format with an explicit timezone offset.

**Mechanism:** `datePublished`: "The date and time the article was first published, in ISO 8601 format." `dateModified`: "The date and time the article was most recently modified, in ISO 8601 format." Google's own note: "We recommend that you provide timezone information; otherwise, we will default to the timezone used by Googlebot" — i.e., omitting the offset hands Google's own crawl timezone as the fallback, which will not match the publisher's actual local time and can misstate freshness by hours.

**Acceptance criterion:** Both properties are present, parse as valid ISO 8601 datetimes, and include a UTC offset (e.g., `2026-07-29T14:30:00-05:00`) rather than a bare date or a Z/offset-less local time.

**Verification method:** Regex-validate the string against `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$` (or `Z`) in the rendered JSON-LD; Rich Results Test will flag malformed date strings.

**Source:** Google Search Central, "Learn About Article Schema Markup," https://developers.google.com/search/docs/appearance/structured-data/article (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Setting `dateModified` to the current build/deploy timestamp on every CI run (a static-site-generator default) rather than the actual last substantive edit — this silently and continuously "freshens" every page, which crosses into the anti-pattern in §5.

---

## 5. Updating an article vs. artificially freshening vs. republishing under a new URL are three different things with three different rules

**Rule:** Update `dateModified` (and the visible on-page date) only when the article is substantively changed; never delete-and-recreate an article under a new URL to simulate a fresh publish; never bump the date on a cosmetic edit.

**Mechanism:** Google's guidance is explicit and punitive in framing: **"It's against our guidelines to artificially freshen a story when the publisher didn't add significant information or demonstrated a compelling reason."** and separately: publishers should not "create a very slightly updated story from a previously published one, then delete the old story and redirect to the new one." Conversely, when a real substantive update happens, Google's general dates guidance recommends: "If you update a page significantly, also update the visible date (and time, if you display that). If desired, you can show two dates: when a page was originally published and when it was updated."

**Acceptance criterion:** Every `dateModified` bump in the CMS's edit history corresponds to a content diff that adds/removes/corrects substantive information (not a typo fix, formatting pass, or ad-slot change); no article's canonical URL has been deleted and recreated at a new path with the old URL redirected, purely to simulate a new publish.

**Verification method:** Manual editorial audit: pull the CMS revision history for any article whose `dateModified` changed, and confirm the diff is substantive; grep the redirect map for 301s from old article URLs to near-duplicate new articles as a smell test.

**Source:** Google Search Central Blog, "Help Google Search know the best date for your web page," https://developers.google.com/search/blog/2019/03/help-google-search-know-best-date-for. **Tier 1.**

**Anti-pattern:** A CMS "bump to top" feature that rewrites `datePublished`/`dateModified` and the visible date on unmodified evergreen content purely to re-enter a "recent" filter or newsletter digest — this is precisely the behavior the guidance calls out by name.

---

## 6. Headline and image requirements

**Rule:** Keep `headline` concise (it will be truncated on some surfaces if long) and provide at least one `image` that is genuinely relevant to the article, at ≥50,000 total pixels (width × height), ideally supplied in 16:9, 4:3, and 1:1 crops.

**Mechanism:** Google: "Consider using a concise title, as long titles may be truncated on some devices." For images: "Image URLs must be crawlable and indexable," minimum resolution "50K pixels (width x height)," and critically for news specifically: "if you define the image property of `NewsArticle`, the image must be relevant to that news article" (a news-specific relevance requirement layered on top of the general Article image rules) — using a generic stock/placeholder image on a `NewsArticle` violates this.

**Acceptance criterion:** `image` URLs return HTTP 200, are not blocked by `robots.txt`/`noindex`, and each image's pixel area (width × height) is ≥ 50,000; the image visually depicts the article's actual subject, not a generic house graphic.

**Verification method:** `curl -I` each image URL for a 200 and check `Content-Type`; fetch the image and check dimensions (`file <img>` / `identify -format "%wx%h"` with ImageMagick) to confirm the 50K-pixel floor; manual relevance check against the headline.

**Source:** Google Search Central, "Learn About Article Schema Markup," https://developers.google.com/search/docs/appearance/structured-data/article (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Reusing one sitewide "News" masthead graphic as the `image` value across every `NewsArticle` — this fails the NewsArticle-specific relevance requirement even though it would pass for a generic `Article`.

---

## 7. Google News sitemap format and namespace

**Rule:** Publish a dedicated News sitemap (separate from the general sitemap) using the `http://www.google.com/schemas/sitemap-news/0.9` namespace, with `<news:news>` containing `<news:publication>` (`<news:name>` + `<news:language>`), `<news:publication_date>`, and `<news:title>` for every included URL.

**Mechanism:** `<news:name>` "Must match exactly as it appears on news.google.com" (i.e., the name registered for the publication in Publisher Center); `<news:language>` uses an ISO 639 code (with `zh-cn`/`zh-tw` special-cased for Chinese); `<news:publication_date>` uses W3C datetime format; `<news:title>` is "Article headline only, excluding author/publication name" — do not append the site name or byline to the title field the way a browser `<title>` tag might.

**Acceptance criterion:** The sitemap XML validates against the news sitemap namespace; `news:name` string-matches the Publisher Center-registered publication name exactly (case and punctuation); `news:title` contains no " | SiteName" or " - Author" suffix.

**Verification method:** Fetch the sitemap XML and validate the namespace declaration; diff `news:name` against the Publisher Center dashboard's registered name; spot-check `news:title` values against the raw `headline` (not the SEO `<title>` tag, which often has suffixes).

**Source:** Google Search Central, "Create a News Sitemap," https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Reusing the site's rendered `<title>` (which typically appends " | Brand Name") as `news:title` instead of the bare headline.

---

## 8. News sitemap: 48-hour inclusion window and 1,000-URL cap

**Rule:** Include only articles published within the last two days in the News sitemap, and never exceed 1,000 `<news:news>` entries per sitemap file.

**Mechanism:** Google's documented rule: "Only include recent URLs for articles that were created in the last two days" — once an article passes the two-day mark, either remove the URL entirely from the news sitemap or strip its `<news:news>` metadata block (the URL can remain in a *general* sitemap; it just loses News-specific metadata). The per-file cap is 1,000 `<news:news>` tags; a publisher exceeding that volume in a 48-hour window needs a sitemap index pointing at multiple news sitemap files.

**Acceptance criterion:** No `<news:publication_date>` value in the currently-submitted news sitemap is older than 48 hours from the time of the check; the file contains ≤1,000 `<news:news>` blocks (or the site correctly uses a sitemap index for overflow).

**Verification method:** A scheduled job that parses the live news sitemap XML, computes `now() - news:publication_date` for every entry, and alerts if any entry exceeds 48 hours or if entry count exceeds 1,000; this is exactly the kind of check that would need its own cron job and test file per this repo's job conventions if ever implemented.

**Source:** Google Search Central, "Create a News Sitemap," https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Generating the news sitemap from "all articles from this week" rather than a strict rolling 48-hour filter — a common off-by-several-days bug in naive "last N days" sitemap generators.

---

## 9. Top Stories eligibility is a content-policy gate, not a markup or format gate

**Rule:** Gate Top Stories eligibility engineering effort on Google News content policy compliance and general Search Essentials — not on any specific structured data, AMP, or page-experience threshold.

**Mechanism:** Google's spam policies doc: continued attempts to bypass content/spam policies can lead Google to "restrict[] or remov[e] eligibility for some search features like Top Stories and Discover." Separately (per §11's page-experience change), page experience became a *ranking* input within Top Stories, explicitly **not** a hard eligibility gate: any page can appear in Top Stories regardless of its page-experience score; page experience only affects ordering among already-eligible content.

**Acceptance criterion:** A page that (a) is indexed, (b) does not violate Google News content policies (§9→ see the dedicated policy list below), and (c) does not violate Google Search's general spam policies is eligible to be considered for Top Stories — full stop, independent of markup, AMP status, or Core Web Vitals score.

**Verification method:** For a Top Stories absence investigation, check content policy compliance and Search Console manual actions/spam reports first; treat Core Web Vitals and markup completeness as ranking-quality levers only, not gating checks.

**Source:** Google Search Central, "Spam Policies for Google Web Search," https://developers.google.com/search/docs/essentials/spam-policies. **Tier 1.**

**Anti-pattern:** Prioritizing AMP migration or perfect Core Web Vitals scores as a prerequisite "to get into Top Stories" — conflates a ranking signal with an eligibility gate.

---

## 10. AMP is not required for Top Stories — and has not been since June 2021

**Rule:** Do not implement or maintain AMP pages under the belief that AMP is required for Top Stories eligibility. It is not, and has not been for over four years.

**Mechanism:** Google's page-experience update blog post states directly: **"This means that using the AMP format is no longer required and that any page, irrespective of its Core Web Vitals score or page experience status, will be eligible to appear in the Top Stories carousel."** The rollout began in June 2021 (announced/detailed across the 2020-05, 2020-11, and 2021-04 Search Central blog posts on the page experience update); from that point, non-AMP pages became fully eligible for the Top Stories carousel on mobile, and the AMP badge/icon was removed from search results entirely.

**Acceptance criterion (flag — not a "changed in the last 24 months" item, but a widely-repeated stale claim):** This is a >4-year-old deprecation, but a large volume of current (2026) SEO trade content still states or implies AMP is required for Top Stories — that claim is false and should be explicitly corrected in any SOP module, not merely omitted.

**Verification method:** Confirm a non-AMP article URL from any compliant news site appears in the Top Stories carousel (visually inspect a live mobile SERP for a current news query); absence of the AMP lightning-bolt badge in current SERPs corroborates that the feature itself was removed.

**Source:** Google Search Central Blog, "More time, tools, and details on the page experience update," https://developers.google.com/search/blog/2021/04/more-details-page-experience. **Tier 1.** (Corroborating timeline detail from Search Engine Land reporting on the same announcement — **Tier 4**, used only to triangulate the rollout date, not as the load-bearing citation for the rule itself.)

**Anti-pattern:** Any 2026-dated blog post, vendor pitch, or internal SOP draft that lists "implement AMP" as a Top Stories prerequisite — this is the single most out-of-date claim in mainstream news-SEO advice and should be actively corrected wherever it surfaces.

---

## 11. Google News content policies — transparency, bylines, and consequences

**Rule:** Every news-classified page must carry clear publication dates, bylines/author information, publisher/company identity, and contact information; sponsorship or paid promotion must be clearly disclosed and must not exceed the surrounding content in prominence.

**Mechanism:** Google's stated transparency requirement: "News sources must provide clear dates, bylines, author information, publication details, company/network information, and contact information." Ads-specific: "Advertising and other paid promotional material on your pages shouldn't exceed your content," and sponsorships must be clearly disclosed. Consequence framing is explicit: **"When we find content or behavior that violates these policies, we may remove the content from our news surfaces,"** and "In cases of repeated or egregious violations, a site may be no longer eligible to appear on our news surfaces" — i.e., site-wide delisting from news surfaces is a documented, real consequence, not a rhetorical warning.

**Acceptance criterion:** Every article page has a visible byline, a visible publish date/time, a link to (or embedded) contact/masthead information, and — where sponsored — an explicit "Sponsored"/"Paid Content" label rendered at least as prominently as the surrounding editorial content.

**Verification method:** Manual template audit of one article per content type (staff-written, guest/sponsored, wire-syndicated) confirming byline + date + contact-info presence; grep the CMS template for a sponsorship-disclosure component and confirm it renders whenever a `sponsored` flag is true.

**Source:** Google News Publisher Center Help, "Google News policies," https://support.google.com/news/publisher-center/answer/6204050. **Tier 1.**

**Anti-pattern:** A wire-syndicated article rendered with no byline and no indication of the original source/agency — violates the transparency requirement even if the underlying content itself is accurate.

---

## 12. AI-generated news content: no Google-mandated disclosure — only the general spam-policy backstop applies

**Rule:** Do not build a Google-News-specific "AI disclosure" compliance feature under the assumption Google requires it for news content — it does not, as of 2026. Instead, gate AI-assisted content production against Google's general scaled-content-abuse spam policy.

**Mechanism:** Google's generative-AI content guidance states plainly that disclosure is **not required** for AI-assisted content in Search generally: "Sharing information about how a piece of content was created can help give your readers more context" (framed as optional good practice, not a requirement). The binding constraint instead is the spam policy: **"using generative AI tools or other similar tools to generate many pages without adding value for users may violate Google's spam policy on scaled content abuse."** The evaluative standard is outcome-based — "accuracy, quality, and relevance" — not tool-based; nothing in Google's News-specific content policies (§11's source page) imposes an AI-labeling mandate either.

**Acceptance criterion:** No content-management feature should hard-block publishing on "missing AI disclosure" as a Google-compliance requirement; separately, any AI-assisted article production pipeline should be auditable for whether each output adds unique value (the actual, enforceable standard) rather than being templated boilerplate at scale.

**Verification method:** Re-check `https://developers.google.com/search/docs/fundamentals/using-gen-ai-content` at implementation time for policy drift (this is one of the fastest-moving policy areas at Google); if a hard disclosure mandate is later introduced, treat that as a breaking change to this section, not an extension of it.

**Source:** Google Search Central, "Google Search's Guidance on Generative AI Content on Your Website," https://developers.google.com/search/docs/fundamentals/using-gen-ai-content (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Practitioner claims that "Google News requires publishers to label AI-generated articles" — this is **not supported** by the current Tier 1 source and should be labeled `Convention — not vendor-confirmed` (in fact, contradicted) if encountered in the wild; do not implement a mandatory-disclosure gate on that basis alone.

---

## 13. Paywalled content: `isAccessibleForFree` + `hasPart` avoids the cloaking violation

**Rule:** Any article gated behind a paywall or mandatory registration must declare `isAccessibleForFree: false` at the article level and wrap the specific gated HTML section in a `hasPart` / `WebPageElement` node with its own `isAccessibleForFree: false` and a `.class`-selector `cssSelector` pointing at that section.

**Mechanism:** This markup exists specifically so Google can distinguish a legitimate paywall from cloaking (serving Googlebot different content than users see) — a serious spam violation absent this signal. The required shape: `hasPart` is `@type: "WebPageElement"`, carries its own `isAccessibleForFree: false`, and a `cssSelector` that must be a `.class` selector — "Only use `.class` selectors for the `cssSelector` property" — with the explicit constraint "Don't nest content sections." Multiple gated sections use an array of `hasPart` objects. Supported base types include `Article`, `NewsArticle`, `Blog`, `Course`, `HowTo`, `Review`, `WebPage`.

**Acceptance criterion:** The rendered JSON-LD contains `isAccessibleForFree: false` at the root and at least one `hasPart` entry whose `cssSelector` resolves (via `document.querySelectorAll`) to exactly the DOM node(s) that are actually hidden/truncated behind the paywall for a logged-out user — no more, no less.

**Verification method:** Rich Results Test on the live URL; manually diff the DOM served to an unauthenticated fetch vs. what `cssSelector` targets, confirming the selector's matched elements correspond 1:1 to the actually-gated content (a mismatch here is the exact failure mode Google is trying to detect as potential cloaking).

**Source:** Google Search Central, "Subscription and Paywalled Content Markup," https://developers.google.com/search/docs/appearance/structured-data/paywalled-content (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Marking `isAccessibleForFree: false` but pointing `cssSelector` at a class that doesn't actually correspond to the gated DOM region (e.g., a stale selector left over from a template redesign) — this reintroduces the exact cloaking ambiguity the markup exists to resolve.

---

## 14. Content licensing signals: `license` + `acquireLicensePage`, and the separate Licensable Images feature

**Rule:** For image content specifically, supply license information via either Schema.org's `license` + `acquireLicensePage` properties in structured data, or equivalent IPTC photo metadata embedded in the image file itself — not both inconsistently.

**Mechanism:** Google's Image License Metadata doc: only one of the two methods is required for eligibility for the "Licensable" badge in Google Images — "Structured data" (an association between the image and the page, must be added per page/instance) or "IPTC photo metadata" (embedded in the image file itself, travels with the file across pages). **"In instances where both structured data and IPTC photo metadata are present and they conflict, Google will use the structured data information."** Required fields: license information via the Schema.org `license` property or IPTC's Web Statement of Rights field, plus a page to acquire the license via Schema.org `acquireLicensePage` or IPTC's Licensor URL field.

**Acceptance criterion:** Every editorially-licensed image (e.g., wire-service photos, stock licensed for the piece) carries either a `license`/`acquireLicensePage` pair in the page's `ImageObject` structured data or equivalent embedded IPTC metadata — and if both are present, they agree (since structured data wins on conflict, a stale IPTC embed with correct structured data is silently safe, but the reverse is not).

**Verification method:** Rich Results Test for the structured-data path; `exiftool <image>` to inspect embedded IPTC `WebStatement`/`LicensorURL` fields for the file-metadata path; cross-check both are present for any image the CMS knows to be third-party-licensed rather than originated in-house.

**Source:** Google Search Central, "Google Images SEO: Image Metadata," https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata. **Tier 1.**

**Anti-pattern:** Embedding IPTC licensing metadata in the master image file but stripping it on upload/resize in the CMS's image pipeline (a common image-processing-library default) — leaves no license signal at all despite editorial intent.

---

## 15. E-E-A-T is what human quality raters use to score search results for measurement — not a ranking algorithm, and there is no "E-E-A-T score"

**Rule:** Never describe E-E-A-T work as "improving your E-E-A-T score" in any deliverable — no such score exists in any Google system. Frame every E-E-A-T-related recommendation as improving genuine trust signals (author transparency, accuracy, verifiable expertise), not as satisfying an algorithmic input.

**Mechanism — quoted directly from the September 11, 2025 Search Quality Rater "General Guidelines" (the Search Quality Rater Guidelines PDF, current as of 2026, "Copyright 2025"):** Section 0.1, "The Purpose of Search Quality Rating," states explicitly: **"No single rating can directly impact how a particular webpage, website, or result appears in Google Search, nor can it cause specific webpages, websites, or results to move up or down on the search results page. Using ratings to position results on the search results page would not be feasible, as humans could never individually rate each page on the open web. Instead, ratings are used to measure how effectively search engines are working to deliver helpful content to people around the world. Ratings are also used to improve search engines by providing examples of helpful and unhelpful results for different searches."** This is Google's own, direct statement that rater output is a *measurement and training-example* mechanism, not a live ranking input for any individual page. Section 3.4 defines E-E-A-T itself: **"Trust is the most important member of the E-E-A-T family"** — the guidelines depict E-E-A-T as three overlapping circles (Experience, Expertise, Authoritativeness) around a central Trust, explicitly stating raters should assess "the extent to which the content creator has the necessary first-hand or life experience for the topic" (Experience), "the necessary knowledge or skill for the topic" (Expertise), and "the extent to which the content creator or the website is known as a go-to source for the topic" (Authoritativeness) — all in service of assessing Trust, which the guidelines call "the most important member of the E-E-A-T family because untrustworthy pages have low E-E-A-T no matter how Experienced, Expert, or Authoritative they may seem." The guidelines tie the *required level* of E-E-A-T explicitly to YMYL ("Your Money or Your Life") assessment: pages on topics that could significantly impact "health, financial stability, or safety... or the welfare or well-being of society" face the highest scrutiny, while non-YMYL topics (e.g., entertainment) may need little Trust at all.

**What this does and does not mean mechanically:**
- **Does mean:** Google trains and periodically re-calibrates its live ranking systems using large-scale human rating data that is *informed by* E-E-A-T concepts, and it publishes the guidelines specifically so raters (and by extension, the industry) understand the quality bar Google is trying to have its automated systems approximate.
- **Does not mean:** any page has a stored, retrievable "E-E-A-T score"; any specific technical action (adding an author bio, adding a `sameAs` link) directly and immediately moves a ranking; or that quality raters' scores on your specific page have any direct effect on that page's position.

**Acceptance criterion:** Any SOP language, audit report, or client deliverable that says a page's "E-E-A-T score" was measured, computed, or improved is a documentation error and must be rewritten to describe the underlying signal (author credentials verified, factual accuracy checked, independent citations found) instead.

**Verification method:** Grep any produced audit/report content for the string "E-E-A-T score" (or "EEAT score") — zero hits is the passing state; where E-E-A-T is discussed, confirm the surrounding language cites specific, checkable signals (byline + bio present, independent reputation evidence found, factual accuracy spot-checked) rather than a numeric or letter-grade output.

**Source:** Google, "Search Quality Rater Guidelines" (General Guidelines), PDF, September 11, 2025 revision, https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf, §0.1 ("The Purpose of Search Quality Rating") and §3.4 ("Experience, Expertise, Authoritativeness, and Trust (E-E-A-T)"). **Tier 1** (the document itself; page/section references are to the live PDF fetched and read directly during this research).

**Anti-pattern (flag every occurrence — `Convention — not vendor-confirmed` when found in the wild):** Any content, tool, or vendor claiming to "calculate your E-E-A-T score," rank pages by "E-E-A-T strength" as an algorithmic metric, or promise a specific ranking lift from "E-E-A-T optimization" tactics — none of this is vendor-confirmed by Google, and the Tier 1 source directly contradicts the premise that individual ratings (let alone a derived "score") move rankings at all.

---

## 16. Corrections and retractions: schema.org defines the vocabulary, but Google documents no consuming rich-result feature

**Rule:** Publish `correctionsPolicy` (a `NewsMediaOrganization` property) and use `CorrectionComment` to mark specific corrected passages as a transparency/trust practice — but do not expect any Google-documented rich result, badge, or ranking effect from doing so; the value here is editorial/E-E-A-T-adjacent trust signaling, not a markup-triggered feature.

**Mechanism:** Schema.org defines `CorrectionComment` ("a comment that corrects `CreativeWork`") and `NewsMediaOrganization.correctionsPolicy` ("a statement describing... the newsroom's... disclosure and correction policy for errors") as vocabulary — these are real, valid, documented schema.org types/properties (Tier 1 at the vocabulary level). However, a direct check of Google's full structured-data feature gallery (`developers.google.com/search/docs/appearance/structured-data/search-gallery`) — enumerated in full during this research — confirms **neither "Corrections" nor "CorrectionComment" appears anywhere in Google's list of supported rich-result types.** Google's Fact Check (`ClaimReview`) markup docs do reference having "a corrections policy or... a mechanism for users to report errors" as part of the accountability standard expected of `ClaimReview` publishers, but this is a policy precondition for a *different* feature (fact-check labels), not a rich result for corrections markup itself.

**Acceptance criterion:** Treat `correctionsPolicy` and `CorrectionComment` implementation as a genuine, worthwhile trust/transparency practice (feeds directly into the Trust component of E-E-A-T per §15, and is exactly the kind of thing a human quality rater is instructed to look for) — but any deliverable must **not** promise a rich result, SERP feature, or measurable ranking lift specifically attributable to this markup, because no such Google-documented mechanism exists.

**Verification method:** Re-run the search-gallery enumeration at implementation time (`WebFetch` the gallery page, list every row) to confirm this absence hasn't changed; if Google ever adds a Corrections feature, this section becomes stale and must be rewritten, not just supplemented.

**Source (vocabulary):** Schema.org, "CorrectionComment," https://schema.org/CorrectionComment; Schema.org, "NewsMediaOrganization," https://schema.org/NewsMediaOrganization (`correctionsPolicy` property). **Tier 1** (schema.org itself).
**Source (absence of a Google feature):** Google Search Central, "Structured Data Markup that Google Search Supports," https://developers.google.com/search/docs/appearance/structured-data/search-gallery — full table enumerated directly, confirming no Corrections/CorrectionComment row. **Tier 1.**

**Anti-pattern:** Selling or scoping "corrections markup implementation" internally as if it unlocks a Google rich result — it doesn't; scope it honestly as an editorial-trust practice with schema.org-level (not Google-feature-level) backing.

---

## 17. Live-blog markup: schema.org `LiveBlogPosting` is real; a dedicated current Google Search Central feature page for it is not found

**Rule:** If building live-blog coverage, use schema.org's `LiveBlogPosting` (with `coverageStartTime`, `coverageEndTime`, and per-update `liveBlogUpdate` entries) as the vocabulary of record — but do not promise a specific Google "LIVE" badge or Top Stories carousel behavior as a documented, currently-supported Google feature, because no live Google Search Central page for it could be located during this research, and it does not appear in Google's current structured-data feature gallery.

**Mechanism:** Schema.org defines `LiveBlogPosting` precisely: "a `BlogPosting` intended to provide a rolling textual coverage of an ongoing event through continuous updates," sitting in the hierarchy `Thing > CreativeWork > Article > SocialMediaPosting > BlogPosting > LiveBlogPosting`, with `coverageStartTime` ("coverage may begin before the Event's start time"), `coverageEndTime` ("coverage may continue after the Event concludes"), and `liveBlogUpdate` (each update itself a `BlogPosting`). A direct request to Google's previously-known Live Blog structured-data documentation URL returned **HTTP 404**, and a full enumeration of Google's current structured-data feature gallery (25 entries checked directly) confirmed **neither "Live blog" nor "LiveBlogPosting" appears** as a supported feature as of this research date. Google's public documentation changelog (`developers.google.com/search/updates`) was checked for a removal/deprecation entry specific to Live Blog and none was found — meaning this is a documented absence in the *current* state, not a dated, citable deprecation event with its own announcement.

**Acceptance criterion:** Any claim that "LiveBlogPosting markup earns a red LIVE badge in Google Search" must be labeled `Convention — not vendor-confirmed` (Tier 4, widely repeated in SEO trade content) rather than presented as a documented Google feature, given the 404 and gallery-absence findings above. Continue to implement the schema.org vocabulary correctly (it is harmless, semantically accurate, and may feed general Article-level understanding), but scope expectations to "correct semantic markup," not "guaranteed SERP feature."

**Verification method:** Re-attempt the Google Search Central Live Blog URL and re-enumerate the search-gallery page at implementation time — if Google has since published or restored a dedicated feature, this section must be rewritten with the new citation, not merely appended to.

**Source (vocabulary):** Schema.org, "LiveBlogPosting," https://schema.org/LiveBlogPosting. **Tier 1** (schema.org itself).
**Source (absence of a current Google feature):** Direct 404 on the last-known Google Search Central Live Blog structured-data URL, and full enumeration of https://developers.google.com/search/docs/appearance/structured-data/search-gallery showing no Live Blog row, both performed directly during this research. **Tier 1** (primary verification, not secondhand).
**Corroborating (unconfirmed) practitioner claim:** Multiple current SEO vendor blog posts (e.g., storyhawk.io, tickaroo.com) assert LiveBlogPosting markup earns a Google "LIVE" badge — cited here only to name and flag the claim as `Convention — not vendor-confirmed`. **Tier 4.**

**Anti-pattern:** Scoping an SOP deliverable around "implement LiveBlogPosting to get the LIVE badge" as if this were a guaranteed, Google-documented mechanical outcome — the primary-source check performed here could not confirm the feature currently exists in Google's documented product surface at all.

---

## Summary of flagged claims (per the framing brief)

| Claim | Status found | Disposition |
|---|---|---|
| "AMP is required for Top Stories" | **False since June 2021** (Tier 1, §10) | Actively correct wherever encountered — still common in 2026 trade content. |
| "Google News requires AI-content disclosure/labeling" | **Not supported** — Google's own gen-AI guidance frames disclosure as optional, not required (Tier 1, §12) | Label `Convention — not vendor-confirmed` if encountered; do not implement as a hard compliance gate. |
| "E-E-A-T is a ranking factor with a measurable score" | **Directly contradicted** by the Search Quality Rater Guidelines' own purpose statement (Tier 1, §15) | Never use "E-E-A-T score" language in any deliverable. |
| "CorrectionComment/corrections markup triggers a Google rich result" | **No supporting Google feature found** (Tier 1 absence check, §16) | Scope as editorial-trust practice only. |
| "LiveBlogPosting markup earns a Google LIVE badge" | **No current supporting Google feature found** — documentation URL 404s, absent from feature gallery (Tier 1 absence check, §17) | Label `Convention — not vendor-confirmed`; implement vocabulary without promising the badge. |
