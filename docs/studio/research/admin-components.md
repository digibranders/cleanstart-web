# Admin component catalog (research, 2026-10-16)

**Row count:** 238 component files plus 2 app files, so 240 rows. The tree has 238 non-test .ts/.tsx files, not about 206; I skipped 9 test and stories files. The 45 SCSS partials are listed separately.

**10 most important findings**
1. Only the list view is custom: `CmsListView` on 45 collections. The edit view is Payload's stock one, because `wire-custom-edit-view.ts` is a no-op. That leaves `CmsEditView`, `EditChrome`, `PublishMenu` and `CmsVersionsView` dead.
2. 14 generic field adapters are stamped onto every field by `wire-custom-fields.ts`. `TextField` alone has 477 mounts. Six of them (Array, Blocks, Group, Collapsible, Row, Tabs) depend on Payload's `RenderFields`, so the Studio needs its own form engine.
3. Most sidebar SEO cards are `ui` fields that write to hidden `seo.*` fields through `useField({path})`. The Studio has to reproduce this cross-field form state.
4. 19 DOM-enhancer files rely on Payload ids and classnames such as `#action-save`, `.document-fields--has-sidebar`, `.nav-group`, `.field-error` and `[data-button-key]`. Their behaviour disappears with Payload's shell and must be rebuilt as real features.
5. `Embed/EmbedNode.ts` is imported by server code (`lib/lexical/embed-feature.ts`), and `embed-providers.ts` by `next.config.ts` for the CSP. Do not delete them with the admin.
6. Some code is dead or never mounted: 15 unreferenced files, plus `BytesCell`, `fields/UploadField`, `AnalyticsTab`, the BlockHandle pair, `AnalyticsCards` and their transitive dependencies (list at the end).
7. The rebuild needs server functions, not just REST: `Dashboard` calls the Local API, and `SchedulePublishDialog` uses `useServerFunctions().schedulePublish` plus `/api/payload-jobs`.
8. 33 of 34 `@payloadcms/ui` symbols are data-layer hooks or providers on the allow-list in `scripts/check-payload-ui-allowlist.ts`. `DocumentFields` is the exception and appears only in the dead `CmsEditView`.
9. All custom endpoints the Studio needs are listed per row, and all are reusable.
10. There are about 21.5k lines of SCSS, much of it aimed at Payload's own classnames.

---

# Payload admin custom UI catalog (apps/cms)

**Abbreviations used in the tables**
- **SEO22** = authors, blogs, case-studies, categories, departments, events, guides, industries, jobs, knowledgeBase, knowledgeCategories, legalDocuments, news, newsCategories, pages, podcastEpisodes, pressTypes, regions, resourceTypes, resources, webinarTypes, webinars. These collections get the SEO fields from `payload/fields/seo.ts`.
- **PUB13** = blogs, news, guides, case-studies, knowledgeBase, legalDocuments, resources, events, webinars, podcastEpisodes, jobs, pages, users. These get their edit config from `doc-status-bar-mount.ts` (`docStatusBarEditConfig`).
- **GATE9** = blogs, news, guides, knowledgeBase, resources, events, webinars, jobs, pages (`lib/wire-publish-gate.ts`).
- **PREV11** = GATE9 plus legalDocuments and podcastEpisodes (`lib/wire-preview.ts`).
- **ALL45** = every collection except `payload-*` (`lib/wire-custom-list-view.ts`).
- **Hook shorthands:**
  - uF = `useField`
  - uFF = `useFormFields`
  - uDI = `useDocumentInfo`
  - uC = `useConfig`
  - uA = `useAuth`
  - uFo = `useForm`
  - uAFF = `useAllFormFields`
- **Mount sources:** inventory.txt `C:{}` entries plus the import grep. Every "imported-by" was verified by grep, with commented-out references excluded.

## Root of admin/ and lib/
| path | kind | where mounted | what it does | APIs | DOM? | LOC |
|---|---|---|---|---|---|---|
| Icon.tsx | nav/shell | payload.config `admin.components.graphics.Icon` | Brand mark in the small icon slot (light and dark themes) | none | N | 37 |
| Logo.tsx | nav/shell | `graphics.Logo`; imported by SidebarHeader | Full wordmark on the login screen and sidebar | none | N | 69 |
| doc-status-bar-mount.ts | hook/util (config) | imported by 13 collection configs (Blogs, News, Guides, CaseStudies, KnowledgeBase, Legal, Resources, Events, Webinars, PodcastEpisodes, Jobs, Pages, Users) | Builds the edit slots: DocHeader, optional PurgePageButton, DocKebabExtras, CmsPublishButton | n/a | N | 62 |
| lib/column-widths.ts | hook/util | ColumnResizer | Saves per-editor list column widths in `users.preferences.columnWidths` | PATCH /api/users/:id | N | 93 |
| lib/quick-create-config.ts | hook/util | fields/RelationshipField | Lists which collections allow inline quick-create, and with which fields | type QuickCreateField (@cleanstart/ui) | N | 164 |
| lib/related-docs.ts | hook/util | RelationshipCell, fields/RelationshipField | Batched, de-duplicated id→title lookup that replaced N+1 requests | GET /api/:collection?where[id][in]&select | N | 234 |
| lib/saved-views.ts | hook/util | views/list/SavedViews | Saves per-editor list views in `users.preferences.savedViews` | PATCH /api/users/:id | N | 87 |
| lib/slug-status-store.ts | hook/util | SlugField (writer), SlugRequirementGuard (reader) | Module-level pub-sub holding slug validity | none | N | 59 |

