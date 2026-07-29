# Adversarial Verification Log — SEO SOP Rule Base

Consolidates eleven independent adversarial verification passes, each attempting to **refute** the rules in one research file under `docs/seo/evidence/sources/`. Source reports: `.superpowers/sdd/verify-{crawl,architecture,metadata,schema,geo,performance,rendering,migrations,measurement,governance,semantics}.md`.

This document does not adjudicate disagreements between a verifier and the original research — it records the verifier's verdict, in the verifier's own terms. The authoring phase resolves them.

---

## Corrections required before authoring

Every `refuted`, `needs-correction`, `contested`, `scope-creep`, and `mislabelled-tier` verdict across all eleven domains, flat and numbered. Work through this list before any rule ships.

1. **Crawl — Item 9, "robots.txt `noindex` deprecated 2019-09-01" (needs-correction, sourcing not substance).** The doc's content is correct, but its sourcing claim is wrong: it says "the original Google blog post is no longer independently retrievable at a stable URL" and downgrades the item to Tier 4 via a Search Engine Land citation (which 403s to automated fetches). The primary Google post is in fact live and fetchable at `https://developers.google.com/search/blog/2019/07/a-note-on-unsupported-rules-in-robotstxt`, containing the exact quoted phrase ("retiring all code that handles unsupported and unpublished rules (such as noindex)... September 1, 2019"). **Fix:** re-tier as T1, cite that URL directly, drop the "no longer independently retrievable" caveat and the SEL secondary citation, and correct the file's tier breakdown from "2 Tier 4" to 21 T1 / 1 T2 / 1 T4 (item 14 only).

2. **Crawl — Item 21, "Soft 404 definition" (needs-correction, quote precision).** The mechanism is correct and well corroborated, but the exact string in quotation marks ("A soft 404 error occurs when a URL returns a page telling the user that the page does not exist and also a 200 (success) status code, or an empty/near-empty page") could not be located verbatim on the cited `http-network-errors` page — it reads as a paraphrase presented as a direct quote. **Fix:** re-source to the actual verbatim sentence ("If the content suggests an error for Google Search, an empty page or an error message, Search Console will show a soft 404 error") or mark the existing sentence as paraphrase, not quote.

3. **Architecture — Rule 9, `lastmod` semantics (needs-correction, fabricated quote).** The doc states Bing "attempt[s] to fetch sitemaps 'at least once a day except your lastmod tells them that your sitemaps didn't change,'" implying an accurate unchanged `lastmod` can suppress a refetch. The actual sentence on the cited Bing Webmaster Blog post (line 273) reads: *"Bing will attempt to fetch it immediately upon submission. After that, it will revisit your sitemap on a regular basis, typically at least once per day, to check for updates."* No clause anywhere on the page conditions the daily refetch on `lastmod`. Separately, the same source (line 244) already states *"Optional sitemap tags like changefreq and priority are ignored by Bing and do not influence how your content is crawled or ranked"* — the doc's own "unverified" flag on Bing's changefreq/priority stance should be updated to confirmed, since it cites this exact URL. **Corrected wording:** "Bing checks submitted sitemaps at least once per day (after an immediate fetch on submission); it uses `lastmod` to prioritize *which URLs* get recrawled/reindexed and may skip unchanged URLs, but the cited source does not say `lastmod` suppresses the sitemap-level refetch itself." Change the changefreq/priority flag from "unverified" to "confirmed: Bing also ignores both."

4. **Architecture — Contrarian claim D, Nielsen/NN Group "600 percent" click-depth figure (refuted, fabricated citation).** The doc's exact text attributes to `nngroup.com/articles/3-click-rule/`: *"users' ability to find products on an e-commerce site increased by 600 percent after the design was changed so that products were 4 clicks from the homepage instead of 3."* Direct fetch of that live URL (1601 lines of HTML) shows its only cited study is Joshua Porter's 2003 dropoff study; the strings "600 percent," "600%," and "four click(s)" do not appear anywhere on the page. A "600 percent" claim does circulate but traces (unverified) to a different work — Nielsen & Loranger, *Prioritizing Web Usability* (New Riders, 2006) — not this URL. **Corrected wording:** "Joshua Porter's 2003 study (620 tasks, 44 users) found no dropoff or satisfaction decrease past 3 clicks — direct evidence against a fixed click-depth ceiling. Source: NN/g, 'The 3-Click Rule for Navigation Is False.' A separate, frequently-repeated claim that Nielsen & Loranger's usability testing showed a 600% product-findability improvement moving from 3 to 4 clicks is attributed in secondary sources to their book *Prioritizing Web Usability* (2006) — this could not be independently verified against a primary source in this pass and should be flagged Tier 4 (unverified secondary attribution) rather than cited as coming from the NN/g web article."

5. **Metadata — Requirement 3, title/description length (needs-correction, fabricated figures).** The file claims the Sistrix meta-description page states "desktop ~990px/165 chars." Direct fetch of that exact page shows it contains only **580 pixels** and **150–155 characters** — the 990px/165-char figures appear nowhere on the page. **Fix:** delete "(desktop ~990px/165 chars, tightened recommendation ~580px/150-155 chars to avoid ellipsis)" and replace with just the verified 580px/150–155-char figures.

6. **Metadata — Requirement 8, Twitter/X Card markup (needs-correction, wrong URL).** The file's cited Tier 1 URL is `developer.x.com/en/docs/x-for-websites/cards/overview/markup`; the correct path (per the Next.js doc's own link) is `developer.x.com/en/docs/twitter-for-websites/cards/overview/markup` ("twitter-for-websites," not "x-for-websites"). Both return HTTP 402 in verification sessions, independently confirming the "fetch blocked" note is accurate regardless of path. **Fix:** correct the URL segment.

7. **Metadata — Flag 2 / Requirement 6, "Google's own guidance... multiple H1s don't hurt rankings" (needs-correction, uncited claim).** The file asserts this is "secondary-sourced below," but Requirement 6's Sources list only the WHATWG spec and the GitHub commit — neither is a Google statement. The underlying claim is independently true (John Mueller, on record: *"Our systems don't have a problem when it comes to multiple h1 headings on a page... You can use H1 tags as often as you want on a page. There's no limit, neither upper or lower bound"*), but as written the file promises a citation that doesn't exist. **Fix:** add the Mueller citation (Tier 4/practitioner-reported public statement) or delete "secondary-sourced below."

8. **Schema — §3, `@graph`/`@id` linking (needs-correction, methodological overstatement).** The footnote claims the W3C JSON-LD 1.1 spec URL (`https://www.w3.org/TR/json-ld11/#node-identifiers`) "returns 403 to automated checks." This did not reproduce — a direct WebFetch retrieved it cleanly; only `curl`-style fetches are blocked from that host. **Corrected wording:** replace "(returns 403 to automated checks; verified manually 2026-07-29)" with "(blocked for `curl`-style fetches in this team's tooling; retrievable via a standard browser/WebFetch client — not a general access restriction)."

