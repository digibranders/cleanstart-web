# Field, component and collection map

This is the parity contract. A collection is "Studio-ready" only when its row in §C is ticked with a passing test id. A file in `apps/cms/src/payload/admin/` may only be deleted (Phase 7 retirement) when its row in §B says it is replaced and the replacement is ticked.

Sources: `research/schema-inventory.txt` (generated from the live config on 2026-10-16), `research/collections-summary.txt`, `research/admin-components.md`, `research/workflows-and-roles.md`. Regenerate the inventory with the script in Task 1.9 of the Phase 0-1 plan whenever the schema changes, and re-check this file against it.

Studio paths below are relative to `apps/cms/src/studio/`.

## §A Field types

Counts are field definitions across all collections and globals (from the inventory). Every type has one generic renderer. Custom components from §B override the generic renderer through the registry (ADR-8).

| Type | Count | Studio renderer | Behaviour it must keep | Replaces | Phase |
|---|---|---|---|---|---|
| text | 595 | `form/fields/basic.tsx` (`TextFieldRenderer`) | `required`, `maxLength` counter, `hasMany` → TagInput, `unique` error from server, read-only | `fields/TextField.tsx` | 1 |
| textarea | 101 | `form/fields/basic.tsx` (`TextareaFieldRenderer`) | Auto-grow 3 to 12 rows, counter | `fields/TextareaField.tsx` | 1 |
| number | 112 | `form/fields/basic.tsx` (`NumberFieldRenderer`; `hasMany` in Phase 2) | `min`, `max`, integer vs decimal, `hasMany` | `fields/NumberField.tsx` | 1 |
| email | 10 | `form/fields/basic.tsx` (`EmailFieldRenderer`) | Email shape on client, server authoritative | `fields/EmailField.tsx` | 1 |
| checkbox | 174 | `form/fields/basic.tsx` (`CheckboxFieldRenderer`) | Label to the right of the box, description below | `fields/CheckboxField.tsx` | 1 |
| select | 156 | `form/fields/basic.tsx` (`SelectFieldRenderer`) | Options with labels, `hasMany`, searchable over 8 options, clearable unless required | `fields/SelectField.tsx` | 1 |
| radio | 1 | `form/fields/basic.tsx` (`RadioFieldRenderer`) | Segmented when 2 to 4 short options | `fields/RadioField.tsx` | 1 |
| date | 111 | `form/fields/basic.tsx` (`DateFieldRenderer`; time-only and month-only in Phase 2) | `pickerAppearance` (dayOnly, dayAndTime), timezone, min/max from a sibling field (Events `startsAt`/`endsAt`) | `fields/DateField.tsx` | 1 |
| json | 126 | `form/fields/basic.tsx` (`JsonFieldRenderer`, monospace textarea; CodeEditor in Phase 2) | Parsed on save, invalid JSON blocks save with a field error | `fields/JsonField.tsx` | 1 |
| code | 1 | `form/fields/CodeField.tsx` | CodeEditor with `admin.language` (HTML for signature templates), lazy-loaded | `fields/CodeField.tsx` | 2 |
| group | 85 | `form/fields/GroupField.tsx` | Named group → nested path; renders as `Section` | `fields/GroupField.tsx` | 2 |
| collapsible | 5 | `form/fields/CollapsibleField.tsx` | `initCollapsed`, open state saved per user | `fields/CollapsibleField.tsx` | 2 |
| row | 0 today | `form/fields/RowField.tsx` | Fields side by side, honours `admin.width` | `fields/RowField.tsx` | 2 |
| tabs | 1 | `form/fields/TabsField.tsx` | Named tabs nest data, unnamed tabs do not; error dot on tabs with invalid fields | `fields/TabsField.tsx` | 2 |
| array | 53 | `form/fields/ArrayField.tsx` | `minRows`, `maxRows`, collapse and expand all, drag and keyboard reorder (⌥↑ ⌥↓), duplicate row, remove with undo toast (replaces ⌘Z restore), custom RowLabel, `initCollapsed` | `fields/ArrayField.tsx` | 2 |
| blocks | 11 | `form/fields/BlocksField.tsx` | Block picker (search, descriptions, insert at position), collapsed summary per block, reorder, duplicate, remove with undo | `fields/BlocksField.tsx` | 2 |
| relationship | 52 | `form/fields/RelationshipField.tsx` | Single, many, polymorphic `relationTo[]`, `filterOptions` (resolved on the server per query), search, quick create (`lib/quick-create-config.ts`), open related doc in a new tab, `allowCreate: false` | `fields/RelationshipField.tsx` | 2 |
| upload | 71 | `media/MediaField.tsx` | Upload, browse (S-22), replace, detach, inline alt edit, rename, PDF thumbnail, size warning | `MediaField/MediaField.tsx` | 2 |
| join | 1 | `form/fields/JoinField.tsx` | Read-only list of joined docs with links (jobs → applications) | `fields/JoinField.tsx` | 2 |
| point | 0 today | `form/fields/PointField.tsx` | Latitude and longitude inputs | `fields/PointField.tsx` | 2 |
| richText | 15 | `editor/RichTextField.tsx` | `04-EDITOR-SPEC.md`; default config and FAQ-answer config | Payload lexical field | 3 |
| ui | 322 | `form/fields/UiField.tsx` | Renders the registry component for `admin.components.Field`; renders nothing when none | n/a | 1 (host), per component |