## components/ (top-level files)
| path | kind | where mounted | what it does | APIs | DOM? | LOC |
|---|---|---|---|---|---|---|
| AuthorCredibilityField.tsx | field | authors.credibility | Shows the author's published-item count and last publish date | uDI; GET /api/:slug (byline collections) | N | 154 |
| BlockHandlePlugin.tsx | lexical-plugin | only via CleanstartBlockHandleFeatureClient (**unmounted**) | Drag grip for reordering blocks | closest(.handle) | N | 47 |
| BlogCtaAutoPick.tsx | field | blogs.ctaResourceAutoPick, blogs.ctaImageAutoPick | Suggests a CTA resource and image | uDI, uF; GET /api/blog-cta-suggestion | N | 139 |
| BodyAuditField.tsx | field | **DEAD** (no reference) | Audit of links, alt coverage and reading grade | uF | N | 138 |
| BooleanChipCell.tsx | cell | every checkbox field via wire-custom-fields CELL_OVERRIDES (about 170 mounts) | Green or neutral chip in place of true/false | none | N | 43 |
| BrokenLinkStatusField.tsx | field | brokenLinks.diagnosis | Readable HTTP status and how long the link has been broken | uFF | N | 48 |
| BrokenLinkUrlField.tsx | field | brokenLinks.url | Clickable broken URL plus where it resolves to | uFF | N | 38 |
| BytesCell.tsx | cell | wired by name for `filesize` in wire-custom-fields, but **never stamped**: missing from importMap and inventory | Human-readable file size | none | N | 33 |
| CanonicalField.tsx | field | SEO22.canonicalUrl | Canonical URL card with an off-domain override | uF(seo.useCustomCanonical, seo.canonicalOverride); GET /api/canonical/health-check | N | 230 |
| CleanstartBlockHandleFeatureClient.ts | lexical-plugin | lib/lexical/block-handle-feature.ts, which editor-config never uses (**unmounted**, not in importMap) | Would mount BlockHandlePlugin | createClientFeature | N | 18 |
| CleanstartLinkPopoverFeatureClient.ts | lexical-plugin | link-popover-feature.ts → editor-config.ts and faq-answer-editor.ts | Registers the cs-link toolbar item, LinkPopoverPlugin, StockToolbarSuppressorPlugin and ToolbarTipsPlugin | createClientFeature, toolbarFeatureButtonsGroupWithItems, $isLinkNode | N | 87 |
| CleanstartSlashMenuFeatureClient.ts | lexical-plugin | slash-menu-feature.ts → editor-config | Mounts SlashMenuPlugin | createClientFeature | N | 18 |
| CleanstartTablePopoverFeatureClient.ts | lexical-plugin | table-popover-feature.ts → editor-config | Registers the cs-table toolbar button and TableGridPickerPlugin | createClientFeature, toolbarFeatureButtonsGroupWithItems | N | 34 |
| CmsPublishButton.tsx | doc-chrome | `edit.PublishButton` on PUB13 | Split button: Publish, Schedule…, Unpublish; Cmd/Ctrl+Shift+S | uC, uDI, uFo, useFormModified, useLocale; formatAdminURL submit; PATCH or POST `_status: draft`; SchedulePublishDialog | N | 318 |
| CommandPalette.tsx | global-action | admin.components.actions | Cmd/Ctrl+K: navigate, create, search documents | GET /api/:slug?where (search) | N (own tree) | 700 |
| CopyPreviewLink.tsx (exports ShareLinkDialog) | doc-chrome (dialog) | imported by PreviewMenu | Creates a shareable preview link and copies it | uDI; POST /api/preview/token | N | 159 |
| DateCell.tsx | cell | every date field via CELL_OVERRIDES (about 90 mounts) | Relative or absolute date with an ISO tooltip | none | N | 95 |
| DisableUserAction.tsx | doc-chrome (kebab) | users `edit.editMenuItems` | Disables a user account | uDI, uA, uC; PATCH /api/users/:id | N | 84 |
| DisplayPublishedAtField.tsx | field | displayPublishedAt on blogs, guides, jobs, knowledgeBase, legalDocuments, pages, podcastEpisodes, resources, webinars (via fields/display-published-at.ts) | Display-date picker with future-date and scheduling UX | uDI, uF, uFF; DateTimePicker; SchedulePublishDialog | N | 184 |
| DocHeader.tsx | doc-chrome | `beforeDocumentControls` on PUB13 | Single dense strip: status badge, title, meta (word count, reading time) | uDI, uF(_status, updatedAt, publishedAt, wordCount, readingMinutes) | N (CSS hides native title) | 140 |
| DocKebabExtras.tsx | doc-chrome (kebab) | `edit.editMenuItems` on PUB13 | Versions link, API URL link, Discard changes | uC, uDI, uFo, useFormModified, hasAutosaveEnabled; GET /api/:slug/:id?draft=true | N | 138 |
| DocSidebarResizer.tsx | nav/shell | admin.components.afterNavLinks | Makes the edit-view right rail resizable and collapsible | MutationObserver; `.document-fields--has-sidebar`, `__sidebar-wrap` | **Y** | 292 |
| DsarActionsPanel.tsx | list chrome | leads `beforeListTable` | GDPR find-by-email and delete-by-email | uC; GET /api/leads/dsar/find, POST /api/leads/dsar/delete | N | 234 |
| EditorFullscreenToggle.tsx | global-action | admin.components.actions | Focus-mode button portalled onto the body Lexical wrap | `.rich-text-lexical__wrap`, `.field-type`, MutationObserver | **Y** | 211 |
| FaqBulkPaste.tsx | field | blogs, guides, knowledgeBase `.faqsBulkPaste`; FAQ block (blocks/FAQ.ts) | Pastes Q&A text into array rows | uF, uFo (addFieldRow); `.array-field__row`, MutationObserver | **Y** | 399 |
| FaqRowLabel.tsx | row-label | blogs, guides, knowledgeBase `.faqs`; FAQ block | Shows the question as the row label | useRowLabel | N | 63 |
| FieldDescriptionTooltip.tsx | global-action | admin.components.actions | Turns every field description into an "i" tooltip | `.field-type`, `.field-label`, MutationObserver | **Y** | 196 |
| FlaggedLeadsTab.tsx | list chrome | leads `beforeListTable` | Lists spam or honeypot leads with bulk delete | uC; GET /api/leads?where, DELETE /api/leads/:id | N | 232 |
| GateFormLabel.tsx | field (Label slot) | resources.gateForm | Adds a required asterisk when `gated` is checked | uFF | N | 49 |
| HeadTagsCard.tsx | field | SEO22.headTags | Quick-add head tags, hreflang, extra meta | uF(seo.alternates …) | N | 264 |
| HiddenField.tsx | field | blogs, guides, knowledgeBase `.tableOfContents.level` and `.text` | Renders nothing but keeps the value in form state for TocRowLabel | none | N | 15 |
| InboundRedirectsField.tsx | field | **DEAD** (only mentioned in a Notice.tsx comment) | Inline CRUD for redirects pointing at this page | uF; /api/redirects (GET, POST, PATCH, DELETE) | N | 620 |
| JourneyMirrorWarning.tsx | field | blogs.journeyMirrorWarning | Warns when the previous/next post does not link back | uF, uDI; GET /api/blogs/:id | N | 153 |
| KeywordTargetField.tsx | field | **DEAD** (replaced by KeywordsField) | Target keyword with density readout | uF | N | 196 |
| KeywordsField.tsx | field | SEO22.keywords | Primary-topic coverage plus supporting-keyword chips with suggestions | uF(seo.keywordTarget, seo.keywords, body, seo.title, seo.description); GET /api/topic-suggestions | N | 302 |
| LeadContactCell.tsx | cell | leads.contact | Email and name taken from the `fields` JSON | none | N | 70 |
| LeadSyncCell.tsx | cell | leads.syncedTo | Sync steps completed, with a breakdown on hover | none | N | 29 |
| LeadsCsvTruncationBanner.tsx | list chrome | leads `beforeListTable` | Warns when a CSV export was truncated | /api/leads/export-csv (header check); Notice | N | 78 |
| LeadsImmutableBanner.tsx | list chrome | leads `beforeListTable` | Explains that leads are append-only | LockedReason | N | 42 |
| LegacyBioViewer.tsx | field | authors.legacyBioViewer | Read-only legacy Webflow bio rich text | uF | N | 161 |
| LinkInternalSearch.tsx | lexical-plugin (sub-UI) | LinkPopover | Searches internal documents when creating a link | GET /api/:collection?where | N | 375 |
| LinkPopover.tsx (+ LinkPopover.scss, 251 lines) | lexical-plugin (sub-UI) | LinkPopoverPlugin | Popover for creating or editing a link | internal-routes; portal to body | N | 348 |
| LinkPopoverIcon.tsx | lexical-plugin (icon) | CleanstartLinkPopoverFeatureClient | Toolbar link icon | none | N | 19 |
| LinkPopoverPlugin.tsx | lexical-plugin | CleanstartLinkPopoverFeatureClient (floatingAnchorElem) | Link create/edit commands and the popover lifecycle | TOGGLE_LINK_COMMAND, $isLinkNode, useEditorConfigContext, uDI, uF; GET /api/:collection/:id | N | 715 |
| ListCellEnhancer.tsx | global-action | **DEAD** (removed from actions; comments only) | Rewrote list-cell text through the DOM | MutationObserver, `.cell-filesize` | **Y** | 117 |
| LockedReason.tsx | primitive | LeadsImmutableBanner | "Locked" chip with the reason | none | N | 52 |
| MediaBrowseDialog.tsx | primitive (picker) | MediaField, SocialCardField, InlineImageInsertDialog, fields/UploadField (dead) | Thumbnail grid for picking media | GET /api/media?where[filename][like] | N | 272 |
| MediaSelfChrome.tsx | field | media._chrome | Media edit-page header: thumbnail, rename, alt, replace, edit image | uDI, uF(alt); GET/PATCH /api/media/:id, POST /api/media/:id/rename; clicks Payload's `.file-field__edit` | **Y (partial)** | 455 |
| MediaSizeWarningField.tsx | field | media._sizeWarning | Warns about file size over 2 MB or images over 4000 px | uF | N | 97 |
| MentionRowLabel.tsx | row-label | integrations.teamsConfig.mentions | Shows the person's name and email on the row | useRowLabel | N | 46 |
| NavBadges.tsx | global-action | admin.components.actions | Adds draft-count badges to nav links and list titles | GET /api/:slug (counts); `.nav__link-label`, `.list-header h1`, MutationObserver | **Y** | 337 |
| NavGroupPersistence.tsx | global-action | admin.components.actions | Remembers which nav groups are collapsed (localStorage) | `.nav-group`, toggle `.click()`, MutationObserver | **Y** | 125 |
| NavOpenOnDesktop.tsx | nav/shell | admin.components.afterNavLinks | Opens or closes the sidebar automatically depending on the route | useNav | N | 141 |
| Notice.tsx | primitive | LeadsCsvTruncationBanner, InboundRedirectsField (dead) | Inline notice or banner | none | N | 136 |
| OutboundRedirectField.tsx | field | SEO22.redirect | Redirects this page elsewhere (inline CRUD on a single row) | uF; /api/redirects (GET, POST, PATCH, DELETE) | N | 495 |
| PartnersExportButton.tsx | list chrome | partner-applications `beforeListTable` | CSV export download | uC; GET /api/partner-applications/export-csv | N | 60 |
| PermalinkField.tsx | field | `.permalink` on authors, blogs, case-studies, events, guides, jobs, knowledgeBase, news, pages, podcastEpisodes, resources, webinars | Live public URL with copy and open | uF | N | 171 |
| PreviewMenu.tsx | doc-chrome | `beforeDocumentControls` on PREV11 | Preview split button: open, live-preview toggle, share link | uDI; /api/preview/redirect; clicks `#live-preview-toggler` | **Y (partial)** | 172 |
| PublishChecklistBanner.tsx | doc-chrome | `beforeDocumentControls` on GATE9 | Advisory publish checklist | uDI, uC; GET /api/:collection/:id/checklist | N | 140 |
| PublishOverrideGuard.tsx | doc-chrome | `beforeDocumentControls` on GATE9 | Confirms before publishing when the SEO title or description length is off | uAFF; capture-phase listener on `#action-save` | **Y** | 156 |
| ReassignContentAction.tsx | doc-chrome (kebab) | users `edit.editMenuItems` | Moves content from one author to another | uC; GET /api/authors, POST /api/users/reassign-content | N | 172 |
| RedirectStalenessField.tsx | field | redirects.staleness | Hot / active / cold / never-hit pill | uF | N | 109 |
| RelationshipCell.tsx | cell | every relationship field via CELL_OVERRIDES; explicit in Blogs, News, Guides (about 50 mounts) | Shows titles instead of ids | lib/related-docs | N | 160 |
| RichPasteFeatureClient.ts | lexical-plugin | rich-paste-feature.ts → editor-config | Mounts RichPastePlugin | createClientFeature | N | 21 |
| RichPastePlugin.tsx | lexical-plugin | RichPasteFeatureClient | Cleans Word / Google Docs / Webflow paste and uploads its images | uDI, $createUploadNode, INSERT_BLOCK_COMMAND; POST /api/media-ingest-url; paste listener on document | N | 452 |
| SaveShortcut.tsx | global-action | admin.components.actions | Cmd/Ctrl+S clicks Save or Publish | `#action-save`, `#action-save-draft` `.click()` | **Y** | 71 |
| SavedStateIndicator.tsx | global-action | admin.components.actions | Floating "Saved X ago" or "Save failed" chip | GET /api/:collection/:id?draft=true; window events | N | 216 |
| SchedulePublishDialog.tsx | doc-chrome (dialog) | CmsPublishButton, DisplayPublishedAtField (and dead PublishMenu) | Schedules publish or unpublish, and cancels schedules | uC, uDI, **useServerFunctions().schedulePublish**, useTranslation; GET/POST /api/payload-jobs | N | 440 |
| SchemaAddonsAdder.tsx | field | **DEAD** (per schema-addons.ts comment) | Picker for adding schema add-ons | uAFF, uF; `.drawer--is-open` | **Y** | 344 |
| SchemaPreviewField.tsx | field | SEO22.schemaPreview | JSON-LD @graph preview, issues, copy and download, override | uA, uDI, uF(_status, seo.additionalSchema); GET/POST /api/jsonld/:collection/:id; SchemaHistory | N | 1050 |
| ScrollToInvalidField.tsx | global-action | admin.components.actions | After a failed save, scrolls to and pulses the first invalid field | `.field-error`, `[aria-invalid]`, `#action-save` | **Y** | 135 |
| SeoAdvancedPanel.tsx | field | `.seoAdvanced` on SEO22 minus legalDocuments (21) | Advanced robots directives and Speakable | uF(seo.robotsAdvanced.*, seo.speakablePath); localStorage | N | 307 |
| SeoDescriptionField.tsx | field | SEO22.seoDescription | Meta description, auto-mirrored from abstract/summary | uF | N | 169 |
| SeoHealthScoreField.tsx | field | SEO22.seoHealthScore | Computed SEO score | uF(seo.title, seo.description, seo.indexable, seo.ogImage, heroImage, photo) | N | 118 |
| SeoIndexableField.tsx | field | SEO22.seoIndexable | Three-chip index / noindex control | uF | N | 108 |
| SeoTitleField.tsx | field | SEO22.seoTitle | SEO title, auto-mirrored from title/name | uF | N | 175 |
| SerpPreviewField.tsx | field | SEO22.serpPreview | Google results preview | uF(seo.title, seo.description) | N | 311 |
| ShortcutHelpDialog.tsx | global-action | admin.components.actions | Keyboard-shortcut sheet (`?` or Cmd+/) | ui/Dialog | N | 105 |
| SidebarHeader.tsx | nav/shell | admin.components.beforeNavLinks | Brand row, sidebar toggle, Dashboard link, opens the command palette | uA; dispatches `cs-cmdk:open`; Logo | N | 262 |
| SignatureTemplatePreview.tsx | field | signatureTemplates._preview | Email signature preview in a sandboxed iframe | uF | N | 161 |
| SkipLink.tsx | global-action | admin.components.actions | Skip-to-content link; tags `<main>` | `main`, `.template-default__main`, `.gutter`, MutationObserver | **Y** | 55 |
| SlashMenuPlugin.tsx | lexical-plugin | CleanstartSlashMenuFeatureClient | `/` insert menu | ENABLE_SLASH_MENU_COMMAND, INSERT_BLOCK_COMMAND; Popover; inline-image and embed commands | N | 407 |
| SlugField.tsx | field | `.slug` on 26 entities (SEO22 + emailSignatures, forms, jobLocations, signatureTemplates) | Slug from title, normalisation, live collision check | uF; GET /api/:collection?where[slug]; slug-status-store; Tooltip | N | 319 |
| SlugRequirementGuard.tsx | doc-chrome | `beforeDocumentControls` on GATE9 | Disables Save and Publish while the slug is invalid | `#action-save`, `#action-save-draft`, MutationObserver | **Y** | 134 |
| SocialCardField.tsx | field | SEO22.socialCard | OG image picker and upload, OG/X overrides, previews | uF(seo.og*, seo.twitter*, title, abstract, heroImage); GET /api/media/:id; MediaBrowseDialog | N | 702 |
| SocialCardPreview.tsx | primitive | SocialCardField | Facebook, X and LinkedIn card previews | none | N | 185 |
| SourcePageCell.tsx | cell | brokenLinks.sourceDocTitle | Links to the source document's edit page | none | N | 29 |
| SourcePageLinkField.tsx | field | brokenLinks.sourcePageLink | Admin and live links to the source page | uFF | N | 42 |
| StockToolbarSuppressorPlugin.tsx | lexical-plugin | CleanstartLinkPopoverFeatureClient | Hides Payload's stock Link and Table toolbar buttons | `[data-button-key]`, `[data-toolbar-group-key]`, MutationObserver on body | **Y** | 62 |
| TableGridPicker.tsx (+ TableGridPicker.scss, 55 lines) | lexical-plugin (sub-UI) | TableGridPickerPlugin | Word-style rows × columns grid | none | N | 92 |
| TableGridPickerIcon.tsx | lexical-plugin (icon) | TableToolbarButton | Table icon | none | N | 22 |
| TableGridPickerPlugin.tsx | lexical-plugin | CleanstartTablePopoverFeatureClient, AddMenuToolbarButton | OPEN_TABLE_GRID_COMMAND and table insert | portal to body | N | 114 |
| TableToolbarButton.tsx | lexical-plugin (toolbar) | CleanstartTablePopoverFeatureClient | Toolbar button that anchors the grid picker | none | N | 42 |
| ToastBus.tsx | global-action | admin.components.actions; `showToast` imported by 9 components | Toast stack driven by the `cs-cms:toast` event | CustomEvent | N | 162 |
| TocRowLabel.tsx | row-label | blogs, guides, knowledgeBase `.tableOfContents` | Shows "H2 · heading" as the row label | uFF, useRowLabel | N | 77 |
| ToolbarTipsPlugin.tsx | lexical-plugin | CleanstartLinkPopoverFeatureClient | Adds title and aria-label to stock toolbar buttons | `.toolbar-popup__button-*`, MutationObserver | **Y** | 68 |
| UrlChangeHistoryField.tsx | field | SEO22.urlChangeHistory | Timeline of slug-change redirects | uF; GET /api/redirects?where | N | 199 |
| UserMenu.tsx | nav/shell | admin.components.afterNavLinks | Avatar menu: Account, theme, Sign out | uA, useTheme | N | 314 |
| _redirects-shared.ts | hook/util | OutboundRedirectField, CanonicalField, UrlChangeHistoryField, InboundRedirectsField (dead) | useDocPublicUrl and redirect constants | uF | N | 166 |
| _site-url.ts | hook/util | SchemaPreviewField, Schema*, PermalinkField, SerpPreviewField, _redirects-shared | NEXT_PUBLIC_SITE_URL constant | none | N | 12 |
| display-published-at-state.ts | hook/util | DisplayPublishedAtField | Pure state machine for the date picker | none | N | 104 |
| internal-routes.ts | hook/util | LinkPopover, LinkPopoverPlugin | Maps collections to public paths; converts between absolute and relative link URLs | none | N | 96 |