9. **Schema — §9, `FAQPage` deprecation timeline (needs-correction, two real factual errors).** (a) The claimed **2025-06-12** "deprecation banner added to the FAQPage documentation" is contradicted — that changelog batch covered a different, unrelated set of features (Book actions, Course info, Estimated salary, ClaimReview, Learning video, Special announcement, Vehicle listing); FAQPage was not part of it. The doc conflated FAQPage's timeline with the unrelated retirement wave in its own §11. (b) The claimed **2026-06-15** "documentation removed entirely" is contradicted in detail: the FAQPage doc URL does not 404/vanish — it **301-redirects** to `https://developers.google.com/search/updates#removing-faq-rich-result`. **Fix:** strike the 2025-06-12 bullet from §9's timeline (it belongs only to §11); change "documentation page removed entirely" to "documentation page retired; the URL now 301-redirects to the Search Central changelog's FAQ-removal entry (`#removing-faq-rich-result`)." The other three FAQPage dates (2023-09-14, 2026-05-07, 2026-05-08) and the top-line rule are correct as stated.

10. **Schema — §11, other retired structured-data features (needs-correction, wrong removal date).** The claim that Search Console rich-result reporting / Rich Results Test / Search-appearance filter support was removed "starting **2026-01**" is wrong for the original 7-item batch (Book actions, Course info, Estimated salary, ClaimReview, Learning video, Special announcement, Vehicle listing) — independent sources place the actual support-removal at **2025-09-08/09**, roughly four months earlier. 2026-01 is correct only for **Practice problem** (the later, 2025-11-05-banner item). **Corrected wording:** "support removed from Search Console rich-result reporting, the Rich Results Test, and Search-appearance filters starting **2025-09** (Practice problem, added later, follows on its own **2026-01** removal schedule)." *(Caveat, not a doc correction: lower-tier sources suggest "Book actions" may have been un-deprecated in November 2025 — no Tier 1/2 source confirms this; re-check before treating it as universally dead.)*

11. **Schema — §12, `Product` review-snippet guidance (needs-correction, quote fidelity defect).** The doc renders Google's guidance as addressing "fake **and** undisclosed incentivized reviews." The actual Google wording uses **"or,"** not "and" — the guidance targets reviews that are fake *or* undisclosed-as-incentivized, two independent problems. "And" narrows the rule to only the intersection and could cause under-flagging of a review that is undisclosed-but-real, or fake-but-disclosed. **Fix:** replace "fake and undisclosed incentivized reviews" with "fake **or** undisclosed incentivized reviews."

12. **Geo — §1.9, Meta AI crawlers (needs-correction — the most significant finding in this domain; a claim proven false, not merely unsourced).** The file states Meta's documentation "does not describe a separate retrieval/citation-indexing bot analogous to `OAI-SearchBot`/`Claude-SearchBot`/`PerplexityBot`" and its anti-pattern line warns against inventing a rule for a nonexistent "Meta-SearchBot" token. **This is false as of the live page.** `developers.facebook.com/docs/sharing/webmasters/web-crawlers/` documents a third, distinct bot: **`Meta-WebIndexer`** — *"The Meta-WebIndexer crawler navigates the web to improve Meta AI search result quality for users. In doing so, Meta analyzes online content to enhance the relevance and accuracy of Meta AI. Allowing Meta-WebIndexer in your robots.txt file helps us cite and link to your content in Meta AI's responses."* No stated bypass-robots.txt exception is noted for it (unlike `Meta-ExternalFetcher`), implying standard compliance. **Fix:** add a table row — `Meta-WebIndexer` | "navigates the web to improve Meta AI search result quality... helps us cite and link to your content in Meta AI's responses" | Honored (no bypass exception stated) — and delete the anti-pattern paragraph entirely, since it instructs the reader not to do the exact thing that is now the correct, documented action.

13. **Geo — §5, Google AI Overviews eligibility (needs-correction by addition — omits a true, currently-live Tier 1 rule).** The file's "no special markup/schema/AI text files" claim is correct, but it never states that Google extended `nosnippet`/`max-snippet` to govern AI Overviews/AI Mode content reuse (~March 2025, reaffirmed as of the cited page's 2026-03-24 last-updated stamp). **Fix — add a bullet:** "Google's robots meta tag documentation (`developers.google.com/search/docs/crawling-indexing/robots-meta-tag`, Tier 1) states `nosnippet` and `max-snippet` explicitly govern AI Overviews/AI Mode content reuse, not just classic snippets: `nosnippet` 'will also prevent the content from being used as a direct input for AI Overviews and AI Mode,' and `max-snippet` 'will also limit how much of the content may be used as a direct input.' This is distinct from the eligibility gate above — it governs *how much* of an eligible page's content AI features may reuse, not *whether* the page is eligible." Add this URL to the primary source list.

14. **Performance — §0.2, ranking-claim quote block (needs-correction, misquote).** "Our core ranking systems look to reward content that provides a good page experience" should read **"Google's core ranking systems..."** — the SOP substituted "Our" for "Google's" from `developers.google.com/search/docs/appearance/page-experience`.