Cross-cutting behaviour every renderer gets from the engine (`form/engine/`):

- `admin.condition` through the shared conditions registry (ADR-6). Hidden fields keep their value, as Payload does.
- `admin.readOnly`, field `access.update` (from permissions), `admin.hidden` (not rendered, value kept), `admin.position` (main or rail), `admin.width`, `admin.description`, `label`, `defaultValue`.
- Client validation for `required`, length, bounds, email and the shared pure validators; server errors mapped by path.
- `admin.disableListColumn`, `admin.disableListFilter` respected in S-10.

## §B Every existing admin file and its Studio replacement

Fate codes:

- **GEN**: covered by the generic engine; no dedicated Studio file.
- **PORT**: behaviour and logic carried over into the Studio file named; markup rewritten on Studio UI.
- **NEW**: was a DOM enhancer over Payload; rebuilt as a real Studio feature.
- **SHARE**: pure module reused as-is by Studio (moved to a shared location if it imports Payload UI).
- **KEEP**: also used by server code or `next.config.ts`; must not be deleted at retirement.
- **DROP**: dead today (verified by grep in `research/admin-components.md`); not rebuilt.
- **RET**: only exists to customise Payload's admin; nothing to rebuild because Studio owns the shell. Deleted at retirement.

Paths are relative to `apps/cms/src/payload/admin/`. "SEO22" and other set names are defined in `research/admin-components.md`.

### B.1 Root and lib