## components/AddMenu
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| AddMenuToolbarButton.tsx | lexical-plugin (toolbar) | CleanstartAddMenuFeatureClient | "+ Insert" menu: H2, H3, quote, lists, divider, table, image, embed, code block, CTA | INSERT_BLOCK_COMMAND; OPEN_TABLE_GRID, OPEN_INLINE_IMAGE and OPEN_EMBED commands; portal | N | 294 |
| CleanstartAddMenuFeatureClient.ts | lexical-plugin | add-menu-feature.ts → editor-config | Registers the cs-add-menu group | createClientFeature | N | 26 |

## components/Analytics (`views.analytics` → /admin/analytics)
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| AnalyticsView.tsx | view (server) | payload.config `views.analytics` | Wraps the client in DefaultTemplate | DefaultTemplate, AdminViewServerProps | N | 42 |
| AnalyticsClient.tsx | view body | AnalyticsView | Filterable GA4 and GSC dashboard | GET /api/dashboards/ga4-overview, /api/dashboards/gsc-overview | N | 225 |
| CountryBars.tsx | primitive (chart) | AnalyticsClient | Country bars | none | N | 21 |
| CtrScatter.tsx | primitive | AnalyticsClient | CTR vs position scatter | none | N | 59 |
| Dropdown.tsx | primitive | FilterBar | Themed dropdown | none | N | 85 |
| FilterBar.tsx | primitive | AnalyticsClient | Date range and dimension filters | none | N | 60 |
| KpiCards.tsx | primitive | AnalyticsClient | KPI tiles with change versus the prior period | none | N | 34 |
| PositionHistogram.tsx | primitive | AnalyticsClient | Ranking-position histogram | none | N | 44 |
| RealtimeWidget.tsx | primitive | AnalyticsClient | Polls realtime users | GET /api/dashboards/ga4-realtime | N | 55 |
| RefreshButton.tsx | primitive | AnalyticsClient, ContentInsightsClient, LeadAttributionClient | Force-refresh button | none | N | 58 |
| Sparkline.tsx | primitive | AnalyticsClient | Sparkline | none | N | 25 |
| Split.tsx | primitive | AnalyticsClient | Split bar | none | N | 29 |
| TopList.tsx | primitive | AnalyticsClient | Ranked table | none | N | 54 |
| TrendChart.tsx | primitive | AnalyticsClient | Line or area trend chart | none | N | 200 |
| WebVitals.tsx | primitive | AnalyticsClient | CrUX Core Web Vitals | GET /api/dashboards/crux | N | 86 |