15. **Performance — §8, ranking-claim quote block (needs-correction, fabricated splice — same underlying defect as #14, listed separately per the verifier's own tally).** "Great page experience... doesn't guarantee that your pages will rank at the top of Google Search results" is not a real sentence on the source page. The actual sentence is: *"Keep in mind that getting good results in reports like Search Console's Core Web Vitals report or third-party tools doesn't guarantee that your pages will rank at the top of Google Search results; there's more to great page experience than Core Web Vitals scores alone."* The real subject is "getting good [CWV] report scores," not "great page experience" itself — a narrower, more defensible claim. **Corrected blockquote (drop-in replacement for both §0.2 and §8):**
   > "Google's core ranking systems look to reward content that provides a good page experience. ... Core Web Vitals are used by our ranking systems. ... Keep in mind that getting good results in reports like Search Console's Core Web Vitals report or third-party tools doesn't guarantee that your pages will rank at the top of Google Search results; there's more to great page experience than Core Web Vitals scores alone. ... Google Search always seeks to show the most relevant content, even if the page experience is sub-par. But for many queries, there is lots of helpful content available. Having a great page experience can contribute to success in Search, in such cases. ... Beyond Core Web Vitals, other page experience aspects don't directly help your website rank higher in search results."
   > — Understanding Google Page Experience

16. **Rendering — Item 11, 404 status-code definition (needs-correction, RFC 9110 misquote).** Doc quotes: *"The server cannot find a current representation for the target resource or is unwilling to disclose that one exists."* Direct `curl` of RFC 9110 §15.5.5 shows the actual current text: *"The 404 (Not Found) status code indicates that the origin server did not find a current representation for the target resource or is not willing to disclose that one exists."* **Fix:** replace with the exact RFC sentence. (Underlying rule — 404 removes previously-indexed URLs, doesn't process brand-new ones — remains correct.)

17. **Rendering — Item 12, 410 status-code definition (needs-correction, RFC 9110 misquote, more severe than #16).** Doc quotes: *"The origin server knows that the target resource is no longer available at any location and that this condition is likely to be permanent."* This text does not appear anywhere in current RFC 9110 — it reads like a conflation with an older/different HTTP spec draft. Actual RFC 9110 §15.5.11: *"The 410 (Gone) status code indicates that access to the target resource is no longer available at the origin server and that this condition is likely to be permanent."* **Fix:** replace with the exact RFC sentence.

18. **Rendering — Item 15, `Retry-After` header (needs-correction, paraphrase presented as quote).** Doc quote: *"Indicates how long the user agent ought to wait before making a follow-up request. It can contain either an HTTP-date or a delay in seconds."* Actual RFC 9110 §10.2.3: *"Servers send the 'Retry-After' header field to indicate how long the user agent ought to wait before making a follow-up request... The Retry-After field value can be either an HTTP-date or a number of seconds to delay after receiving the response."* Meaning is preserved but the text is not the literal sentence. **Fix:** replace with the exact RFC sentence.

19. **Migrations — Item 12, "404-instead-of-301 is P1, time-decaying, only-partially-recoverable" (needs-correction, three defects).** (a) The sentence *"Google rechecks the URLs on its next crawl and updates the status if the fix holds"* is presented as sourced to `support.google.com/webmasters/answer/2445990` but could not be located there in two independent fetches — an uncited paraphrase. (b) **Overreach:** *"A URL that has been fully dropped and de-prioritized needs a fresh discovery signal (an external link, a sitemap re-mention) to be recrawled at all before it can even see the new redirect"* is not supported — the documented mechanism is "gradually decreases," not "goes to zero without a fresh signal"; independent commentary suggests Google may continue recrawling dropped URLs periodically at reduced frequency, the opposite emphasis. (c) The precise **"'implement the redirects' is step 4 of 5"** figure is unverifiable/likely fabricated — two independent fetches of the site-move page produced two different step orderings/counts. **Corrected wording:** "Treat a previously-indexed URL 404ing instead of 301ing as a P1 defect. Google's own documentation confirms two real, compounding costs: the URL is dropped from the index once confirmed 404, and crawl frequency to it gradually decreases the longer it persists — and Search Console's own guidance warns that adding a redirect later can delay the next recrawl attempt, 'possibly for a very long time.' This is a genuine, documented reason not to let the defect sit. However, do not claim recrawling stops entirely or that a fresh external discovery signal is strictly required before the fix can be seen — Google's documentation says frequency decreases, not that it goes to zero, and the fix is recovered via Google's normal (if throttled) recrawl of a URL it already knows about. Avoid citing an unverified 'step 4 of 5' figure; cite only that Google's guide sequences redirect implementation before traffic monitoring."

20. **Migrations — Item 14, Bing Site Move (needs-correction, citation-quote mismatch + tier overstatement).** Neither quoted sentence ("does not replace the need for permanent redirection... using HTTP Status 301" nor the six-month resubmission restriction) could be located on the cited `blogs.bing.com/webmaster/december-2020/Website-Migration-with-Bing` in two independent fetches — the page resolves to an 8-step guest-blogger migration walkthrough with no verbatim match. The underlying facts are independently corroborated via web search and likely true, but the citation-to-quote pairing doesn't reproduce, and the source is a guest-contributor post, not first-party product documentation — weaker than an unqualified "T1" label implies. **Fix:** keep the substantive rule (301s still required; ~6-month resubmission cooldown) but cite Bing Webmaster Tools' own Site Move tool help/documentation directly if a more current, non-guest-authored source can be located, and downgrade the tier label to "T1/T4 mixed — official blog, guest-authored" pending that correction.

21. **Measurement — Item 2, Search Analytics API row caps (needs-correction, citation misattribution).** The 50,000-rows/day/site/search-type ceiling is real and correctly stated but is not present on either URL the rule cites — it lives at `support.google.com/webmasters/answer/12919192` ("Performance report data is limited to 50K rows of data per day per type... per property"), which is uncited. **Fix:** add that URL as the citation for the 50,000-row claim.

22. **Measurement — Item 4, provisional recent data window (needs-correction, wrong figure, contradicts its own cited source).** `support.google.com/webmasters/answer/17011364`, fetched directly, does **not** say 2–4 days. It says preliminary data is "usually today's data and sometimes yesterday's" and "may change in the next few hours." **Fix:** replace "2–4 days" with Google's own language — preliminary data is typically today's (sometimes yesterday's) and may change within hours, not days.

23. **Measurement — Item 9, GSC-clicks-vs-GA4-sessions reconciliation mechanism (needs-correction, unhedged practitioner reconstruction stated as fact).** The comparative timing mechanism ("GSC counts server-side before the page loads; GA4 counts only after JS fires `session_start`") is not stated by Google on any official page checked (GSC's click/impression definition page, GA4's session docs); the cited T4 source itself does not cite official documentation for the mechanism. The rule's footnote already hedges this as T4, but the Mechanism paragraph itself states it as flat fact with no inline hedge. **Fix:** add an inline hedge to the Mechanism paragraph — this is a practitioner reconstruction consistent with each product's independently-documented architecture, not a single Google-stated mechanism.

24. **Measurement — Item 10, GA4/GSC integration dimension list (needs-correction, quote not verbatim; substance correct).** Actual text (`support.google.com/analytics/answer/10737381`): *"Search Console metrics are only compatible with Search Console dimensions and the following Analytics dimensions: Landing page, Device, Country"* — not the rule's quoted "work exclusively with... plus three Analytics dimensions." **Fix:** replace the quoted text with the verbatim sentence.

25. **Measurement — Item 11, GA4 data thresholding trigger (needs-correction, unsupported clause).** The thresholding banner text and the "search query information... row may be withheld" trigger are verified verbatim, but the specific claim that thresholding is triggered "particularly when Google Signals is enabled and a blended/observed reporting identity is used" is not supported by the cited page — its only Google Signals mention concerns BigQuery export exclusion, unrelated to thresholding triggers. **Fix:** drop the Google-Signals/blended-identity clause or re-source it to GA4's Reporting Identity documentation.

26. **Measurement — Item 13, CrUX API vs BigQuery (contested — two distinct issues).** (a) The rule hedges the "second Tuesday of the following month" cadence as coming from "practitioner documentation," but `developer.chrome.com/docs/crux/bigquery` states this **verbatim itself**: "CrUX data on BigQuery is released on the second Tuesday of the following month" — under-crediting its own T1 source. (b) The "BigQuery is origin-resolution only, no URL-level rows" claim was **not found stated** on the cited page in two direct fetches — widely believed true, but not confirmed from the citation given. **Fix:** cite the second-Tuesday cadence directly to Google; either find a firmer citation for the origin-resolution-only claim (e.g., the BigQuery table/schema reference) or soften it to "documented informally/by convention."

27. **Measurement — Item 15, Bing URL Submission API quota (refuted as sourced).** Direct fetch of the cited 2021 Bing blog post states no 500-per-batch figure and no 10,000/day figure at all — it only points readers to Bing support for quota increases. The cited Microsoft Learn `GetUrlSubmissionQuota` page is a bare method signature whose only numbers are an unrelated sample response (`DailyQuota: 5, MonthlyQuota: 24`). The real sources for 500/batch and 10,000/day are two uncited 2019 Bing blog posts; the cited 2021 post now carries an "Updated June 2025" note redirecting readers to IndexNow instead. **Fix:** cite the two 2019 Bing posts explicitly (dated 2019, not 2021) and add a hedge that Bing's current live docs no longer state these figures and instead redirect to IndexNow.

28. **Measurement — Item 16, Page Experience report removal sourcing (needs-correction, sourcing characterization too pessimistic).** No Search Central blog post or Help Center changelog documents the removal (confirmed independently — same negative result the original researcher found). However, a genuine Google primary-source statement does exist: an official Google Search Central post **on LinkedIn** (not the blog), quoted verbatim and consistently across multiple independent outlets: *"We're removing the Page Experience report in Search Console... Core Web Vitals and the HTTPS reports... will continue to be available... to reduce unnecessary clutter."* **Fix:** reword the file's framing ("no standalone Tier 1 source... only third-party confirmation") to hedge on *channel* (LinkedIn, not blog/changelog), not on whether Google said it.

29. **Governance — Rule 4, JSON-LD structured-data validity tooling (needs-correction, invented tool distinction).** The doc cites the `sd-policies` page as the source for "Rich Results Test / Schema Markup Validator as the two distinct recommended tools" — that page does not mention "Schema Markup Validator" anywhere; only the Rich Results Test (and, elsewhere, the URL Inspection Tool) is referenced. **Fix:** drop the Schema Markup Validator sentence or re-source it to schema.org's own validator at `validator.schema.org` (not the Google sd-policies page); re-point the "indexed-URL-only limitation" citation primarily at the URL Inspection API reference page (confirmed: "you cannot test the indexability of a live URL") rather than leaning on the unconfirmed 2022 blog post.

30. **Governance — Rule 8, Lighthouse CI SEO category gate (mislabelled-tier).** The mechanical facts (assert config syntax, SEO audit list, quality disclaimer) all check out verbatim against live sources. The problem is the summary table's tier assignment: row 8 lists the primary tier as simply "T2 (Lighthouse CI + Chrome Developers, both Google-maintained)" with no Convention component — but Lighthouse's docs describe how to configure an assert step; they do not prescribe that a team must gate merges on it, or at what score. That governance decision is this project's own policy choice — exactly the class of claim the verification task flagged as a risk. Every other mixed rule in the file (§2, §3, §5, §9, §13) correctly splits its tier into a vendor-backed mechanical part and a Convention governance part; §8 is the one row that doesn't, despite identical structure. **Fix:** change the summary-table row 8 to "T2 (tool mechanics + disclaimer); Convention (the decision to gate PRs on this threshold at all)."

31. **Governance — Taxonomy, "whether structured data is truthful to the page content" (needs-correction, omits a real mechanical check).** Full semantic truthfulness (does the markup accurately represent what the page *means*) is correctly placed as human-only. But a narrower, real, commonly-implemented check is mechanical: **schema-to-source-field consistency** — asserting that JSON-LD field values (`price`, `datePublished`, `author.name`, `availability`, etc.) match the corresponding CMS/source-of-truth fields they claim to represent. This is a plain equality check, not a judgment call, and teams do gate CI on it. **Fix:** add this as a testable item ("JSON-LD field values match their corresponding CMS source fields") in the taxonomy, or explicitly carve it out as a partial/proxy check alongside the correctly-placed human-only full-truthfulness claim.

32. **Semantics — R3, WHATWG outline algorithm / "don't build tooling around it" (scope-creep).** Every factual sub-claim checks out (PR #7829 merge date, current flat-outline spec text), but R3 cites **only** WHATWG — no Google Search Central page, no AI-extraction source — tying this spec change to any search or LLM-citation consequence. Unlike R4, R8, and R9, which each explicitly flag "not a documented SEO-ranking claim" when their cited mechanism doesn't reach the module's own stated bar ("only properties with a documented search or AI-extraction consequence"), R3 has no such disclaimer — it implicitly rides on R2's SEO stakes without earning them. **Fix:** keep the content (it's true and useful) but either (a) move it to a general HTML/content-model conventions doc, or (b) add the same disclaimer style used in R4/R8: "No Google or AI-extraction source ties this spec change to a search consequence; it is included only because it corrects a false premise (nesting-based level inference) that could otherwise contaminate the R2 heading-count audit."

33. **Semantics — R14, YouTube caption/transcript search feature (refuted).** Fetched `support.google.com/youtube/answer/15930243` twice, independently; it describes only "In the video description, click Show transcript" and "Click any line of caption text to jump to that part of the video." It contains **no mention** of a search bar, in-transcript search, or word-highlighting. A follow-up web search for the specific claimed feature ("search bar above the transcript... highlight all instances of the word") did not surface it on any current `support.google.com/youtube` page. **Fix:** drop the specific "search bar / highlight" claim, or replace it with what the cited page actually supports — the transcript panel lets users "find a specific part" of a video and click a caption line to jump to it. If a genuine searchable-transcript feature exists on a different, correctly-cited YouTube Help page, re-verify and re-cite it before restoring the claim.

**Total: 33 corrections required before authoring.**

---

## Claims that survived a genuine refutation attempt

The SOP's most valuable assertions are the ones verifiers specifically tried to overturn and could not. Recorded here with the quoted evidence.

### `noindex` is invisible if the crawl is blocked (Crawl item 12 — "the flagship contrarian claim")
Directly fetched and confirmed verbatim from `developers.google.com/search/docs/crawling-indexing/robots-meta-tag`:
> "If a page is disallowed from crawling through the robots.txt file, then any information about indexing or serving rules will not be found and will therefore be ignored."

Verifier's conclusion: "This is the exact sentence the doc cites, and it does say what the doc claims — combining `Disallow` with page-level `noindex` on the same URL as your sole removal strategy is self-defeating because the crawl block prevents Google from ever reading the `noindex`. The contrarian claim survives verification intact."

### No Google-stated title/description length limit (Metadata, Flag 2)
Both cited Google pages were fetched directly and say exactly what the file claims, no more, no less:
- Title Links page: *"While there's no limit on how long a `<title>` element can be, the title link is truncated in Google Search results as needed, typically to fit the device width."*
- Snippets page: *"the snippet is truncated in Google Search results as needed, typically to fit the device width."*

No character count, pixel count, or fixed width appears anywhere on either page. Verifier: "No character count, pixel count, or fixed width appears anywhere on either page... The claim that '60/155' is a back-converted pixel approximation, not a Google-stated rule, survives verification."

### Multiple `<h1>` elements are permitted (Metadata Flag 2 / Semantics R2)
Verified verbatim against the live WHATWG spec: *"If a document has one or more headings, at least a single heading within the outline should have a heading level of 1"* — uses **"should," not "must."** The spec's own "Alphabetic Fruit" example uses three separate `<h1>` elements. Independently, Google's SEO Starter Guide confirms verbatim: *"Having your headings in semantic order is fantastic for screen readers, but from Google Search perspective, it doesn't matter if you're using them out of order,"* and *"There's also no magical, ideal amount of headings a given page should have."* Semantics verifier's verdict: "R2 — upheld, the claim survives in full... No overreach found."

### `llms.txt` is consumed by no Tier 1/2 vendor (Geo §2 — "the highest-priority claim to try to refute")
`llmstxt.org` itself lists only **generator tooling** (VitePress, Docusaurus, Mintlify, Drupal plugin, FastHTML, nbdev) that produces an `/llms.txt` for a site owner's own docs — nothing about any AI vendor's crawler/retrieval/training pipeline consuming third-party `/llms.txt` files. Anthropic and Perplexity publish their own `llms.txt` for their own docs sites (producer role, not consumer role). Verifier explicitly flags that several 2026-dated SEO/marketing blogs assert vendor "confirmation" of consumption with no traceable primary source — "unsupported Tier 4 assertions, exactly the kind of industry folklore this domain is full of. The original file's refusal to make this claim... is correct and is the more defensible position versus what's circulating in the wild." Conclusion: "the llms.txt negative claim survives the refutation attempt intact — no correction needed."

### No bulk index-coverage API (Measurement item 8 — "survived a genuine refutation attempt")
`developers.google.com/webmaster-tools/limits` confirms 2,000 QPD / 600 QPM per site for URL Inspection, exact. The current API reference index lists only the single-URL `index.inspect` method; Sitemaps/Sites resources are single-item only — no batch/bulk variant anywhere. The Indexing API was independently confirmed restricted to `JobPosting`/`BroadcastEvent` content and is a crawl-request mechanism, not a status-check mechanism. Verifier: "Actively attempted to refute... No bulk/batch indexing-status endpoint was found anywhere... The claim holds."

### Next.js streaming locks the HTTP status at 200; the fix must precede any Suspense flush (Rendering item 20 — "THIS IS THE CENTRAL CLAIM UNDER TEST")
Every sentence quoted in the research file is an exact, character-for-character match against the live `loading.js` doc:
> "When streaming, a 200 status code will be returned to signal that the request was successful. The server can still communicate errors or issues to the client within the streamed content itself, for example, when using `redirect` or `notFound`. Because the response headers have already been sent to the client, the status code of the response cannot be updated."
> "Some crawlers may label these responses as 'soft 404s'."
> "The response body starts streaming when a Suspense fallback renders (for example, a `loading.tsx`) or when a Server Component suspends under a Suspense boundary. Place `notFound()` before those boundaries and before any `await` that may suspend."

And from `not-found.js`: **"Next.js will return a 200 HTTP status code for streamed responses, and 404 for non-streamed responses."** Verifier: "No overreach found. If anything the doc under-cites... The reasoning that follows holds up on inspection, not just on the quote... A real fix built on this diagnosis is on solid ground."

### Additional contrarian claims verified with high confidence (bonus — not required minimums, but explicitly called out by verifiers as "no hedging needed")
- **`rel=next`/`rel=prev` is dead** (Architecture §7 / Metadata Flag 1): *"Google no longer uses these tags, although these links may still be used by other search engines"* — reconfirmed live and verbatim. Architecture verifier: "This contrarian claim is correct and should be presented with confidence, not hedged."
- **Sitemap `priority`/`changefreq` are ignored**: `build-sitemap` confirms verbatim, "Google ignores `<priority>` and `<changefreq>` values"; Bing's own blog independently states the same for Bing (previously marked "unverified" in the source doc — see correction #3 above).
- **Internal links don't pass a quantified "PageRank"/link-equity number the way practitioners assume**: `links-crawlable` never uses the word "PageRank" and describes discovery + anchor-text relevance only — confirmed as an accurate, appropriately-hedged synthesis, not an overclaim.
- **Structured data manual actions don't affect ranking** (Schema §16): *"A structured data manual action means that a page loses eligibility for appearance as a rich result; it doesn't affect how the page ranks in Google web search"* — confirmed verbatim.
- **Vercel's custom-domain-on-non-production-branch gap** (Crawl item 23): confirmed verbatim — *"If you are using a Custom Domain that is assigned to a non-Production Branch, however, the header `X-Robots-Tag: noindex` will not be set"* — the exact edge case the doc calls out as highest-risk.

---

## Per-domain verdicts

Each verifier's rule-by-rule results, preserved by domain. Full detail and quotes for any `needs-correction`/`refuted`/`contested`/`scope-creep`/`mislabelled-tier` item are in the numbered corrections list above (cross-referenced by number).

### Crawl (`.superpowers/sdd/verify-crawl.md`)
Method: fetched every cited primary source directly plus independent web searches for currency checks.

| # | Rule | Verdict |
|---|---|---|
| 1 | robots.txt controls crawling, not indexing | upheld (contrarian-adjacent) |
| 2 | Most-specific-path-wins, ties go to allow | upheld |
| 3 | User-agent groups merged when duplicated | upheld |
| 4 | Wildcard syntax limited to `*`/`$`, trailing `*` redundant | upheld |
| 5 | robots.txt location/encoding/media-type | upheld |
| 6 | 24-hour caching, longer if unreachable | upheld |
| 7 | 4xx = full allow, 5xx/unreachable = full disallow (12h/30-day window) | upheld |
| 8 | 500 KiB parsing limit | upheld |
| 9 | robots.txt `noindex` deprecated 2019-09-01 | **needs-correction** (#1) |
| 10 | Crawl-delay ignored by Google, honored by Bing | upheld (minor currency note — sole source is 17 years old) |
| 11 | Meta-robots / X-Robots-Tag equivalence, most-restrictive-wins | upheld |
| 12 | `noindex` invisible if crawl is blocked | **upheld — flagship contrarian claim** |
| 13 | X-Robots-Tag is not a formal standard | upheld |
| 14 | max-snippet/nosnippet now govern AI Overviews/AI Mode (March 2025) | upheld |
| 15 | Crawl budget formula + applicability threshold | upheld |
| 16 | Search Console URL Parameters tool dead (2022-04-26) | upheld |
| 17 | Faceted-navigation: robots.txt Disallow primary, canonical secondary | upheld |
| 18 | Google generally ignores URL fragments | upheld |
| 19 | rel=canonical is a hint, not a directive | upheld |
| 20 | Canonical anti-patterns | upheld |
| 21 | Soft 404 definition | **needs-correction** (#2) |
| 22 | 301 = strong signal, 302 = weak signal | upheld |
| 23 | Staging protection requires auth, not just robots.txt/noindex | upheld (contrarian-adjacent) |

Domain tally: **upheld 21 · needs-correction 2 · refuted 0 · contested 0** (verifier's own count).

### Architecture (`.superpowers/sdd/verify-architecture.md`)
Method: independent pass; primary sources re-fetched live (WebFetch + raw `curl`).

| # | Rule | Verdict |
|---|---|---|
| 1 | URL structure and naming | upheld |
| 2 | Trailing-slash and case consistency | upheld (RFC 3986 inference reasonable but not a direct quote) |
| 3 | Site depth and click distance | upheld |
| 4 | Internal linking and link equity flow | upheld (minor attribution looseness, not wrong) |
| 5 | Orphan pages | upheld |
| 6 | Breadcrumb structure | upheld |
| 7 | Pagination / rel=next-prev | upheld (contrarian claim confirmed) |
| 8 | XML sitemap protocol limits | upheld |
| 9 | `lastmod` semantics | **needs-correction** (#3) |
| 10 | HTML sitemaps | upheld |
| 11 | Faceted navigation | upheld, minor nuance (Google ranks robots.txt-disallow as preferred, not strictly equal to alternatives) |
| A | rel=next/prev is dead | upheld |
| B | Sitemap priority/changefreq are ignored | upheld |
| C | Internal links ≠ quantified PageRank | upheld |
| D | Nielsen/NN Group "600%" 3-vs-4-click figure | **refuted** (#4) |

Domain tally: **Upheld 9 · Needs-correction 1 · Refuted 1 · Contested 0.**

### Metadata (`.superpowers/sdd/verify-metadata.md`)
Method: fetched every reachable primary source directly; cross-checked fetch-blocked domains (`developer.x.com`, `moz.com`) via independent search corroboration.

| # | Rule | Verdict |
|---|---|---|
| — | Meta keywords tag dead | upheld |
| — | `rel="next"`/`rel="prev"` no longer used | upheld |
| — | Twitter/X Card Validator removed, no replacement | upheld (minor date fuzz: 2022 vs. some 2023 sources) |
| — | WHATWG outline algorithm removed July 1, 2022 | upheld |
| — | No Google-stated length limit (central contrarian claim) | **upheld, survived refutation** |
| — | Multiple H1s / outline spec (second-order myth) | **upheld, survived refutation**; but the "Google's own guidance... secondary-sourced below" line is **needs-correction** (#7) |
| 1 | Title element must exist and be unique | upheld |
| 2 | Google may rewrite the title link — six triggers | upheld |
| 3 | Length is pixel-width, not character-count | **needs-correction** (#5) |
| 4 | Meta description optional/secondary | upheld |
| 5 | Snippet control directives | upheld |
| 6 | Heading outline / H1 convention | upheld |
| 7 | Open Graph four required properties | upheld |
| 8 | Twitter/X Card markup | **needs-correction** (#6) |
| 9 | Image alt text | upheld |
| 10 | hreflang bidirectional + reserved codes | upheld |

Domain tally: **upheld 8 (requirements) · needs-correction 3 · refuted 0 · contested 0.**

### Schema (`.superpowers/sdd/verify-schema.md`)
Method: four parallel research passes; WebFetch returned hallucinated content for some `developers.google.com` pages in this pass — see Method Notes below.

| § | Rule | Verdict |
|---|---|---|
| 1 | JSON-LD is the recommended syntax | upheld |
| 2 | Schema.org vocabulary and versioning (30.0, 2026-03-19) | upheld |
| 3 | `@graph`/`@id` linking strategy | **needs-correction** (#8) |
| 4 | `Organization` | upheld |
| 5 | `WebSite` and retired Sitelinks Searchbox | upheld |
| 6 | `WebPage` | upheld |
| 7 | `BreadcrumbList` | upheld |
| 8 | `Article`/`NewsArticle`/`BlogPosting` | upheld |
| 9 | `FAQPage` — deprecated | **needs-correction** (#9) |
| 10 | `HowTo` — deprecated | upheld |
| 11 | Other retired structured data features | **needs-correction** (#10) |
| 12 | `Product` (Snippets vs. Merchant Listings) | **needs-correction** (#11) |
| 13 | `JobPosting` | upheld |
| 14 | General structured data policies / manual-action risk | upheld |
| 15 | Validation tooling | upheld (minor caveat) |
| 16 | The ranking-factor myth | upheld |

Domain tally: **Upheld 12 · Needs-correction 4 · Refuted 0 · Contested 0** (16 numbered sections total).

### Geo (`.superpowers/sdd/verify-geo.md`)
Method: fetched primary sources directly, independent of the original author.

| § | Rule | Verdict |
|---|---|---|
| 1.1 | Training/retrieval/user-triggered fetcher taxonomy (master claim) | upheld |
| 1.2 | OpenAI table | upheld |
| 1.3 | Anthropic table | upheld (minor wording-tightening recommended, not required) |
| 1.4 | Perplexity table | upheld |
| 1.5 | Google-Extended | upheld |
| 1.6 | Apple Applebot-Extended | upheld |
| 1.7 | Bytespider | upheld (third-party reports self-contradictory — hedge deserved) |
| 1.8 | Common Crawl / CCBot | upheld |
| 1.9 | Meta | **needs-correction — most significant finding of the review** (#12) |
| 1.10 | No vendor-documented GEO ranking algorithm | upheld |
| 2 | llms.txt consumed by no Tier 1/2 vendor | **upheld, and strengthened — survived refutation** |
| 3 | Content Signals | upheld |
| 4 | IETF aipref | upheld |
| 5 | Google AI Overviews eligibility | upheld but incomplete — **needs-correction by addition** (#13) |
| 6 | Bing Copilot | upheld (JS-rendered source, file's own caveat validated as necessary) |
| 7 | Passage-level citability | upheld |
| 8 | Entity/brand consistency (sameAs) | upheld |
| 9 | Measuring AI citation | upheld |

Domain tally: **Upheld 17 · Needs-correction 2 · Refuted 0 · Contested 0.**

### Performance (`.superpowers/sdd/verify-performance.md`)
Method: fetched every cited primary source live (web.dev, developers.google.com, developer.chrome.com, nextjs.org, MDN) plus web search corroboration.

| § | Rule | Verdict |
|---|---|---|
| 0.1 | Metric changes (INP replaces FID, Chrome 133 cross-origin LCP) | upheld |
| 0.1 | Search Console "Page experience" report removal + Tier 4 downgrade | upheld (downgrade was correct) |
| 0.2 | Ranking claim quote block | **needs-correction** (#14) |
| 1 | LCP thresholds | upheld |
| 1.1 | LCP sub-parts and target shares | upheld |
| 2 | INP thresholds and definition | upheld |
| 3 | CLS thresholds, formula, session windows | upheld |
| 4 | Font loading (CLS/LCP) + Next.js specifics | upheld |
| 5.1 | Modern image formats (WebP/AVIF) | upheld, correctly tiered |
| 5.2 | Responsive images (srcset/sizes) | upheld |
| 5.3 | fetchpriority/lazy-loading | upheld |
| 6 | Third-party script cost | upheld |
| 7 | Field vs. lab data, CrUX as record of truth | upheld (one sourcing caveat, not a refutation) |
| 8 | Page experience and ranking — full source position | **needs-correction** (#15, same underlying misquotes as §0.2) |

Domain tally: **Upheld 10 · Needs-correction 2 · Refuted 0 · Contested 0.** Every numeric threshold checked out exactly (LCP 2500/4000ms, INP 200/500ms, CLS 0.1/0.25, image-savings figures, third-party stall window).

### Rendering (`.superpowers/sdd/verify-rendering.md`)
Method: every cited URL re-fetched independently; the two IETF RFCs fetched via raw `curl` for character-by-character diffing.

| Item | Rule | Verdict |
|---|---|---|
| 1 | Three distinct crawl→render→index stages | upheld |
| 2 | No fixed render-queue delay | upheld |
| 3 | App-shell CSR risk | upheld |
| 4 | Dynamic rendering deprecated (Dec 2025 rewrite) | upheld |
| 5 | Bing still recommends dynamic rendering (cross-engine divergence) | upheld, doc's own age-caveat does the necessary work |
| 6 | 200 is not a guarantee of indexing | upheld |
| 7 | 301 is a strong canonical signal | upheld |
| 8 | 302 passes a weak signal, not nothing | upheld |
| 9 | Keep a redirect live ≥1 year | upheld, correctly labeled T4 |
| 10 | 304 semantics | upheld — verbatim, character-for-character |
| 11 | 404 removes previously-indexed URLs | **needs-correction** (#16) |
| 12 | 410 for deliberate removal | **needs-correction** (#17) |
| 13 | 429 signals overload, throttles crawl | upheld |
| 14 | Sustained 503/429 eventually drops indexed URLs, no fixed day-count | upheld |
| 15 | `Retry-After` | **needs-correction** (#18) |
| 16 | Soft 404 is content-based, not status-code-based | upheld |
| 17 | Soft 404s waste crawl budget | upheld, verbatim |
| 18 | Google names SPA-returns-200-for-errors as soft-404 mechanism | upheld |
| 19 | `dynamicParams` defaults to `true` | upheld, verbatim |
| 20 | Streaming locks status at 200; fix must precede Suspense flush | **upheld, verbatim — central claim under test, survived** |
| 21 | Auto-`noindex` mitigates indexing but not crawl-budget/analytics pollution | upheld, verbatim |
| 22 | ISR treats 404/410 as normal cacheable statuses | upheld, verbatim |
| 23 | stale-while-revalidate model | upheld |
| 24 | `stale-while-revalidate`/`stale-if-error` RFC 5861 | upheld, verbatim |
| 25 | `Vary` and cache-key correctness | upheld, verbatim |

Domain tally: **upheld 22 · needs-correction 3 · refuted 0 · contested 0.**

### Migrations (`.superpowers/sdd/verify-migrations.md`)
Method: independent re-fetch of every cited primary/secondary source against three lenses (correctness, currency, overreach).

| # | Rule | Verdict |
|---|---|---|
| 1 | Server-side 301/308 preferred over meta-refresh/JS | upheld |
| 2 | 302/307 only for genuinely temporary changes | upheld |
| 3 | RFC 9110 method/body-preservation contract | upheld |
| 4 | Avoid chaining redirects; 10-hop is not a budget | upheld |
| 5 | Redirect loops are P1 | upheld |
| 6 | Keep redirects ≥1 year | upheld |
| 7 | Never funnel unrelated URLs to the homepage | upheld |
| 8 | Return real 404/410 when there's no replacement | upheld |
| 9 | 404 vs 410 — marginal difference | upheld |
| 10 | No fixed "% of link juice lost" | upheld, myth-flag correctly framed |
| 11 | Ranking recovery in weeks-to-months | upheld |
| 12 | 404-instead-of-301 is P1, time-decaying, only-partially-recoverable | **needs-correction** (#19) |
| 13 | Change of Address tool — scope/prerequisites/180-day window | upheld |
| 14 | Bing Site Move — own 301s, 6-month resubmission lock | **needs-correction** (#20) |
| 15 | Next.js/Vercel permanent→308, temporary→307 | upheld |

Domain tally: **Upheld 13 · Needs-correction 2 · Refuted 0 · Contested 0** (15 numbered rules total). The urgency claim's load-bearing mechanism is real and Tier-1 verified; only its strongest formulation (fresh-discovery-signal-required) overstates the sources — see correction #19.

### Measurement (`.superpowers/sdd/verify-measurement.md`)
Method: refute by default; each rule's cited sources independently fetched, not trusted from the file's paraphrase.

| Item | Rule | Verdict |
|---|---|---|
| 1 | Domain vs URL-prefix properties | upheld |
| 2 | Search Analytics API row caps | **needs-correction** (#21) |
| 3 | Anonymized long-tail queries | upheld (lower-confidence — corroborated, not first-hand read) |
| 4 | Provisional recent data ("2–4 days") | **needs-correction** (#22) |
| 5 | 16-month retention | upheld |
| 6 | Position is a blended average, not a rank tracker | upheld |
| 7 | Page Indexing report 1,000-URL sample cap | upheld |
| 8 | No bulk index-coverage API; URL Inspection quotas | **upheld — survived a genuine refutation attempt** |
| 9 | GSC clicks vs GA4 sessions never reconcile (mechanism) | **needs-correction** (#23) |
| 10 | GA4/GSC integration dimension list | **needs-correction** (#24) |
| 11 | GA4 data thresholding withholds organic-search rows | **needs-correction** (#25) |
| 12 | CrUX popularity threshold and eligibility criteria | upheld |
| 13 | CrUX API vs BigQuery: resolution and lag | **contested** (#26) |
| 14 | IndexNow doesn't reach Google | upheld — strongest-sourced item in the file |
| 15 | Bing URL Submission API quota | **refuted as sourced** (#27) |
| 16 | Page Experience report removed ~Nov 18, 2024 | **needs-correction** (#28) |

Domain tally: **Upheld 8 · Needs-correction 6 · Contested 1 · Refuted 1.**

### Governance (`.superpowers/sdd/verify-governance.md`)
Method: fetched every cited primary source directly, checked quotes verbatim against live content, independent of the original researcher's write-up.

| # | Rule | Verdict |
|---|---|---|
| 1 | Canonical: present, self-referencing, exactly one per page | upheld |
| 2 | Title uniqueness across a route set | upheld |
| 3 | Sitemap-versus-route parity | upheld |
| 4 | JSON-LD structured-data validity | **needs-correction** (#29) |
| 5 | Robots directives correct per environment | upheld |
| 6 | Redirect-map integrity | upheld |
| 7 | No broken internal links | upheld |
| 8 | Lighthouse CI SEO category gate | **mislabelled-tier** (#30) |
| 9 | Pre-deploy versus post-deploy checks | upheld |
| 10 | Monitoring for drift after launch | upheld |
| 11 | The publishing checklist as the editor-facing gate | upheld |
| 12 | Ownership model | upheld |
| 13 | Preventing preview/staging indexing systemically | upheld |
| — | Taxonomy: "structured data truthfulness" cannot be asserted mechanically | **needs-correction** (#31) |

Domain tally: **11 upheld, 2 needs-correction (rule 4 + taxonomy), 1 mislabelled-tier (rule 8), 0 refuted, 0 contested.**

Additional finding (not a rule verdict, kept for record): the task brief's self-report that the researcher characterized the file as "5 rules resting on a real Tier 1/2 source, 2 mixed, and 6 labelled Convention" does not match the file's own summary table as written — the verifier counted 3 rows with no Convention component (§1, §4, §8), 4 rows explicitly mixing vendor tier with Convention (§2, §3, §5, §13), and 5 rows that are pure Convention (§6, §7, §9, §10, §12), with §11 and the Taxonomy row each their own hybrid category. This does not change any individual rule's verdict but the aggregate self-report to the task-giver does not match the document as written.

### Semantics (`.superpowers/sdd/verify-semantics.md`)
Method: fetched primary sources directly (WHATWG spec pages, the merged GitHub PR via `gh`, Google Search Central pages, W3C WAI pages, YouTube Help, and the two Tier-3 industry articles) rather than trusting the file's paraphrases.

| # | Rule | Verdict |
|---|---|---|
| R1 | One heading unambiguously most prominent (title-link generation) | upheld |
| R2 | Multiple `<h1>` permitted; not an HTML-validity or ranking rule | **upheld — claim survives in full** |
| R3 | Don't build tooling around the WHATWG "outline algorithm" | **scope-creep** (#32) |
| R4 | Landmark elements (`main`/`article`/`nav`) | upheld — label correct, no scope creep |
| R5 | `alt` text on content images | upheld |
| R6 | `alt` as anchor text for image-only links | upheld |
| R7 | Real `<a href>` elements with descriptive anchor text | upheld |
| R8 | Real `<table>`/`<th>`/`scope`/`headers` markup | upheld — label correct |
| R9 | `lang` attribute (not a language-detection signal) | upheld |
| R10 | Cloaking (no UA-conditional content divergence) | upheld |
| R11 | Structured data must match visible content | upheld |
| R12 | Accordion/tab-hidden content not devalued (mobile-first indexing) | upheld — Tier 3 label correct |
| R13 | ARIA is not an SEO/AI-extraction mechanism | upheld — Tier 3 label correct |
| R14 | YouTube caption/transcript search feature | **refuted** (#33) |

Domain tally: **upheld 12 · refuted 1 · scope-creep 1 · needs-correction 0 · contested 0.**

Additional finding (not a rule verdict, kept for record): the task brief's premise that "three rules rest on Tier 3 sources described as attributed Google-spokesperson statements reported by industry press" overcounts by one — only R12 and R13 have a Tier 3 rule as their load-bearing citation; R2 mentions a Tier 3 quote (Mueller's "completely normal") only as corroboration, with its real citations being Tier 1 (WHATWG + Google Starter Guide).

---

## Method notes and tool-reliability warnings

Carried forward from all eleven verifiers so future re-verification passes don't repeat the same failures.

- **WebFetch returned hallucinated/fabricated content for some `developers.google.com` pages.** Stated explicitly in the schema verifier's method note: *"WebFetch returned hallucinated/fabricated content for some `developers.google.com` pages in this pass. Reliable results were only obtained by fetching raw HTML (curl) and stripping tags manually. Anyone re-verifying this domain should not trust a single WebFetch call at face value — cross-check with a raw-HTML fetch when the page is load-bearing."** This is the single most important operational warning in the whole verification exercise and should gate how any future re-check of Google Search Central pages is performed.
- **Raw `curl` + manual tag-stripping was the reliable technique for exact-quote verification**, especially for RFC text (the rendering and architecture verifiers used direct `curl` of RFC 9110/9111/5861/3986 specifically so exact wording could be diffed character-by-character rather than trusting a re-summarization).
- **`curl` and WebFetch are blocked on different domains, inconsistently.** Examples encountered across the eleven passes:
  - `w3.org/TR/json-ld11` — blocked for `curl`-style fetches but retrievable via WebFetch/browser client (schema, correction #8). The original researcher's "403 to automated checks" note overstated a general restriction.
  - `developer.x.com` / `developer.twitter.com` — returns HTTP 402 to both curl and WebFetch in these sessions (metadata).
  - Search Engine Land (`searchengineland.com`) — 403s to both curl and WebFetch (crawl, architecture, migrations all hit this independently).
  - `developers.facebook.com/docs/sharing/webmasters/web-crawlers/` — 403'd to the original geo researcher's automated fetch tooling, but succeeded for the verifier on retry, revealing the missed `Meta-WebIndexer` bot (correction #12). Either the page changed or the original 403 masked content that was reachable by a different method — don't treat a single 403 as proof a page has no further content.
  - Glenn Gabe/GSQi blog — 403s to `curl` but succeeded via WebFetch (architecture/migrations).
  - `bing.com` Copilot's primary page is genuinely JS-rendered and returns only a page title, no body, to any automated fetch (geo §6) — this is a real client-rendering limitation, not a blocking issue, and the original file's downgrade to a manual-reverification caveat was judged correct and necessary.
- **JS-rendered/client-side pages return nav-shell-only content on direct fetch** — encountered on the 2022 Search Central blog post (measurement item 3) and the Google `http-network-errors` page (rendering item 6). In these cases corroboration via independent secondary retrieval or WebSearch was the only way to confirm wording; treat such "upheld" verdicts as lower-confidence than a direct character-for-character match.
- **The same page can return materially different content across independent fetches within the same verification pass.** The Google site-move guide produced two different step orderings/counts across two fetches during the migrations verification (correction #19) — do not treat a single fetch's structure/step-numbering as stable enough to cite an ordinal position ("step 4 of 5") without a second confirming fetch.
- **A 404 on a `developers.google.com` page can be a genuine, correctly-reported gap, not a research failure** — confirmed independently for the schema domain's `WebPage` structured-data doc (§6), which really does 404 live. Don't assume every "page not found" note in the source research is an artifact of bad tooling.
- **A 301 redirect is not the same as "removed entirely."** The schema verifier's correction to §9 (FAQPage documentation) is the clearest instance: the doc claimed the FAQPage documentation page was "removed entirely," but it in fact 301-redirects to a changelog anchor. When re-verifying "documentation removed" claims, check the HTTP response code and Location header, not just whether the expected content renders at the original URL.
- **Old or superseded blog posts can still be "live" without being current.** The Bing Crawl-delay source (crawl item 10) and the Bing dynamic-rendering recommendation (rendering item 5) are both real, live, unretracted Bing pages that are nonetheless years old (2009 and 2018 respectively) — verifiers correctly distinguished "this page is live and says X" from "this is current guidance," and the source doc's own age-hedging was validated as the right call in both cases.
- **Citations can be edited out from under a claim after the fact.** The 2021 Bing blog post cited for URL Submission API quotas (measurement item 15) now carries an "Updated June 2025" note that redirects readers to IndexNow instead of stating the original 500/batch and 10,000/day figures — a citation can go stale not by disappearing, but by having its content replaced while the URL stays the same.

---

## Tally

### Overall (176 verdicts across 11 domains)

| Verdict | Count |
|---|---|
| Upheld | 143 |
| Needs-correction | 27 |
| Refuted | 3 |
| Contested | 1 |
| Scope-creep | 1 |
| Mislabelled-tier | 1 |
| **Total** | **176** |

Corrections required before authoring (needs-correction + refuted + contested + scope-creep + mislabelled-tier) = **33**.

### Per domain

| Domain | Upheld | Needs-correction | Refuted | Contested | Scope-creep | Mislabelled-tier | Domain total |
|---|---|---|---|---|---|---|---|
| Crawl | 21 | 2 | 0 | 0 | 0 | 0 | 23 |
| Architecture | 9 | 1 | 1 | 0 | 0 | 0 | 11 |
| Metadata | 8 | 3 | 0 | 0 | 0 | 0 | 11 |
| Schema | 12 | 4 | 0 | 0 | 0 | 0 | 16 |
| Geo | 17 | 2 | 0 | 0 | 0 | 0 | 19 |
| Performance | 10 | 2 | 0 | 0 | 0 | 0 | 12 |
| Rendering | 22 | 3 | 0 | 0 | 0 | 0 | 25 |
| Migrations | 13 | 2 | 0 | 0 | 0 | 0 | 15 |
| Measurement | 8 | 6 | 1 | 1 | 0 | 0 | 16 |
| Governance | 11 | 2 | 0 | 0 | 0 | 1 | 14 |
| Semantics | 12 | 0 | 1 | 0 | 1 | 0 | 14 |
| **Total** | **143** | **27** | **3** | **1** | **1** | **1** | **176** |