| File | Fate | Studio target | Phase |
|---|---|---|---|
| Icon.tsx | SHARE | `shell/BrandMark.tsx` imports its paths but renders both in `currentColor` (the file's hard-coded cyan is not used; D-10) | 1 |
| Logo.tsx | SHARE | `shell/BrandMark.tsx`, S-01 | 1 |
| doc-status-bar-mount.ts | RET | Document header is generic (S-12) | 7 |
| lib/column-widths.ts | PORT | `server/actions/preferences.ts` (`setColumnWidths`) | 5 |
| lib/quick-create-config.ts | SHARE | used by `form/fields/RelationshipField.tsx` | 2 |
| lib/related-docs.ts | PORT | `server/loaders/related-titles.ts` (batched on the server) | 1 |
| lib/saved-views.ts | PORT | `server/actions/preferences.ts` (`saveView`, `deleteView`) | 5 |
| lib/slug-status-store.ts | DROP | Slug state lives in the form engine | 4 |

### B.2 Top-level components

| File | Fate | Studio target | Phase |
|---|---|---|---|
| AuthorCredibilityField.tsx | PORT | `features/authors/AuthorCredibility.tsx` | 2 |
| BlockHandlePlugin.tsx | DROP | Never registered; editor has its own block handle (04 §5) | n/a |
| BlogCtaAutoPick.tsx | PORT | `features/blogs/CtaAutoPick.tsx` | 4 |
| BodyAuditField.tsx | DROP | Unreferenced | n/a |
| BooleanChipCell.tsx | PORT | `list/Cell.tsx` (boolean branch) | 1 |
| BrokenLinkStatusField.tsx | PORT | `features/broken-links/LinkStatus.tsx` | 5 |
| BrokenLinkUrlField.tsx | PORT | `features/broken-links/LinkUrl.tsx` | 5 |
| BytesCell.tsx | PORT | `list/Cell.tsx` bytes branch (mounted for `filesize`, fixing today's gap) | 2 |
| CanonicalField.tsx | PORT | `seo/CanonicalCard.tsx` | 4 |
| CleanstartBlockHandleFeatureClient.ts | DROP | Never registered | n/a |
| CleanstartLinkPopoverFeatureClient.ts | RET | `editor/plugins/LinkPlugin.tsx` (04) | 3 |
| CleanstartSlashMenuFeatureClient.ts | RET | `editor/plugins/SlashMenuPlugin.tsx` | 3 |
| CleanstartTablePopoverFeatureClient.ts | RET | `editor/plugins/TablePlugin.tsx` | 3 |
| CmsPublishButton.tsx | PORT | `document/PublishControl.tsx` | 4 |
| CommandPalette.tsx | PORT | `shell/CommandPalette.tsx` (client routing, one search action) | 6 |
| CopyPreviewLink.tsx | PORT | `document/ShareLinkDialog.tsx` | 4 |
| DateCell.tsx | PORT | `list/Cell.tsx` (`DateValue`) | 1 |
| DisableUserAction.tsx | PORT | `features/users/DisableUser.tsx` | 5 |
| DisplayPublishedAtField.tsx | PORT | `features/publishing/DisplayPublishedAt.tsx` | 4 |
| DocHeader.tsx | PORT | `document/DocumentHeader.tsx` | 1 |
| DocKebabExtras.tsx | PORT | `document/MoreMenu.tsx` | 4 |
| DocSidebarResizer.tsx | NEW | `ui/Rail.tsx` (resize and collapse built in) | 1 |
| DsarActionsPanel.tsx | PORT | `features/leads/PrivacyRequests.tsx` | 5 |
| EditorFullscreenToggle.tsx | NEW | `document/FocusMode.tsx` | 3 |
| FaqBulkPaste.tsx | NEW | `features/blogs/FaqBulkPaste.tsx` (uses the engine's array API, no MutationObserver) | 4 |
| FaqRowLabel.tsx | PORT | `features/blogs/FaqRowLabel.tsx` | 2 |
| FieldDescriptionTooltip.tsx | NEW | Descriptions render under labels in `ui/Field.tsx` | 1 |
| FlaggedLeadsTab.tsx | PORT | `features/leads/FlaggedLeads.tsx` | 5 |
| GateFormLabel.tsx | PORT | `features/resources/GateFormLabel.tsx` (conditional required marker) | 2 |
| HeadTagsCard.tsx | PORT | `seo/HeadTagsCard.tsx` | 4 |
| HiddenField.tsx | GEN | Engine keeps hidden values | 2 |
| InboundRedirectsField.tsx | DROP | Unreferenced | n/a |
| JourneyMirrorWarning.tsx | PORT | `features/blogs/JourneyMirrorWarning.tsx` | 4 |
| KeywordTargetField.tsx | DROP | Replaced by KeywordsField already | n/a |
| KeywordsField.tsx | PORT | `seo/KeywordsCard.tsx` | 4 |
| LeadContactCell.tsx | PORT | `features/leads/ContactCell.tsx` | 5 |
| LeadSyncCell.tsx | PORT | `features/leads/SyncCell.tsx` | 5 |
| LeadsCsvTruncationBanner.tsx | PORT | `features/leads/ExportLeads.tsx` (reads the response header directly) | 5 |
| LeadsImmutableBanner.tsx | GEN | Immutable Banner in S-12 and S-10 | 5 |
| LegacyBioViewer.tsx | PORT | `features/authors/LegacyBio.tsx` | 2 |
| LinkInternalSearch.tsx | PORT | `editor/link/InternalSearch.tsx` | 3 |
| LinkPopover.tsx (+ .scss) | PORT | `editor/link/LinkPopover.tsx` | 3 |
| LinkPopoverIcon.tsx | DROP | Phosphor icon | 3 |
| LinkPopoverPlugin.tsx | PORT | `editor/plugins/LinkPlugin.tsx` | 3 |
| ListCellEnhancer.tsx | DROP | Unreferenced | n/a |
| LockedReason.tsx | PORT | `ui/LockedReason.tsx` | 5 |
| MediaBrowseDialog.tsx | PORT | `media/MediaPicker.tsx` (S-22) | 2 |
| MediaSelfChrome.tsx | NEW | `media/MediaDetail.tsx` (S-21) | 2 |
| MediaSizeWarningField.tsx | PORT | `media/SizeWarning.tsx` | 2 |
| MentionRowLabel.tsx | PORT | `features/integrations/MentionRowLabel.tsx` | 5 |
| NavBadges.tsx | NEW | Draft counts in `shell/Sidebar.tsx` | 1 |
| NavGroupPersistence.tsx | NEW | `shell/NavGroup.tsx` saves open state | 1 |
| NavOpenOnDesktop.tsx | NEW | `shell/AppShell.tsx` sidebar state | 1 |
| Notice.tsx | PORT | `ui/Banner.tsx` | 0 |
| OutboundRedirectField.tsx | PORT | `seo/RedirectCard.tsx` | 4 |
| PartnersExportButton.tsx | PORT | `features/applications/ExportPartners.tsx` | 5 |
| PermalinkField.tsx | PORT | `seo/PermalinkRow.tsx` | 4 |
| PreviewMenu.tsx | PORT | `document/PreviewControl.tsx` (no hidden-button clicks) | 4 |
| PublishChecklistBanner.tsx | PORT | `document/ChecklistCard.tsx` and blocker Banner | 4 |
| PublishOverrideGuard.tsx | NEW | `document/PublishControl.tsx` confirm step | 4 |
| ReassignContentAction.tsx | PORT | `features/users/ReassignContent.tsx` | 5 |
| RedirectStalenessField.tsx | PORT | `features/redirects/StalenessPill.tsx` | 5 |
| RelationshipCell.tsx | PORT | `list/Cell.tsx` (relationship branch) + `server/loaders/related-titles.ts` | 1 |
| RichPasteFeatureClient.ts | RET | `editor/plugins/RichPastePlugin.tsx` | 3 |
| RichPastePlugin.tsx | PORT | `editor/plugins/RichPastePlugin.tsx` | 3 |
| SaveShortcut.tsx | NEW | `document/EditView.tsx` key handler (⌘S, ⌘↵, ⌘.) | 1 |
| SavedStateIndicator.tsx | NEW | `document/SaveStatus.tsx` (from form state, no polling) | 1 |
| SchedulePublishDialog.tsx | PORT | `document/PublishPopover.tsx` (Schedule option; `09` §5) | 4 |
| SchemaAddonsAdder.tsx | DROP | Unreferenced | n/a |
| SchemaPreviewField.tsx | PORT | `seo/StructuredDataCard.tsx` | 4 |
| ScrollToInvalidField.tsx | NEW | `document/ValidationSummary.tsx` | 1 |
| SeoAdvancedPanel.tsx | PORT | `seo/AdvancedCard.tsx` | 4 |
| SeoDescriptionField.tsx | PORT | `seo/SeoDescription.tsx` | 4 |
| SeoHealthScoreField.tsx | PORT | `seo/HealthScore.tsx` | 4 |
| SeoIndexableField.tsx | PORT | `seo/IndexableControl.tsx` | 4 |
| SeoTitleField.tsx | PORT | `seo/SeoTitle.tsx` | 4 |
| SerpPreviewField.tsx | PORT | `seo/SerpPreview.tsx` | 4 |
| ShortcutHelpDialog.tsx | PORT | `shell/ShortcutSheet.tsx` (generated from `shell/shortcuts.ts`) | 6 |
| SidebarHeader.tsx | PORT | `shell/Sidebar.tsx` brand row | 1 |
| SignatureTemplatePreview.tsx | PORT | `features/signatures/TemplatePreview.tsx` | 5 |
| SkipLink.tsx | NEW | `shell/SkipLink.tsx` (static, no DOM tagging) | 1 |
| SlashMenuPlugin.tsx | PORT | `editor/plugins/SlashMenuPlugin.tsx` | 3 |
| SlugField.tsx | PORT | `features/publishing/SlugField.tsx` | 1 |
| SlugRequirementGuard.tsx | NEW | `document/PublishControl.tsx` disabled state with reason | 1 |
| SocialCardField.tsx | PORT | `seo/SocialCard.tsx` | 4 |
| SocialCardPreview.tsx | PORT | `seo/SocialCardPreview.tsx` | 4 |
| SourcePageCell.tsx | PORT | `features/broken-links/SourcePageCell.tsx` | 5 |
| SourcePageLinkField.tsx | PORT | `features/broken-links/SourcePageLinks.tsx` | 5 |
| StockToolbarSuppressorPlugin.tsx | DROP | Studio toolbar has no stock buttons to hide | 3 |
| TableGridPicker.tsx (+ .scss) | PORT | `editor/table/TableGridPicker.tsx` (keyboard grid added) | 3 |
| TableGridPickerIcon.tsx | DROP | Phosphor icon | 3 |
| TableGridPickerPlugin.tsx | PORT | `editor/plugins/TablePlugin.tsx` | 3 |
| TableToolbarButton.tsx | PORT | `editor/toolbar/Toolbar.tsx` | 3 |
| ToastBus.tsx | NEW | `packages/ui` Toast only; `showToast` callers move to `useToast` | 0 |
| TocRowLabel.tsx | PORT | `features/blogs/TocRowLabel.tsx` | 2 |
| ToolbarTipsPlugin.tsx | DROP | Studio toolbar has tooltips built in | 3 |
| UrlChangeHistoryField.tsx | PORT | `seo/UrlHistory.tsx` | 4 |
| UserMenu.tsx | PORT | `shell/UserMenu.tsx` | 1 |
| _redirects-shared.ts | PORT | `seo/redirects.ts` | 4 |
| _site-url.ts | SHARE | used as-is | 1 |
| display-published-at-state.ts | SHARE | used by `DisplayPublishedAt.tsx` | 4 |
| internal-routes.ts | SHARE | used by the link popover | 3 |

### B.3 Folders

| File | Fate | Studio target | Phase |
|---|---|---|---|
| AddMenu/AddMenuToolbarButton.tsx | PORT | `editor/toolbar/InsertMenu.tsx` | 3 |
| AddMenu/CleanstartAddMenuFeatureClient.ts | RET | n/a | 3 |
| Analytics/AnalyticsView.tsx | RET | `app/(studio)/studio/(app)/analytics/page.tsx` | 6 |
| Analytics/AnalyticsClient.tsx | PORT | `reports/analytics/AnalyticsReport.tsx` | 6 |
| Analytics/CountryBars.tsx | PORT | `reports/charts/BarList.tsx` | 6 |
| Analytics/CtrScatter.tsx | PORT | `reports/charts/Scatter.tsx` | 6 |
| Analytics/Dropdown.tsx | DROP | `ui/Select` | 6 |
| Analytics/FilterBar.tsx | PORT | `reports/ReportFilters.tsx` | 6 |
| Analytics/KpiCards.tsx | PORT | `reports/KpiRow.tsx` | 6 |
| Analytics/PositionHistogram.tsx | PORT | `reports/charts/Histogram.tsx` | 6 |
| Analytics/RealtimeWidget.tsx | PORT | `reports/analytics/Realtime.tsx` | 6 |
| Analytics/RefreshButton.tsx | PORT | `reports/RefreshButton.tsx` | 6 |
| Analytics/Sparkline.tsx | PORT | `reports/charts/Sparkline.tsx` | 6 |
| Analytics/Split.tsx | PORT | `reports/charts/SplitBar.tsx` | 6 |
| Analytics/TopList.tsx | PORT | `reports/charts/BarList.tsx` | 6 |
| Analytics/TrendChart.tsx | PORT | `reports/charts/TrendChart.tsx` | 6 |
| Analytics/WebVitals.tsx | PORT | `reports/analytics/WebVitals.tsx` | 6 |
| ContentInsights/ContentInsightsView.tsx | RET | route page | 6 |
| ContentInsights/ContentInsightsClient.tsx | PORT | `reports/content-insights/ContentInsightsReport.tsx` | 6 |
| ContentInsights/AttributionPanel.tsx | PORT | `reports/content-insights/AttributionPanel.tsx` | 6 |
| ContentInsights/Cannibalization.tsx | PORT | `reports/content-insights/Cannibalization.tsx` | 6 |
| ContentInsights/DecayQueue.tsx | PORT | `reports/content-insights/DecayQueue.tsx` | 6 |
| ContentInsights/IndexationRollup.tsx | PORT | `reports/content-insights/IndexationRollup.tsx` | 6 |
| ContentInsights/Leaderboards.tsx | PORT | `reports/content-insights/Leaderboards.tsx` | 6 |
| ContentInsights/LowCtr.tsx | PORT | `reports/content-insights/LowCtr.tsx` | 6 |
| ContentInsights/OrphanAudit.tsx | PORT | `reports/content-insights/OrphanAudit.tsx` | 6 |
| ContentInsights/StrikingDistance.tsx | PORT | `reports/content-insights/StrikingDistance.tsx` | 6 |
| ContentInsights/VelocityPanel.tsx | PORT | `reports/content-insights/VelocityPanel.tsx` | 6 |
| LeadAttribution/LeadAttributionView.tsx | RET | route page | 6 |
| LeadAttribution/LeadAttributionClient.tsx | PORT | `reports/lead-attribution/LeadAttributionReport.tsx` | 6 |
| LeadAttribution/SplitTable.tsx | PORT | `reports/charts/RankTable.tsx` | 6 |
| LeadAttribution/TrendBars.tsx | PORT | `reports/charts/TrendBars.tsx` | 6 |
| Dashboard/Dashboard.tsx | PORT | `reports/dashboard/Dashboard.tsx` + `server/loaders/dashboard.ts` | 6 |
| Dashboard/AnalyticsCards.tsx | DROP | Import commented out today | n/a |
| auth/CmsAccountView.tsx | RET | route page S-04 | 1 |
| auth/CmsAccountForm.tsx | PORT | `features/account/AccountForm.tsx` | 1 |
| auth/CmsLoginFooter.tsx | PORT | S-01 footer line | 1 |
| auth/CmsLoginHero.tsx | PORT | S-01 brand panel (`features/auth/BrandPanel.tsx`, design system §7.7) | 1 |
| cache/CacheView.tsx | RET | route page S-43 | 6 |
| cache/CacheClient.tsx | PORT | `reports/cache/CachePurge.tsx` | 6 |
| cache/PurgePageButton.tsx | PORT | `document/MoreMenu.tsx` item "Purge page", admin and editor only, on the 12 routed content collections except pages, plus authors and emailSignatures (where `showPurge` is set today) | 4 |
| CodeBlockButton/CleanstartCodeBlockFeatureClient.ts | RET | n/a | 3 |
| CodeBlockButton/CodeBlockToolbarButton.tsx | PORT | `editor/toolbar/Toolbar.tsx` | 3 |
| CodeBlockButton/InlineCodeEscapePlugin.tsx | PORT | `editor/plugins/InlineCodeEscapePlugin.tsx` | 3 |
| Embed/CleanstartEmbedFeatureClient.ts | RET | n/a | 3 |
| Embed/EmbedComponent.tsx | PORT | `editor/embed/EmbedCard.tsx` | 3 |
| Embed/EmbedDialog.tsx | PORT | `editor/embed/EmbedDialog.tsx` | 3 |
| Embed/EmbedNode.ts | KEEP | Imported by `lib/lexical/embed-feature.ts` (server). Studio's `editor/nodes/EmbedNode.ts` shares its JSON shape through an extracted `apps/cms/src/payload/admin/components/Embed/embed-node-shape.ts` (pure types and the JSON shape, imported by both node classes; it survives the admin retirement with `EmbedNode.ts`) | 3 |
| Embed/EmbedPlugin.tsx | PORT | `editor/plugins/EmbedPlugin.tsx` | 3 |
| Embed/EmbedToolbarButton.tsx | PORT | `editor/toolbar/Toolbar.tsx` | 3 |
| Embed/embed-providers.ts | KEEP | Imported by `next.config.ts` for CSP `frame-src`; Studio imports it too | 3 |
| InlineImage/CleanstartInlineImageFeatureClient.ts | RET | n/a | 3 |
| InlineImage/InlineImagePlugin.tsx | PORT | `editor/plugins/ImagePlugin.tsx` | 3 |
| InlineImage/InlineImageInsertDialog.tsx | PORT | uses `media/MediaPicker.tsx` | 3 |
| InlineImage/InlineImageEditDialog.tsx | PORT | `editor/image/ImageSettingsDialog.tsx` | 3 |
| InlineImage/InlineImagePreviewDialog.tsx | PORT | `editor/image/ImagePreviewDialog.tsx` | 3 |
| InlineImage/context-hint.ts | SHARE | used by `media/uploader.ts` | 2 |
| InlineImage/folder.ts | SHARE | used by `media/uploader.ts` | 2 |
| InlineImage/upload-media-file.ts | PORT | `media/uploader.ts` (XHR with progress) | 2 |
| MediaField/MediaField.tsx | PORT | `media/MediaField.tsx` | 2 |
| MediaField/MediaCell.tsx | PORT | `list/Cell.tsx` media branch | 2 |
| MediaField/PdfThumb.tsx | PORT | `media/PdfThumb.tsx` | 2 |
| SchemaManager/CurrentSchemaView.tsx | PORT | `features/schema-manager/LiveSchema.tsx` | 5 |
| SchemaManager/GlobalSchemaView.tsx | PORT | `features/schema-manager/GlobalSchema.tsx` | 2 |
| SchemaManager/PageSchemaFilters.tsx | PORT | `features/schema-manager/RegistryFilters.tsx` | 5 |
| SchemaManager/SchemaAllowBlock.tsx | PORT | `features/schema-manager/AllowedTypes.tsx` | 5 |
| SchemaManager/SchemaBlockBuilder.tsx | PORT | `features/schema-manager/BlockBuilder.tsx` | 5 |
| SchemaManager/SchemaHistory.tsx | PORT | `features/schema-manager/OverrideHistory.tsx` | 4 |
| SchemaManager/SchemaOverrideField.tsx | PORT | `features/schema-manager/OverrideEditor.tsx` | 2 |
| SchemaManager/SchemaSidebarInfo.tsx | PORT | `features/schema-manager/OverrideStatus.tsx` | 5 |
| fields/ArrayField.tsx | PORT | `form/fields/ArrayField.tsx` | 2 |
| fields/BlocksField.tsx | PORT | `form/fields/BlocksField.tsx` | 2 |
| fields/CheckboxField.tsx | PORT | `form/fields/basic.tsx` | 1 |
| fields/CodeField.tsx | PORT | `form/fields/CodeField.tsx` | 2 |
| fields/CollapsibleField.tsx | PORT | `form/fields/CollapsibleField.tsx` | 2 |
| fields/DateField.tsx | PORT | `form/fields/basic.tsx` (sibling min/max for Events in Phase 2) | 1 |
| fields/EmailField.tsx | PORT | `form/fields/basic.tsx` | 1 |
| fields/GroupField.tsx | PORT | `form/fields/GroupField.tsx` | 2 |
| fields/JoinField.tsx | PORT | `form/fields/JoinField.tsx` | 2 |
| fields/JsonField.tsx | PORT | `form/fields/basic.tsx` | 1 |
| fields/NumberField.tsx | PORT | `form/fields/basic.tsx` | 1 |
| fields/PointField.tsx | PORT | `form/fields/PointField.tsx` | 2 |
| fields/RadioField.tsx | PORT | `form/fields/basic.tsx` | 1 |
| fields/RelationshipField.tsx | PORT | `form/fields/RelationshipField.tsx` | 2 |
| fields/RowField.tsx | PORT | `form/fields/RowField.tsx` | 2 |
| fields/SelectField.tsx | PORT | `form/fields/basic.tsx` | 1 |
| fields/TabsField.tsx | PORT | `form/fields/TabsField.tsx` | 2 |
| fields/TextField.tsx | PORT | `form/fields/basic.tsx` | 1 |
| fields/TextareaField.tsx | PORT | `form/fields/basic.tsx` | 1 |
| fields/UploadField.tsx | DROP | Never mounted; `media/MediaField.tsx` covers upload | n/a |
| fields/relationship-value.ts | SHARE | used by `RelationshipField.tsx` | 2 |
| integrations/AnalyticsTab.tsx | DROP | Wiring commented out today | n/a |
| integrations/AuditTrail.tsx | PORT | `features/integrations/RecentFailures.tsx` | 5 |
| integrations/CollectionsMultiSelect.tsx | PORT | `features/integrations/CollectionsSelect.tsx` | 5 |
| integrations/ConfigNote.tsx | PORT | `features/integrations/ClarityNote.tsx` | 5 |
| integrations/EventsMultiSelect.tsx | PORT | `features/integrations/EventsSelect.tsx` | 5 |
| integrations/FormSlugsMultiSelect.tsx | PORT | `features/integrations/FormsSelect.tsx` | 5 |
| integrations/HealthBadge.tsx | PORT | `features/integrations/HealthBadge.tsx` | 5 |
| integrations/TestButton.tsx | PORT | `features/integrations/SendTestEvent.tsx` | 5 |
| views/list/CmsListView.tsx | PORT | `list/ListView.tsx` | 1 |
| views/list/BulkActionBar.tsx | PORT | `list/BulkBar.tsx` | 5 |
| views/list/ColumnPicker.tsx | PORT | `list/ListToolbar.tsx` (Columns popover) | 1 |
| views/list/ColumnResizer.tsx | NEW | `list/DataTable.tsx` resizable columns | 5 |
| views/list/ExportDrawer.tsx | PORT | `list/ExportDrawer.tsx` | 5 |
| views/list/ListHeader.tsx | PORT | `list/ListToolbar.tsx` | 1 |
| views/list/SavedViews.tsx | PORT | `list/SavedViews.tsx` | 5 |
| views/list/export-date-preset.ts | SHARE | used by `ExportDrawer.tsx` | 5 |
| views/list/export-default-columns.ts | SHARE | used by `ExportDrawer.tsx` | 5 |
| views/list/filters/ListFilterBar.tsx | PORT | `list/FilterBar.tsx` | 5 |
| views/list/filters/MultiSelectFilterPill.tsx | PORT | `list/FilterPill.tsx` | 5 |
| views/list/filters/list-filter-config.ts | SHARE | used by `FilterBar.tsx` | 5 |
| views/list/filters/list-filter-where.ts | SHARE | used by `FilterBar.tsx` | 5 |
| views/edit/CmsEditView.tsx | DROP | Dead | n/a |
| views/edit/EditChrome.tsx | DROP | Reachable only from dead code | n/a |
| views/edit/PublishMenu.tsx | DROP | Reachable only from dead code | n/a |
| views/versions/CmsVersionsView.tsx | DROP | Dead | n/a |
| pickers/MediaPicker.tsx | DROP | Dead | n/a |
| pickers/RelationshipPicker.tsx | DROP | Dead | n/a |
| ui/Combobox.tsx | DROP | Re-export only reachable from dead code | n/a |
| ui/ConfirmDialog.tsx | DROP | Dead re-export | n/a |
| ui/Dialog.tsx | RET | Studio imports `@cleanstart/ui` directly | 7 |
| ui/Drawer.tsx | DROP | Dead re-export | n/a |
| ui/Popover.tsx | RET | Studio imports `@cleanstart/ui` directly | 7 |
| ui/Spinner.tsx | RET | Studio imports `@cleanstart/ui` directly | 7 |
| ui/hooks/useAnchoredPosition.ts | DROP | Dead re-export | n/a |
| ui/hooks/useDismiss.ts | DROP | Dead re-export | n/a |
| ui/index.ts | DROP | Dead barrel | n/a |
| icons/Chevron.tsx | DROP | Phosphor icons | 1 |
| app/(payload)/layout.tsx | RET | Studio has its own root layout | 7 |
| app/(payload)/custom.scss + 45 partials | RET | `studio/styles/*` | 7 |

## §C Collections and globals

Who-writes values reflect decision D-6 (2026-10-16): authors create and edit their own drafts in five collections and may upload media; `research/workflows-and-roles.md` is the snapshot from before that decision.

Columns: **List** = list variant and chrome. **Edit** = edit specifics beyond the generic engine. **Who writes** = roles with create or update (from `research/workflows-and-roles.md` §1.6). **Test** = the e2e spec id in `apps/cms/tests/e2e/studio/`. **Ready** = ticked when the test passes and the UI review is signed off.

### C.1 Routed content (SEO22 rail, publish workflow)

| Collection | List | Edit | Who writes | Phase | Test | Ready |
|---|---|---|---|---|---|---|
| blogs | default columns; filters | rich text body, FAQ array + bulk paste + FAQ row label, TOC rows (read only), CTA auto-pick ×2, journey mirror warning, schedule, preview, gate, SEO22 rail | admin, editor; author (own drafts, D-6) | 4 | `studio-blogs.spec.ts` | [ ] |
| news | default | rich text, SEO22, preview, gate | admin, editor; author (own drafts, D-6) | 4 | `studio-news.spec.ts` | [ ] |
| guides | default | rich text, FAQ (+ bulk paste), TOC, 4 arrays, SEO22, gate | admin, editor; author (own drafts, D-6) | 4 | `studio-guides.spec.ts` | [ ] |
| case-studies | default | rich text body, outcomes and glance arrays, 5 uploads, SEO22; no gate, no preview | admin, editor | 4 | `studio-case-studies.spec.ts` | [ ] |
| knowledgeBase | default | rich text, FAQ (+ bulk paste), TOC, SEO22, gate | admin, editor; author (own drafts, D-6) | 4 | `studio-knowledge-base.spec.ts` | [ ] |
| legalDocuments | default | rich text, SEO22 (no Advanced card), preview; unlimited versions | admin, editor, legal | 4 | `studio-legal.spec.ts` | [ ] |
| resources | default | rich text, gate-form label (required when gated), download fields, SEO22, gate | admin, editor; author (own drafts, D-6) | 4 | `studio-resources.spec.ts` | [ ] |
| events | default | rich text, registration mode (internal or external) conditions, date min/max, SEO22, gate | admin, editor, events | 4 | `studio-events.spec.ts` | [ ] |
| webinars | default | rich text, registration mode conditions, SEO22, gate | admin, editor, events | 4 | `studio-webinars.spec.ts` | [ ] |
| podcastEpisodes | default | blocks, uploads, SEO22, preview; no gate | admin, editor, events | 4 | `studio-podcast.spec.ts` | [ ] |
| jobs | default | rich text, applications join (read only), conditions, SEO22, gate | admin, editor, hr | 4 | `studio-jobs.spec.ts` | [ ] |
| pages | default | page builder `layout` blocks (19 block types, Section nests), `parent` (editable relationship with the server's cycle check), `path` and breadcrumbs (read only), SEO22, gate; no purge | admin, editor | 4 | `studio-pages.spec.ts` | [ ] |

### C.2 People, media and taxonomies

| Collection | List | Edit | Who writes | Phase | Test | Ready |
|---|---|---|---|---|---|---|
| authors | default | rich text `bioLong`, 6 arrays, credibility panel, legacy bio viewer, SEO22, purge | admin, editor | 2 (form), 4 (rail) | `studio-authors.spec.ts` | [ ] |
| aboutGalleries | default | upload array | admin, editor | 2 | `studio-about-galleries.spec.ts` | [ ] |
| media | library (S-20) | media detail (S-21) | create: admin, editor, events, and authors after D-6; update: admin, editor, and events on `web/event` and `web/webinar` folders only; delete: admin, editor; rename: admin, editor (`09` §2.4, §2.5) | 2 | `studio-media.spec.ts` | [ ] |
| emailAssets | library | media detail, PNG/JPEG/GIF only | admin | 2 | `studio-email-assets.spec.ts` | [ ] |
| categories | default | parent (cycle guard on server), SEO22 | admin, editor | 2 (form), 4 (rail) | `studio-taxonomies.spec.ts` | [ ] |
| newsCategories | default | as categories | admin, editor | 2, 4 | `studio-taxonomies.spec.ts` | [ ] |
| knowledgeCategories | default | as categories (hierarchical parent) | admin, editor | 2, 4 | `studio-taxonomies.spec.ts` | [ ] |
| industries | default | as categories | admin, editor | 2, 4 | `studio-taxonomies.spec.ts` | [ ] |
| resourceTypes | default | as categories | admin, editor | 2, 4 | `studio-taxonomies.spec.ts` | [ ] |
| departments | default | as categories | admin, editor, hr | 2, 4 | `studio-taxonomies.spec.ts` | [ ] |
| regions | default | as categories | admin, editor | 2, 4 | `studio-taxonomies.spec.ts` | [ ] |
| pressTypes | default | as categories | admin, editor | 2, 4 | `studio-taxonomies.spec.ts` | [ ] |
| webinarTypes | default | as categories | admin, editor, events | 2, 4 | `studio-taxonomies.spec.ts` | [ ] |
| jobLocations | default | 4 fields, slug | admin, editor, hr | 1 | `studio-job-locations.spec.ts` | [ ] |

### C.3 Marketing, recruiting, brand

| Collection | List | Edit | Who writes | Phase | Test | Ready |
|---|---|---|---|---|---|---|
| leads | S-30 (tabs, privacy drawer, export) | read-only detail, retry sync | create: admin; update: nobody | 5 | `studio-leads.spec.ts` | [ ] |
| forms | default | 4 arrays, rich text post-submit body, conditions, server coercion | read and create: admin, editor, events; update: admin, editor, and events on forms attached as a registration form; delete: admin, editor; five fields admin and editor only (`09` §2.5) | 3 | `studio-forms.spec.ts` | [ ] |
| partner-applications | export CSV | read only | nobody updates | 5 | `studio-applications.spec.ts` | [ ] |
| deal-registrations | default | read only | nobody updates | 5 | `studio-applications.spec.ts` | [ ] |
| career-applications | default | read only, resume link | nobody updates | 5 | `studio-applications.spec.ts` | [ ] |
| resumes | file list | private file, update meta | admin, editor, hr | 5 | `studio-applications.spec.ts` | [ ] |
| emailSignatures | default | rendered preview, phone fields; versions without drafts (S-13 applies, Save only) | admin, editor, hr | 5 | `studio-signatures.spec.ts` | [ ] |
| signatureTemplates | default | HTML code field + sandboxed preview, default flag | admin | 5 | `studio-signatures.spec.ts` | [ ] |

### C.4 SEO, settings and system

| Collection | List | Edit | Who writes | Phase | Test | Ready |
|---|---|---|---|---|---|---|
| redirects | staleness pill, import drawer | slug-change rows locked, `to` hidden for 410 | admin, editor | 1 (base), 5 | `studio-redirects.spec.ts` | [ ] |
| pageRegistry | sort by order, kind and override pills | schema manager tabs (S-34); no create | update: admin, editor, seo | 5 | `studio-page-registry.spec.ts` | [ ] |
| brokenLinks | status, source page cell | read only | delete: admin | 5 | `studio-broken-links.spec.ts` | [ ] |
| users | roles, status | roles and enabled (admin only), disable, reassign, API key | admin; self for own record | 5 | `studio-users.spec.ts` | [ ] |
| integrations | health | S-33 | admin | 5 | `studio-integrations.spec.ts` | [ ] |
| previewAudit | default | label and revoke only | admin, editor | 5 | `studio-system.spec.ts` | [ ] |
| searchLog | default | read only | admin | 5 | `studio-system.spec.ts` | [ ] |
| audit-log | default | read only | nobody | 5 | `studio-system.spec.ts` | [ ] |
| consentLog | default | read only | nobody | 5 | `studio-system.spec.ts` | [ ] |
| analyticsCache | default | read only json | admin | 5 | `studio-system.spec.ts` | [ ] |
| webhooks_dead_letter | default | read only | nobody | 5 | `studio-system.spec.ts` | [ ] |

### C.5 Globals

| Global | Edit | Who writes | Versions | Phase | Test | Ready |
|---|---|---|---|---|---|---|
| siteSettings | 5 fields | admin | yes (max 50) | 5 | `studio-globals.spec.ts` | [ ] |
| impactStats | array | admin, editor | no | 5 | `studio-globals.spec.ts` | [ ] |
| spotlights | 14 fields | admin, editor | no | 5 | `studio-globals.spec.ts` | [ ] |
| legal | 3 fields | admin | yes | 5 | `studio-globals.spec.ts` | [ ] |
| seoDefaults | 65 fields, 3 arrays, 2 uploads, global schema view, override editor, collapsible | admin | yes | 2 | `studio-seo-defaults.spec.ts` | [ ] |
| payload-jobs-stats | not shown | n/a | n/a | n/a | n/a | n/a |

### C.6 Payload internal collections (never shown)

`payload-kv`, `payload-jobs`, `payload-locked-documents`, `payload-preferences`, `payload-migrations`. Studio reads `payload-jobs` (schedules) and writes `payload-locked-documents` (locks) through the data layer only.

## §D Shared logic moved in Phase 1

| Module | From | To | Why |
|---|---|---|---|
| Field conditions (87 sites) | inline in collections, globals, `fields/*`, `blocks/*` | `apps/cms/src/payload/admin-logic/conditions.ts` | ADR-6: one source, client-safe |
| Pure validators (subset of 62) | inline | `apps/cms/src/payload/admin-logic/validators.ts` | ADR-6 |
| Async validators (slug collision and similar) | stay | stay in config, marked `serverOnly` by the schema builder | They need the database |

The Phase 0-1 plan Task 1.6 lists every condition site by file and line, generated from the source, and moves them with a test per module.