## components/ContentInsights (`views.contentInsights` → /admin/content-insights)
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| ContentInsightsView.tsx | view (server) | `views.contentInsights` | DefaultTemplate wrapper | DefaultTemplate | N | 38 |
| ContentInsightsClient.tsx | view body | ContentInsightsView | Loads and lays out the panels | GET /api/content-insights[?refresh=1] | N | 82 |
| AttributionPanel.tsx | primitive | Client | Lead attribution by content | none | N | 48 |
| Cannibalization.tsx | primitive | Client | Queries where several pages compete | none | N | 45 |
| DecayQueue.tsx | primitive | Client | Pages losing traffic | none | N | 48 |
| IndexationRollup.tsx | primitive | Client | Indexing status rollup | none | N | 36 |
| Leaderboards.tsx | primitive | Client | Top pages | none | N | 42 |
| LowCtr.tsx | primitive | Client | Pages with low click-through | none | N | 43 |
| OrphanAudit.tsx | primitive | Client | Pages with no internal links | none | N | 42 |
| StrikingDistance.tsx | primitive | Client | Queries ranking 11-20 | none | N | 42 |
| VelocityPanel.tsx | primitive | Client | Publishing velocity | none | N | 29 |

## components/LeadAttribution (`views.leadAttribution` → /admin/lead-attribution)
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| LeadAttributionView.tsx | view (server) | `views.leadAttribution` | DefaultTemplate wrapper | DefaultTemplate | N | 38 |
| LeadAttributionClient.tsx | view body | View | Leads by channel, campaign and landing page | GET /api/lead-attribution | N | 116 |
| SplitTable.tsx | primitive | Client | Ranked count table | none | N | 48 |
| TrendBars.tsx | primitive | Client | Leads per day | none | N | 33 |

## components/Dashboard
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| Dashboard.tsx | view (server) | `views.dashboard.Component` | Counts, day-grouped activity timeline, quick links | **Local API** `payload.find` (limit:1 counts; 5 recent per content collection, draft:true); scopedCollectionSlugsForUser; ChevronRight | N | 599 |
| AnalyticsCards.tsx | view part (server) | **DEAD**: import commented out in Dashboard (lines 10 and 577) | GA4 / GSC / Clarity cards read from analyticsCache | BasePayload (Local API) | N | 265 |

## components/auth
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| CmsAccountView.tsx | view (server) | `views.account.Component` | Branded account page | AdminViewServerProps | N | 37 |
| CmsAccountForm.tsx | view body | CmsAccountView | Name, email and password change | uA, uC; PATCH /api/users/:id; showToast | N | 168 |
| CmsLoginFooter.tsx | nav/shell | `admin.components.afterLogin` | "Need help?" footer | none | N | 21 |
| CmsLoginHero.tsx | nav/shell | `admin.components.beforeLogin` | Branded hero above Payload's stock LoginForm | none | N | 25 |

## components/cache (`views.cache` → /admin/cache)
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| CacheView.tsx | view (server) | `views.cache` | DefaultTemplate wrapper | DefaultTemplate | N | 45 |
| CacheClient.tsx | view body | CacheView | ISR purge (global, path, tag) with search | uA, uC; POST /api/cache-purge, GET /api/cache-search; ConfirmDialog | N | 419 |
| PurgePageButton.tsx | doc-chrome | `beforeDocumentControls`: PUB13 except pages and users (via showPurge), plus authors and emailSignatures (direct) | "Purge this page" button | uC, uDI; POST /api/cache-purge | N | 86 |

## components/CodeBlockButton
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| CleanstartCodeBlockFeatureClient.ts | lexical-plugin | code-block-feature.ts → editor-config | Adds a `<>` button to the format group and the escape plugin | createClientFeature | N | 37 |
| CodeBlockToolbarButton.tsx | lexical-plugin | feature client | Inserts a CodeBlock block | INSERT_BLOCK_COMMAND | N | 54 |
| InlineCodeEscapePlugin.tsx | lexical-plugin | feature client | Space at the end of inline code leaves the code mark | lexical KEY_SPACE_COMMAND | N | 55 |

## components/Embed
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| CleanstartEmbedFeatureClient.ts | lexical-plugin | embed-feature.ts → editor-config | Registers EmbedNode, the cs-embed button and EmbedPlugin | createClientFeature | N | 37 |
| EmbedComponent.tsx | lexical-plugin (node view) | EmbedNode | Preview card for an embed node with edit and remove | none | N | 181 |
| EmbedDialog.tsx | lexical-plugin (dialog) | EmbedPlugin | Insert or edit an embed (URL, provider, aspect, preset) | @cleanstart/ui Dialog | N | 525 |
| EmbedNode.ts | lexical-plugin (node) | EmbedPlugin, feature client, **server: lib/lexical/embed-feature.ts** | DecoratorNode with serialisation | none | N | 277 |
| EmbedPlugin.tsx | lexical-plugin | feature client; also SlashMenuPlugin, AddMenuToolbarButton, EmbedToolbarButton, EmbedComponent | OPEN_EMBED_DIALOG_COMMAND handler | none | N | 132 |
| EmbedToolbarButton.tsx | lexical-plugin | feature client | Toolbar button | none | N | 46 |
| embed-providers.ts | hook/util | EmbedNode, EmbedDialog, EmbedComponent, **apps/cms/next.config.ts (CSP frame-src)** | Provider detection and allowed iframe origins | none | N | 406 |

## components/InlineImage
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| CleanstartInlineImageFeatureClient.ts | lexical-plugin | inline-image-feature.ts → editor-config | Mounts InlineImagePlugin | createClientFeature | N | 19 |
| InlineImagePlugin.tsx | lexical-plugin | feature client; also SlashMenuPlugin, AddMenuToolbarButton | Paste and drop upload into UploadNode; image dialogs | uDI, $createUploadNode, $isUploadNode, UploadNode; closest(.rich-text-lexical) | N | 474 |
| InlineImageInsertDialog.tsx | lexical-plugin (dialog) | InlineImagePlugin | Device / Browse / URL insert tabs | upload-media-file, MediaBrowseDialog | N | 279 |
| InlineImageEditDialog.tsx | lexical-plugin (dialog) | InlineImagePlugin | Per-image settings plus media controls (rename, focal point, alt, credit, folder) | GET/PATCH /api/media/:id, POST /api/media/:id/rename | N | 602 |
| InlineImagePreviewDialog.tsx | lexical-plugin (dialog) | InlineImagePlugin | Image preview | none | N | 83 |
| context-hint.ts | hook/util | InlineImagePlugin, RichPastePlugin | Builds the x-media-context-hint header | none | N | 23 |
| folder.ts | hook/util | InlineImagePlugin, RichPastePlugin | Maps a collection to its media folder | none | N | 20 |
| upload-media-file.ts | hook/util | InlineImagePlugin, InlineImageInsertDialog, RichPastePlugin | Upload helpers | POST /api/media, POST /api/media-ingest-url | N | 213 |

## components/MediaField
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| MediaField.tsx | field | every upload field via fields/media-upload.ts (71 mounts: heroImage, seo.ogImage, seo.twitterImage, icon, asset, pdf …) | Single-screen upload, browse, replace, detach, alt, rename, preview | uF, uFF; XHR POST /api/media, GET/PATCH /api/media/:id, POST /api/media/:id/rename; MediaBrowseDialog, PdfThumb | N | 1144 |
| MediaCell.tsx | cell | same 71 upload fields | Thumbnail and filename | GET /api/media/:id | N | 76 |
| PdfThumb.tsx | primitive | MediaField, MediaBrowseDialog | First-page PDF thumbnail | none | N | 102 |

## components/SchemaManager
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| CurrentSchemaView.tsx | field | pageRegistry.currentSchemaView | Live page JSON-LD, block by block | uF; GET /api/pageRegistry/live-schema; @cleanstart/schema lint | N | 393 |
| GlobalSchemaView.tsx | field | seoDefaults.globalSchemaView | Site-wide Organization/WebSite graph built from the form | uF; @cleanstart/schema | N | 160 |
| PageSchemaFilters.tsx | list chrome | pageRegistry `beforeListTable` | Kind and override filter pills (URL `where`) | none | N | 105 |
| SchemaAllowBlock.tsx | field | pageRegistry.schemaAllowBlock | Allow-list and blocklist reference | none | N | 55 |
| SchemaBlockBuilder.tsx | field | pageRegistry.schemaBuilderView | Starter-block builder by type | uF; @cleanstart/schema | N | 136 |
| SchemaHistory.tsx | field | pageRegistry.schemaHistoryView; imported by SchemaPreviewField | Override history per @type | uF | N | 91 |
| SchemaOverrideField.tsx | field | pageRegistry.additionalSchema, seoDefaults.additionalSchema | Paste or upload a JSON-LD override and validate it | uF | N | 235 |
| SchemaSidebarInfo.tsx | field | pageRegistry.schemaSidebarInfo | Override dates and status | uDI, uF; GET /api/pageRegistry/:id, /live-schema | N | 212 |

## components/fields (generic adapters stamped by lib/wire-custom-fields.ts FIELD_OVERRIDES; mount counts from inventory)
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| ArrayField.tsx | field | every array field (51 mounts, 28 entities) | Compact rows, expand/collapse all, drag sort, remove | **RenderFields**, RowLabelProvider, uF(hasRows), uFo; ConfirmDialog, useDragSort | N | 425 |
| BlocksField.tsx | field | blocks fields (11: schemaAddons × 10, pages.layout) | Block picker, row chrome, drag sort | **RenderFields**, uF, uFo; Dialog, ConfirmDialog | N | 233 |
| CheckboxField.tsx | field | 171 mounts, 33 entities | Native checkbox | uF | N | 85 |
| CodeField.tsx | field | signatureTemplates.html | CodeMirror 6, lazy-loaded | uF | N | 231 |
| CollapsibleField.tsx | field | **0 mounts** (importMap forward-compat only) | `<details>` wrapper | RenderFields | N | 77 |
| DateField.tsx | field | events.startsAt, events.endsAt (direct in Events.ts, not in the wire map) | DateTimePicker with min/max taken from a sibling field | uF, uFF | N | 117 |
| EmailField.tsx | field | 9 mounts, 7 entities | Email input | uF | N | 83 |
| GroupField.tsx | field | 81 mounts, 30 entities | Fieldset wrapper | **RenderFields** | N | 55 |
| JoinField.tsx | field | jobs.applications | Read-only list of joined documents | uF | N | 81 |
| JsonField.tsx | field | 114 mounts, 28 entities | JSON textarea parsed on blur | uF | N | 124 |
| NumberField.tsx | field | 82 mounts, 38 entities | Number input, including hasMany | uF | N | 175 |
| PointField.tsx | field | **0 mounts** (forward-compat) | Latitude/longitude inputs | uF | N | 112 |
| RadioField.tsx | field | **0 mounts** (forward-compat) | Pill radio group | uF | N | 87 |
| RelationshipField.tsx | field | 49 mounts, 24 entities | Searchable combobox with quick-create and avatars | uF; GET /api/:slug, POST /api/:quickCreateTarget; related-docs, quick-create-config, relationship-value, ui/Popover, ui/Spinner, QuickCreateDialog | N | 995 |
| RowField.tsx | field | **0 mounts** (forward-compat) | Flex row | RenderFields | N | 34 |
| SelectField.tsx | field | 127 mounts, 39 entities | Custom dropdown portalled to body | uF | N | 307 |
| TabsField.tsx | field | **0 mounts** (forward-compat) | Tablist | RenderFields | N | 118 |
| TextField.tsx | field | 477 mounts, 49 entities | Text input with character count | uF | N | 89 |
| TextareaField.tsx | field | 101 mounts, 33 entities | Auto-growing textarea | uF | N | 125 |
| UploadField.tsx | field | wired for `upload` but **never stamped** (every upload field has its own MediaField; not in importMap) | Upload via MediaBrowseDialog | uF; GET /api/:relationTo/:id | N | 141 |
| relationship-value.ts | hook/util | RelationshipField | Normalises id types | none | N | 75 |

## components/integrations (collection `integrations`)
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| AnalyticsTab.tsx | field | `wire-analytics-tab.ts`; its wiring is **commented out** in payload.config (lines 115 and 459), so it is not mounted and not in importMap | Per-document GA4, GSC and Clarity tab | uC, uDI, uFF; /api/dashboards/ga4DataApi, /msClarity, /per-doc/gsc-queries, /per-doc/gsc-inspect, /api/globals/siteSettings | N | 395 |
| AuditTrail.tsx | field | integrations.auditTrail | Recent dead-letter rows | uDI, uC; GET /api/integrations/:id/audit | N | 164 |
| CollectionsMultiSelect.tsx | field | integrations.routing.collections | Collection multi-select | uF | N | 227 |
| ConfigNote.tsx (ClarityConfigNote) | field | integrations.clarityConfig.note | Static note | none | N | 38 |
| EventsMultiSelect.tsx | field | integrations.routing.events | Event multi-select | uF | N | 230 |
| FormSlugsMultiSelect.tsx | field | integrations.routing.formSlugs | Form multi-select | uC, uF; GET /api/forms | N | 272 |
| HealthBadge.tsx | field | integrations.healthBadge | Health light for the last 24 hours | uDI, uC; GET /api/integrations/:id/health | N | 94 |
| TestButton.tsx | field | integrations.testAction | Sends a test event | uDI, uC; POST /api/integrations/:id/test | N | 93 |

## components/views
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| list/CmsListView.tsx | view | `views.list.Component` on ALL45 (wire-custom-list-view) | List chrome around Payload's Table slot | SelectionProvider, TableColumnsProvider, uC, useListQuery, useStepNav; Drawer, DropdownMenu | N | 408 |
| list/BulkActionBar.tsx | view part | CmsListView | Bulk delete, duplicate as draft, edit-many link | uC, useSelection, hasDraftsEnabled; DELETE /api/:slug?where, POST /api/:slug/:id/duplicate | N | 257 |
| list/ColumnPicker.tsx | view part | CmsListView | Column visibility | useTableColumns | N | 60 |
| list/ColumnResizer.tsx | view part | CmsListView | Drag-resizable columns, saved per user | uA; `.cs-list__table table th/td`, MutationObserver; lib/column-widths | **Y** (Payload's Table slot) | 443 |
| list/ExportDrawer.tsx | view part | CmsListView | CSV export with fields and date presets | uC, useListQuery, useTableColumns; GET /api/:slug/export | N | 332 |
| list/ListHeader.tsx | view part | CmsListView | Search, create button, kebab | useListQuery | N | 116 |
| list/SavedViews.tsx | view part | ListHeader | Saved views | uA, useListQuery; lib/saved-views | N | 182 |
| list/export-date-preset.ts | hook/util | ExportDrawer | Date presets | none | N | 65 |
| list/export-default-columns.ts | hook/util | ExportDrawer | Default export columns per collection | none | N | 68 |
| list/filters/ListFilterBar.tsx | view part | CmsListView | Multi-select filters per collection | uC, useListQuery; GET /api/:relationTo | N | 135 |
| list/filters/MultiSelectFilterPill.tsx | primitive | ListFilterBar | Filter pill with popover | Popover | N | 148 |
| list/filters/list-filter-config.ts | hook/util | ListFilterBar, list-filter-where | LIST_FILTER_FIELDS | none | N | 87 |
| list/filters/list-filter-where.ts | hook/util | ListFilterBar | Converts between `where` and selections | none | N | 68 |
| edit/CmsEditView.tsx | view | **DEAD** (wire-custom-edit-view.ts is a no-op) | Shared edit view | DocumentFields, uC, uDI | N | 113 |
| edit/EditChrome.tsx | view part | only the dead CmsEditView and CmsVersionsView | Two-column edit shell | none | N | 76 |
| edit/PublishMenu.tsx | doc-chrome | only the dead CmsEditView | Publish split menu | uDI | N | 143 |
| versions/CmsVersionsView.tsx | view | **DEAD** | Versions chrome | none | N | 55 |

## components/pickers, ui, icons
| path | kind | mounted | does | APIs | DOM | LOC |
|---|---|---|---|---|---|---|
| pickers/MediaPicker.tsx | primitive | **DEAD** | Media drawer picker | GET /api/media | N | 145 |
| pickers/RelationshipPicker.tsx | primitive | **DEAD** | Relationship picker dialog | GET /api/:slug | N | 290 |
| ui/Combobox.tsx | primitive (re-export of @cleanstart/ui) | only the dead RelationshipPicker | none | none | N | 2 |
| ui/ConfirmDialog.tsx | primitive (re-export) | **DEAD** | none | none | N | 1 |
| ui/Dialog.tsx | primitive (re-export) | ShortcutHelpDialog, and the dead SchemaAddonsAdder and RelationshipPicker | none | none | N | 1 |
| ui/Drawer.tsx | primitive (re-export) | **DEAD** | none | none | N | 1 |
| ui/Popover.tsx | primitive (re-export) | fields/RelationshipField | none | none | N | 1 |
| ui/Spinner.tsx | primitive (re-export) | fields/RelationshipField | none | none | N | 1 |
| ui/hooks/useAnchoredPosition.ts | hook (re-export) | **DEAD** | none | none | N | 2 |
| ui/hooks/useDismiss.ts | hook (re-export) | **DEAD** | none | none | N | 1 |
| ui/index.ts | primitive barrel | **DEAD** | none | none | N | 34 |
| icons/Chevron.tsx | primitive | 10 sidebar cards and Dashboard | ChevronDown and ChevronRight | none | N | 45 |

## app/(payload)
| path | kind | notes | LOC |
|---|---|---|---|
| layout.tsx | nav/shell | Payload `RootLayout` with config, importMap and serverFunction; imports `@payloadcms/next/css` and custom.scss; robots noindex | 27 |
| custom.scss | styles | `@use`s all 45 partials below | 120 |

Other files: `admin/[[...segments]]/page.tsx` 23, `not-found.tsx` 18, `admin/importMap.js` 308 (generated), `api/[...slug]/route.ts` 16, `api/health/route.ts` 31, `error.tsx` 60, `server-function.ts` 21 (`handleServerFunctions`).

**SCSS partials in styles/ (lines; every one is `@use`d):**
- _a11y 118
- _analytics-tab 198
- _analytics 480
- _arrays 99
- _audit-log 72
- _button-audit 187
- _buttons 243
- _cache 414
- _chrome-extras 303
- _chrome 395
- _command-palette 367
- _content-insights 151
- _dashboard 747
- _density 327
- _doc-sidebar 169
- _editor-fullscreen 233
- _editor 633
- _empty-state 111
- _error-states 130
- _fonts 37
- _forms 1173
- _inline-image 553
- _lead-attribution 133
- _lexical-toolbar 808
- _light-mode 19
- _list-controls 914
- _login 257
- _media-cell 55
- _media-field 922
- _media 806
- _nav 209
- _overlays 812
- _paper-cuts 810
- _pills 79
- _saved-indicator 84
- _scrollbars 38
- _semantics 85
- _sidebar-header 447
- _sidebar-seo 3714
- _tables 424
- _themes 87
- _tokens 123
- _typography 62
- _ui-primitives 2577
- _user-menu 374

Total: 21,483 lines in partials, plus custom.scss.

Component-local SCSS: `components/LinkPopover.scss` 251, `components/TableGridPicker.scss` 55.

---

## (1) Payload imports used (number of files importing each)
- **@payloadcms/ui:**
  - useField 56
  - useDocumentInfo 25
  - useConfig 22
  - useFormFields 9
  - useAuth 8
  - RenderFields 6
  - useForm 5
  - useListQuery 5
  - useRowLabel 3
  - useAllFormFields 2
  - useFormModified 2
  - useTableColumns 2
  - 1 file each: DocumentFields (dead file only), RowLabelProvider, SelectionProvider, TableColumnsProvider, type Theme, useLocale, useNav, useSelection, useServerFunctions, useStepNav, useTheme, useTranslation
- **@payloadcms/next:** `/templates` DefaultTemplate 4 (Analytics, ContentInsights, LeadAttribution and Cache views). layout.tsx also uses `@payloadcms/next/layouts` RootLayout and `/css`, and server-function.ts uses handleServerFunctions.
- **@payloadcms/richtext-lexical/client:**
  - createClientFeature 9
  - INSERT_BLOCK_COMMAND 4
  - toolbarFeatureButtonsGroupWithItems 3
  - $createUploadNode 2
  - $isLinkNode 2
  - 1 each: $isUploadNode, UploadNode, LinkNode, TOGGLE_LINK_COMMAND, ENABLE_SLASH_MENU_COMMAND, useEditorConfigContext
- **payload/shared:** hasDraftsEnabled 2; formatAdminURL, hasAutosaveEnabled and hasScheduledPublishEnabled 1 each.
- **payload (types only):** AdminViewServerProps 6, Where 3, the *FieldClientProps types, ListViewClientProps, DocumentViewClientProps and others.

## (2) DOM-enhancer components (19 files, plus 2 partial and 2 borderline)
- **Live:**
  - DocSidebarResizer
  - EditorFullscreenToggle
  - FaqBulkPaste
  - FieldDescriptionTooltip
  - NavBadges
  - NavGroupPersistence
  - ScrollToInvalidField
  - SkipLink
  - SaveShortcut
  - PublishOverrideGuard
  - SlugRequirementGuard
  - StockToolbarSuppressorPlugin
  - ToolbarTipsPlugin
  - views/list/ColumnResizer
  - MediaSelfChrome (partial: clicks `.file-field__edit`)
  - PreviewMenu (partial: clicks `#live-preview-toggler`)
- **Dead:** ListCellEnhancer, SchemaAddonsAdder.
- **Borderline (scoped to their own editor DOM):** InlineImagePlugin and RichPastePlugin.

## (3) Dead or never-mounted code (verified by grep, comments excluded)
- **Unreferenced (15 files):**
  - BodyAuditField
  - InboundRedirectsField
  - KeywordTargetField
  - ListCellEnhancer
  - SchemaAddonsAdder
  - Dashboard/AnalyticsCards (import commented out)
  - pickers/MediaPicker
  - pickers/RelationshipPicker
  - ui/ConfirmDialog
  - ui/Drawer
  - ui/hooks/useAnchoredPosition
  - ui/hooks/useDismiss
  - ui/index.ts
  - views/edit/CmsEditView
  - views/versions/CmsVersionsView
- **Only reachable from dead code:** views/edit/EditChrome, views/edit/PublishMenu, ui/Combobox.
- **Wired in source but never mounted (absent from importMap and inventory):**
  - BytesCell
  - fields/UploadField
  - integrations/AnalyticsTab (its wiring is commented out)
  - CleanstartBlockHandleFeatureClient and BlockHandlePlugin (feature not in editor-config)
- **In importMap but with zero field mounts (kept for forward compatibility):** fields/PointField, RadioField, CollapsibleField, TabsField, RowField.

**Not checked:** I did not read every file in full. The descriptions come from doc comments, imports and grep, and endpoint lists are what static grep finds; URLs built at runtime from helpers may be missed.