# CleanStart CMS Audit — Admin UI (field renderers, list/edit/versions views, primitives, pickers, SEO, lexical editor, dashboard/nav, integrations, auth)

Scope: the custom CleanStart admin render layer under `apps/cms/src/payload/admin/components`. This is where runtime UI bugs (like the confirmed ColumnPicker `setActiveColumns` bug) live.

## Summary

| Area | Critical | High | Medium | Low | Info |
|---|---:|---:|---:|---:|---:|
| ui-field-renderers | 0 | 1 | 6 | 2 | 0 |
| ui-list-view | 0 | 1 | 5 | 3 | 0 |
| ui-edit-view | 0 | 0 | 4 | 4 | 2 |
| ui-primitives-pickers | 0 | 0 | 4 | 8 | 0 |
| ui-seo-suite | 0 | 0 | 2 | 7 | 1 |
| ui-lexical-editor | 0 | 0 | 3 | 8 | 0 |
| ui-dashboard-nav | 0 | 0 | 3 | 9 | 0 |
| ui-integrations | 0 | 0 | 4 | 3 | 0 |
| ui-auth-misc | 0 | 1 | 3 | 8 | 0 |
| **Total** | **0** | **4** | **34** | **52** | **3** |

---

## ui-field-renderers

> The twenty custom field components are architecturally sound: all @payloadcms/ui imports are data-layer hooks (useField, useForm, RowLabelProvider) or allowlisted transitional items (RenderFields), with no forbidden render-side imports. The core value/setValue/showError pattern is correctly applied across all leaf fields. However, there are several concrete runtime and logic problems: the SelectField renders a blank control in single-select read-only mode; the CodeField uses a div as a label target which breaks click-to-focus and is an accessibility violation; the JsonField's local text state goes stale when Payload externally resets the field value; the BlocksField makes the entire row draggable (a regression of the same bug explicitly fixed in ArrayField); all fields ignore the disabled return from useField so form-level disabling is never reflected; and the TabsField passes incorrect parentSchemaPath and permissions to RenderFields for named tabs, potentially misrouting field-level permissions.

Counts: 0 critical · 1 high · 6 medium · 2 low · 0 info

### [HIGH] SelectField: single-select read-only renders blank — current value invisible (confidence: high · effort: trivial · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/fields/SelectField.tsx:149`  **Category:** runtime-bug
- **Problem:** When readOnly=true and hasMany=false, the combobox input is conditionally hidden but no static display of the selected value is rendered. The hasMany path renders visible tag spans even when readOnly, but single-select shows nothing. An editor opening a read-only document cannot see the field value at all.
- **Evidence:**

```
{!readOnly && (<input ... value={...} .../>)} with no else-branch for the single-select read-only case. hasMany tags (line 128–146) render regardless of readOnly, single-select does not.
```

- **Fix:** Add an else branch: `<span className="cs-collections-select__input cs-collections-select__input--readonly">{isEmpty ? <em>No selection</em> : labelFor(selected[0])}</span>` matching the pattern already used in RelationshipField line 671–673. [verifier note: Severity high is appropriate but I'd lean toward the lower end of high / upper medium: it's a real, currently-reachable data-visibility defect (Redirects `source` field is blank for every redirect doc in admin), but it's display-only — no data corruption, no crash, and the value is still persisted/functional. The recommended fix is correct and matches the existing RelationshipField pattern verbatim. Minor refinement to match the codebase's TS-strict style (as at line 163): use `labelFor(selected[0] as string)` for the non-empty branch, e.g. `<span className=\"cs-collections-select__input cs-collections-select__input--readonly\">{isEmpty ? <em>No selection</em> : labelFor(selected[0] as string)}</span>`, placed as an else to the `{!readOnly && (<input .../>)}` block at line 149. Separately (out of scope for this finding but worth flagging): the component reads only `field.admin?.readOnly` and ignores the top-level `readOnly` prop that ClientFieldBase/ClientComponentProps exposes (Field.d.ts line 21), so dynamically-computed read-only states from field access control alone may not be honored at all — a related but distinct gap.]

### [MEDIUM] JsonField: local text state goes permanently stale after external value reset (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/fields/JsonField.tsx:45`  **Category:** logic-bug
- **Problem:** The textarea display value is driven by local text state initialized once from value via a lazy useState initializer with no synchronization effect. When Payload externally resets or changes the field value (locale switch, doc navigation without unmount, form reset, autosave merge), value changes but text is never updated. The editor sees stale JSON.
- **Evidence:**

```
const [text, setText] = useState<string>(() => stringify(value)); — no useEffect syncing text when value changes externally.
```

- **Fix:** Add `const hasFocusRef = useRef(false); useEffect(() => { if (!hasFocusRef.current) setText(stringify(value)); }, [value]);` and set hasFocusRef.current in onFocus/onBlur. [verifier note: Finding is real and correctly diagnosed. I'd put severity at medium rather than high: it's a genuine data-correctness/UX bug (editor can see and then unknowingly re-commit stale JSON, clobbering an external change), but it only bites on the less-common external-reset paths (locale switch, version restore, leave-and-restore, autosave merge), not on the normal type-and-save flow, and only on json-type fields which are mostly config/internal collections. On the fix: the recommended hasFocusRef+useEffect is directionally correct but coarser than ideal. Focus-gating misses the case where the value is reset while the field is focused-but-untouched, and it doesn't distinguish an internal commit from an external reset. The cleaner approach mirrors Payload's stock field: keep a ref of the last-rendered string and a flag of whether the last change was internal (onChange/onBlur) vs external (form state); in a useEffect keyed on [value, path], if the change was external and the stringified value differs from the ref, setText(stringify(value)) and update the ref. Also reset parseError on external sync. Keying on path additionally covers the doc-navigation-without-unmount case the focus-only fix could miss.]

### [MEDIUM] BlocksField: entire row is draggable — Remove button clicks trigger drag instead of removal (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/fields/BlocksField.tsx:116`  **Category:** logic-bug
- **Problem:** The li element has draggable={!isDisabled} and all four drag handlers spread on it including onDragStart. Clicking the Remove button inside the row header can be intercepted by the browser as a drag gesture. ArrayField has an explicit comment (lines 289-293) explaining why this approach was abandoned — only the drag handle span should be draggable. BlocksField did not receive the same fix.
- **Evidence:**

```
<li ... draggable={!isDisabled} {...handlers}> where handlers includes onDragStart/onDragEnd. ArrayField uses <span className="cs-array__row-handle" draggable onDragStart={...} onDragEnd={...}> exclusively.
```

- **Fix:** Remove draggable and {...handlers} from the li. Add a dedicated drag-handle span inside the row header with draggable onDragStart={handlers.onDragStart} onDragEnd={handlers.onDragEnd}. Keep onDragOver, onDragLeave, onDrop on the li as drop-target handlers. [verifier note: All factual claims in the finding are accurate. I downgrade severity from high to medium: a clean click (mousedown+mouseup without movement) on the Remove button still fires onClick in all browsers, so the breakage is intermittent — it manifests when the pointer micro-moves between mousedown and mouseup (the "un-focused/empty row" case the ArrayField comment describes), not on every click. The ConfirmDialog also gives a second, non-draggable click target as a partial backstop. It is a real, reachable, UX-degrading interaction bug with documented in-repo precedent, but not a hard 100% block on removal. Fix correction: the recommendation is correct but slightly overstated. The existing `<div className="cs-blocks__row-handle" aria-hidden="true">` (line 120) already exists as the visual handle — rather than adding a new span, convert that div to `draggable onDragStart={handlers.onDragStart} onDragEnd={handlers.onDragEnd}` (matching ArrayField's `cs-array__row-handle` pattern), keep onDragOver/onDragLeave/onDrop on the <li>, and remove `draggable={!isDisabled}` and the `{...handlers}` spread from the <li>. Also worth mirroring ArrayField's `e.stopPropagation()` on the remove button's onClick for parity. Note the handle is currently aria-hidden with no readOnly guard — when made draggable it should also be suppressed under isDisabled, consistent with ArrayField rendering a static index instead of a handle in the readOnly branch.]

### [MEDIUM] TabsField: parentSchemaPath for named tabs missing the tab name segment — permissions routing broken (confidence: high · effort: trivial · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/fields/TabsField.tsx:85`  **Category:** logic-bug
- **Problem:** The custom TabsField correctly appends t.name to childPath (the parentPath passed to RenderFields) for named tabs, but passes parentSchemaPath={schemaPath ?? ''} unchanged. Payload's own TabsField calls getFieldPaths which produces schemaPath: parentSchemaPath + '.' + field.name for named tabs. Without the tab name in schemaPath, field-level permissions inside named tabs are resolved against the wrong schema node.
- **Evidence:**

```
Line 85: const childPath = t.name ? `${path ? `${path}.` : ''}${t.name}` : path (path updated). Line 98: parentSchemaPath={schemaPath ?? ''} (schema path NOT updated). Verified against @payloadcms/ui/dist/fields/Tabs/index.js:328.
```

- **Fix:** Compute `const childSchemaPath = t.name ? `${schemaPath ? `${schemaPath}.` : ''}${t.name}` : (schemaPath ?? '');` and pass parentSchemaPath={childSchemaPath} to RenderFields. [verifier note: The code defect is genuine and the fix is correct, but I downgraded severity high -> medium because the path is not currently reachable: no tabs field (named or unnamed) exists anywhere in the live schema, and named tabs are a less-common Payload pattern. It is a latent logic bug, not a live break. Two corrections to the finding text: (1) installed @payloadcms/ui is 3.84.1, not 3.81 — behavior is identical so this does not change the verdict; (2) the component also passes a pre-sliced `permissions` prop (lines 100-103), so the immediate field-permissions lookup for named-tab children is partially mitigated; the real ongoing damage from the wrong schemaPath is field-config / custom-component / condition resolution inside RenderFields rather than permissions alone. The recommended fix is accurate and matches Payload's getFieldPaths semantics for the named-tab case.]

### [MEDIUM] CodeField: label htmlFor targets a div, not a focusable element — click-to-focus broken (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/fields/CodeField.tsx:125`  **Category:** accessibility
- **Problem:** The label's htmlFor={inputId} references the div that hosts the CodeMirror instance. A div is not a labelable element; clicking the label does not focus the editor, and assistive technologies cannot associate the label with a control.
- **Evidence:**

```
<label ... htmlFor={inputId}> at line 125 targets <div id={inputId} ref={hostRef} ...> at line 134. A div is not a labelable element per HTML spec.
```

- **Fix:** Remove htmlFor from the label and add aria-labelledby on the editor host div, or add a visually-hidden focusable button that delegates focus to view.focus().

### [MEDIUM] All leaf fields ignore disabled from useField — form-level disabling never reflected (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/fields/TextField.tsx:22`  **Category:** logic-bug
- **Problem:** useField returns disabled: boolean which reflects form conditions, form processing state, and conditional logic. None of the leaf field components (TextField, TextareaField, EmailField, NumberField, DateField, RadioField, PointField, CodeField) destructure or consume this value. During form submission or when a condition disables the field, the input remains fully interactive.
- **Evidence:**

```
All leaf fields: const { value, setValue, showError, errorMessage } = useField<...>({ path }) with disabled never destructured. FieldType definition at @payloadcms/ui/dist/forms/useField/types.d.ts:32 declares disabled: boolean.
```

- **Fix:** Destructure disabled from useField in each leaf field component and merge: `const isDisabled = disabled || field.admin?.readOnly === true;` then pass isDisabled to the input.

### [MEDIUM] TabsField: permissions resolution ignores tab name for named tabs — tab-level permissions bypassed (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/fields/TabsField.tsx:99`  **Category:** logic-bug
- **Problem:** All tabs receive permissions derived from permissions?.fields without considering the tab name. For named tabs, Payload resolves permissions as permissions[tabName].fields. The custom component always uses the flat .fields entry, so fields inside a named tab appear permitted even when the tab-level permissions say otherwise.
- **Evidence:**

```
Lines 99-102: ((permissions as { fields?: unknown })?.fields ...) ?? {} for all tabs. Payload's own impl (@payloadcms/ui/dist/fields/Tabs/index.js:276) uses permissions[activeTabConfig.name]?.fields for named tabs.
```

- **Fix:** For named tabs resolve: `const tabPermissions = t.name && permissions && typeof permissions === 'object' ? (permissions as Record<string, unknown>)[t.name] : permissions;` then extract fieldPerms from tabPermissions.fields.

### [MEDIUM] NumberField: step hardcoded to 1 — decimal number fields use wrong increment (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/fields/NumberField.tsx:31`  **Category:** under-implemented
- **Problem:** The step value is hardcoded as const step = 1, ignoring field.admin?.step. For any decimal-precision number field (currency, percentages, scores), the stepper buttons and native browser spin arrows increment by 1 instead of the configured step.
- **Evidence:**

```
const step = 1; at line 31 — no reference to field configuration.
```

- **Fix:** Replace with `const step = typeof (field.admin as { step?: unknown })?.step === 'number' ? (field.admin as { step?: number }).step! : 1;`

### [MEDIUM] NumberField: hasMany not supported — arrays of numbers silently overwritten with scalar on edit (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/fields/NumberField.tsx:19`  **Category:** under-implemented
- **Problem:** Payload's NumberField supports hasMany: true which stores an array of numbers. The custom component always calls setValue with a scalar. If a hasMany number field uses this renderer, the stored array is overwritten with a single number on the user's first edit.
- **Evidence:**

```
No field.hasMany check anywhere in the file. setValue(parsed) on line 41 always sets a scalar regardless of stored shape.
```

- **Fix:** Check field.hasMany and either implement a multi-value tag-input pattern or render a fallback. At minimum add a visible warning so the absence is not silent data corruption.

### [LOW] RelationshipField: function-valued filterOptions produces garbage query parameters (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/fields/RelationshipField.tsx:286`  **Category:** type-safety
- **Problem:** filterOptions is cast as Record<string, unknown> without checking whether it is a function. Payload 3 allows filterOptions to be a function. If a function is passed, Object.entries(filter) iterates over function properties and appends them as URL parameters, producing a malformed fetch with no filtering applied.
- **Evidence:**

```
const filter = (field as { filterOptions?: Record<string, unknown> }).filterOptions; — no function type guard before use in fetchSearch.
```

- **Fix:** Guard: `const filter = typeof field.filterOptions === 'object' && field.filterOptions !== null ? (field.filterOptions as Record<string, unknown>) : undefined;`

### [LOW] CheckboxField: uses HTML disabled instead of readOnly semantics — incorrect a11y announcement (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/fields/CheckboxField.tsx:49`  **Category:** accessibility
- **Problem:** The checkbox uses disabled={readOnly} to prevent changes. Disabled and read-only carry different semantics: disabled signals 'not applicable', read-only signals 'fixed but meaningful'. Screen readers announce disabled controls as unavailable. HTML checkboxes do not support the readOnly attribute natively, but aria-readonly plus an onClick guard is the correct pattern for read-only state.
- **Evidence:**

```
<input type="checkbox" ... disabled={readOnly} /> where other fields (TextField, TextareaField) correctly set both readOnly and aria-readonly.
```

- **Fix:** Replace disabled={readOnly} with: `onClick={readOnly ? (e) => e.preventDefault() : undefined} aria-readonly={readOnly || undefined}` and apply a CSS modifier class for visual graying.

---

## ui-list-view

> The custom list view layer has two confirmed critical runtime bugs that prevent core functionality from working: the ColumnPicker throws on every toggle because TableColumnsProvider is never mounted in the tree, and the bulk-delete call sends an unparseable 'in' parameter format that Payload's query parser cannot match to real documents. Several medium-severity issues compound the situation: hardcoded admin route in the Edit Many URL, no error handling after delete, missing 'search' capture/restore in saved views, and two render-side @payloadcms/ui component imports that violate the explicit project rule. The cell helpers (DateCell, BytesCell, RelationshipCell) are individually clean.

Counts: 0 critical · 1 high · 5 medium · 3 low · 0 info

### [HIGH] ColumnPicker: setActiveColumns is not a function (TableColumnsProvider never mounted) (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/views/list/ColumnPicker.tsx:19`  **Category:** runtime-bug
- **Problem:** ColumnPicker calls `const { setActiveColumns } = useTableColumns()`. The TableColumnContext default value is `{}` (confirmed in @payloadcms/ui@3.84.1 dist/providers/TableColumns/context.js). TableColumnsProvider is only ever mounted inside DefaultListView — but CmsListView replaces DefaultListView entirely, and Payload's RSC list pipeline wraps the custom component only in ListQueryProvider. No TableColumnsProvider exists anywhere above CmsListView. So useTableColumns() returns `{}`, setActiveColumns is `undefined`, and every checkbox change throws 'TypeError: setActiveColumns is not a function'.
- **Evidence:**

```
TableColumnContext default: createContext({}). RSC pipeline: ListQueryProvider > RenderServerComponent(CmsListView) — no TableColumnsProvider. DefaultListView wraps content in <TableColumnsProvider> which is skipped entirely when a custom view component is used.
```

- **Fix:** Mount TableColumnsProvider inside CmsListView, wrapping the main content div: `<TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}><div className='cs-list'>…</div></TableColumnsProvider>`. Then in ColumnPicker, switch from setActiveColumns to `toggleColumn(col.accessor)` which is the correct API for a per-column toggle — setActiveColumns only activates columns but never deactivates them. [verifier note: The bug, the runtime symptom, and the fix are all correct. (1) Severity: I'd rate this HIGH rather than CRITICAL. It is a guaranteed, 100%-reproducible runtime TypeError, but the blast radius is confined to the column-visibility feature in the admin UI (the Columns drawer). It does not crash the list view itself (the error fires only on checkbox change, inside an onChange handler), does not affect data integrity, public site, or non-admin users, and has a trivial workaround (don't use the column picker). Admin-only, single-feature breakage = high, not critical. (2) The recommended fix is correct and I'd adopt both halves: Mount `TableColumnsProvider` inside CmsListView wrapping the content (it needs `collectionSlug` and `columnState`, both already available as props). Switch ColumnPicker from `setActiveColumns(next)` to `toggleColumn(col.accessor)` — confirmed in the 3.84.1 source, setActiveColumns cannot deactivate a column (it only strips leading '-'), so even with the provider mounted the current activate/deactivate logic would only ever turn columns ON, never off — a second latent bug. toggleColumn handles both directions. Allow-list caveat: `TableColumnsProvider` is a provider (context, not chrome) — functionally equivalent to the already-used SelectionProvider/ListQueryProvider — so it fits the data-layer category, but the team should add it to the allow-list when applying the fix so the Wave 8 ESLint rule doesn't flag it.]

### [MEDIUM] BulkActionBar: delete errors are swallowed — no user feedback and page reloads on failure (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/views/list/BulkActionBar.tsx:52-62`  **Category:** error-handling
- **Problem:** onDeleteConfirm awaits callBulkDelete, which never checks `res.ok`. If the server returns 4xx or 5xx (permission denied, partial failure, server error), the function returns normally, toggleAll(false) is called, and window.location.reload() fires — leaving the user with no indication that anything went wrong. Payload's own DeleteMany reads `json.errors` and calls `toast.error()` for each failure.
- **Evidence:**

```
callBulkDelete: await fetch(url, {...}) — no if (!res.ok) throw. onDeleteConfirm: no catch block around callBulkDelete; the finally block always clears state and the outer try always calls reload.
```

- **Fix:** In callBulkDelete, read the response JSON and return it. In onDeleteConfirm, check `result.errors.length`; if non-zero, surface them via the app's toast bus instead of reloading. Only reload on full success. [verifier note: Severity corrected from high to medium. This is an admin-only UI in a tool gated behind authenticated editor access. The worst outcome is misleading feedback on a partial/failed bulk delete (user believes N rows deleted when N-k were) — not data loss or corruption; the failed rows simply remain, and the forced window.location.reload() repaints the list so the true post-delete state is immediately visible to the user. That recoverability and the admin-only blast radius keep it below "high". Correction to the recommended fix: do NOT assume `result.errors` always exists or has a uniform shape. Payload returns `{ docs, errors }` on a 200 partial-failure, but a hard 4xx/5xx body is a different shape (`{ errors: [{ message }] }`) and may not be JSON at all. The fix should: (1) check `res.ok` and surface a generic error toast on hard failure (guarding res.json() in a try/catch for non-JSON bodies), and (2) separately inspect `json.errors?.length` on a 200 for partial failures, surfacing per-row errors. Only call window.location.reload() when both res.ok is true and there are zero per-row errors. Use the existing @cleanstart/ui Toast bus rather than Payload's render-side toast (the latter is on the forbidden @payloadcms/ui render-export list per CLAUDE.md).]

### [MEDIUM] SavedViews: 'search' is never saved or restored; 'columns' field in the type is dead code (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/list/SavedViews.tsx:96-115`  **Category:** under-implemented
- **Problem:** The JSDoc on SavedViews.tsx (line 28) says 'Saving captures the current query', but the onSave handler only captures `query.where`, `query.sort`, and `query.limit` — it never reads `query.search`. Similarly, when restoring a view (onSelect, line 68-75), only `where`, `sort`, and `limit` are passed to refineListData. Additionally, SavedView type in saved-views.ts declares `columns?: ReadonlyArray<string>` but no code ever writes this field during save or reads it during restore.
- **Evidence:**

```
SavedViews.tsx onSave (lines 96-101): query.where, query.sort, query.limit only. No query.search. onSelect (lines 68-75): v.where, v.sort, v.limit only. saved-views.ts line 16: readonly columns?: ReadonlyArray<string> — zero usages in SavedViews.tsx.
```

- **Fix:** In the SavedView type, add `readonly search?: string`. In onSave, capture `...(query.search ? { search: query.search } : {})`. In onSelect, pass `...(v.search !== undefined ? { search: v.search } : {})` to refineListData. Either remove the `columns` field or implement it: on save call `refineListData({ columns: currentColumnState })` and on restore pass `columns: v.columns`.

### [MEDIUM] CmsListView: Gutter, PageControls, SelectionProvider imported as render components from @payloadcms/ui (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/list/CmsListView.tsx:17-21`  **Category:** convention-violation
- **Problem:** CLAUDE.md and the codebase rule explicitly forbid render-side imports from @payloadcms/ui: 'Forbidden: render-side exports (any component, including Button, Drawer, Modal, Pill, Pagination, etc.)'. CmsListView imports and uses three render components from @payloadcms/ui: Gutter (a React.FC wrapping a div with Payload CSS), PageControls (a React.FC rendering pagination), and SelectionProvider (a React.FC providing context). The allowed list in CLAUDE.md only permits hooks. ESLint Wave 8 will flip this from warn to error, at which point the build will fail.
- **Evidence:**

```
CmsListView.tsx lines 17-21: import { Gutter, PageControls, SelectionProvider, useConfig, useListQuery, useStepNav } from '@payloadcms/ui'. Gutter, PageControls, SelectionProvider are React.FC components, not hooks.
```

- **Fix:** Replace Gutter with a plain `<div className='gutter'>` or a @cleanstart/ui wrapper. Replace PageControls with a custom pagination component consuming the data from useListQuery(). Replace SelectionProvider with a re-export or copy from @cleanstart/ui, or keep it but annotate as an accepted exception with a tracker comment — however it should ideally be moved to @cleanstart/ui.

### [MEDIUM] ListHeader + SavedViews: aria-expanded missing on menu trigger buttons (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/list/ListHeader.tsx:74-87`  **Category:** accessibility
- **Problem:** The kebab-menu trigger button has aria-haspopup='menu' but no aria-expanded attribute. The ARIA specification requires that a button controlling a menu widget set aria-expanded='true' when the menu is open and aria-expanded='false' (or omit) when closed — screen readers use this to announce menu state. The same issue exists on the SavedViews trigger button (SavedViews.tsx line 120-130). CmsListView holds the menuOpen state but does not pass it to ListHeader, and SavedViews holds its own open state but doesn't set aria-expanded.
- **Evidence:**

```
ListHeader.tsx line 79: aria-haspopup='menu' — no aria-expanded. SavedViews.tsx line 125: aria-haspopup='menu' — no aria-expanded. The open state for the kebab menu lives in CmsListView (menuOpen) but is not threaded down as a prop to ListHeader.
```

- **Fix:** Add `open?: boolean` prop to ListHeader Props type, pass `menuOpen` from CmsListView, and add `aria-expanded={open}` to the button. In SavedViews, add `aria-expanded={open}` to the trigger button binding it to the local `open` state.

### [MEDIUM] ListCellEnhancer: bool-cell loop lacks the 'data-cs-enhanced' guard — runs on every DOM mutation (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/ListCellEnhancer.tsx:95-101`  **Category:** performance
- **Problem:** The filesize and date-cell loops each check `cell.getAttribute(ATTR) === '1'` before processing and set the attribute after, making them idempotent. The bool-cell loop (lines 95-101) has no guard: it queries all `.bool-cell` elements and sets `data-bool` on every invocation. Since setting an attribute IS a DOM mutation, this makes the enhance() function fully re-run the bool-cell pass on every unrelated DOM change across the entire document.body. On a large list with many rows this executes O(rows) work per any DOM event.
- **Evidence:**

```
Lines 95-100: for (const cell of document.querySelectorAll('.bool-cell')) { ... cell.setAttribute('data-bool', ...) } — no if (cell.getAttribute(ATTR) === '1') continue guard, no cell.setAttribute(ATTR, '1') at the end.
```

- **Fix:** Add the same guard used for the other loops: check `cell.getAttribute(ATTR) === '1'` at the top of the bool-cell loop body, and call `cell.setAttribute(ATTR, '1')` after setting data-bool.

### [LOW] BulkActionBar: 'Edit many' URL hardcodes /admin instead of using the configured admin route (confidence: high · effort: trivial · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/views/list/BulkActionBar.tsx:85`  **Category:** logic-bug
- **Problem:** The Edit button builds its URL as `new URL('/admin/collections/${collectionSlug}', window.location.origin)`. If the admin route is ever changed from the default '/admin' (via payload.config.ts `routes.admin`), this hard-coded path will break silently — the user is navigated to a 404. CmsListView already reads `config.routes.admin as string` from useConfig() and passes it into the step-nav effect; the same value must be used here.
- **Evidence:**

```
CmsListView line 72: const adminRoute = config.routes.admin as string; — used for breadcrumb. BulkActionBar does not receive or use this value; it hard-codes '/admin' on line 85.
```

- **Fix:** Pass `adminRoute` as a prop from CmsListView down to BulkActionBar, or call `useConfig()` inside BulkActionBar and use `config.routes.admin`. [verifier note: Severity downgraded from high to low. The bug is genuine but latent: `routes.admin` is not overridden in apps/cms/src/payload.config.ts (defaults to `/admin`), so the hardcoded path is currently correct and no user hits a 404 in normal operation. It only manifests if someone customizes `routes.admin` — which the project has no plan to do. It is a maintainability/consistency issue, not a high-severity logic bug reachable today. Fix correction: the cleanest fix does NOT require a new prop. BulkActionBar already calls `useConfig()` (line 40) and already reads `config.routes?.api ?? '/api'` (line 41). Mirror that exact pattern: replace line 84-86 with `const url = new URL(`${config.routes?.admin ?? '/admin'}/collections/${collectionSlug}`, window.location.origin);`. Use the optional-chain + default form to stay consistent with the existing line-41 pattern in the same file. Passing a prop down is unnecessary indirection here.]

### [LOW] ListHeader: debounce timeout not cancelled on unmount (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/list/ListHeader.tsx:46-53`  **Category:** logic-bug
- **Problem:** The onChange handler arms a 250 ms debounce via `debounceRef.current = window.setTimeout(...)` and correctly clears the previous timeout before arming a new one. However there is no useEffect cleanup that clears the outstanding timeout when the component unmounts. If the user types in the search input and then immediately navigates away (e.g. clicking a row), the 250 ms timer fires after unmount, calls `handleSearchChange(next)` which drives `refineListData`, which may mutate URL search params or shared context state after the list view is gone.
- **Evidence:**

```
ListHeader.tsx line 38: const debounceRef = useRef<number | null>(null). Lines 50-53: debounceRef.current = window.setTimeout(...). There is no return () => { if (debounceRef.current != null) window.clearTimeout(debounceRef.current) } in any useEffect.
```

- **Fix:** Add a useEffect with an empty deps array that returns a cleanup function: `useEffect(() => () => { if (debounceRef.current != null) window.clearTimeout(debounceRef.current); }, []);`

### [LOW] SavedViews: persistSavedViews patches a custom 'preferences' field on the user document rather than using Payload's preferences API (confidence: medium · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/admin/lib/saved-views.ts:53-78`  **Category:** convention-violation
- **Problem:** persistSavedViews PATCHes `/api/users/{id}` with `{ preferences: { savedViews: {...} } }`. This works because the Users collection has a `preferences: { type: 'json' }` field. However Payload ships a first-class preferences system (`/api/payload-preferences`) with a `usePreferences()` hook that handles race-condition merging, per-user keying, and auth. The custom approach means the PATCH goes through the full Users update pipeline on every view save, and reads back through useAuth().user which is only refreshed on login — so a saved view persisted in one tab won't be visible in another tab until auth refreshes.
- **Evidence:**

```
saved-views.ts line 73: fetch('${PATCH_ENDPOINT}/${userId}', { method: 'PATCH', body: JSON.stringify({ preferences: {...} }) }). @payloadcms/ui dist/providers/Preferences/index.js: uses /api/payload-preferences/${key} with POST/GET. SavedViews.tsx reads via useAuth().user.preferences which is a snapshot from login time.
```

- **Fix:** Migrate to `usePreferences().setPreference('savedViews', allSavedViews)` and `usePreferences().getPreference('savedViews')`. Remove the `preferences` JSON field from the Users collection (or keep it for backward compatibility but stop writing to it). This also eliminates the need for the unsafe `as unknown as { preferences?: unknown }` casts throughout SavedViews.tsx.

---

## ui-edit-view

> The core publish flow (CmsPublishButton, PublishChecklistBanner, PublishOverrideGuard, SlugRequirementGuard, SaveShortcut, SchedulePublishDialog) is largely solid and the hook APIs are used correctly against Payload 3.84's actual type signatures. The most serious structural problem is that wireCustomEditView is a documented no-op, making CmsEditView, EditChrome, PublishMenu, and CmsVersionsView entirely dead code that consumes maintenance budget without ever rendering. The live components have two notable bugs: DocKebabExtras imports a render component (PopupList) directly from @payloadcms/ui in direct violation of the project's stated convention, and SchedulePublishDialog is registered as a global action component (uncontrolled) while CmsPublishButton simultaneously renders a second controlled instance — allowing both dialogs to be open at once. Type safety has one significant cast-chain in the schedule submit path. Everything else is either intentional design choice or minor polish.

Counts: 0 critical · 0 high · 4 medium · 4 low · 2 info

### [MEDIUM] CmsEditView, EditChrome, PublishMenu, CmsVersionsView are entirely dead code (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/lib/wire-custom-edit-view.ts:20`  **Category:** dead-code
- **Problem:** wireCustomEditView is an explicit no-op passthrough — it returns `entity` unchanged. It is called on every collection and global in payload.config.ts (lines 301, 305), but because it injects nothing, CmsEditView and CmsVersionsView are never registered as custom views. EditChrome is only imported by CmsEditView and CmsVersionsView; PublishMenu is only imported by CmsEditView. All four components and the stale comment in doc-status-bar-mount.ts line 41 are orphaned. The stale wave-4 comment block in _editor.scss also references this dead view shell.
- **Evidence:**

```
export const wireCustomEditView = <T extends CollectionConfig | GlobalConfig>(entity: T): T => entity;
```

- **Fix:** Either delete wireCustomEditView, CmsEditView, EditChrome, PublishMenu, and CmsVersionsView entirely (they are superseded by docStatusBarEditConfig + Payload's stock view), or implement the deferred wave that actually registers CmsEditView. Update the stale comment in doc-status-bar-mount.ts. Update _editor.scss references. [verifier note: The finding is technically accurate in full, including the line numbers, the no-op evidence, the orphaned-import graph, the stale doc-status-bar-mount.ts:41 comment, and the stale _editor.scss Wave 4 comment block. I would downgrade severity from high to medium: this is pure dead code with no correctness, security, or runtime impact. The legitimate cost is maintenance/confusion surface — notably the misleading comment that actively points future contributors to PublishMenu when the live path is CmsPublishButton. On the recommendation: the docblock in wire-custom-edit-view.ts:3-19 documents a deliberate architectural reason the full custom edit view was reverted (the <Form>/OperationProvider orchestration is non-trivial to rebuild). So before deleting, confirm with the team whether the "deferred wave" is truly abandoned vs. parked intentionally — if abandoned, delete all four components + the cs-edit* SCSS block + fix the doc-status-bar-mount.ts:41 comment; note wireCustomEditView itself is harmless to keep as a stamp seam but is equally safe to remove from the two .map() chains in payload.config.ts. Either way, deleting these has zero runtime behavior change since they are never registered.]

### [MEDIUM] DocKebabExtras imports PopupList — a render-side component from @payloadcms/ui (convention violation) (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/DocKebabExtras.tsx:6`  **Category:** convention-violation
- **Problem:** CLAUDE.md states that @payloadcms/ui is data-layer-only and that any render-side import (component) is forbidden. PopupList is a render component exported from @payloadcms/ui. DocKebabExtras imports it to render PopupList.Button for 'Discard changes', 'Versions', and 'API URL' menu items. This breaks the pinned-major / no-UI-upgrade contract and will fail the ESLint rule when Wave 8 flips it to error.
- **Evidence:**

```
import { PopupList, useConfig, useDocumentInfo, useForm, useFormModified } from '@payloadcms/ui'; ... <PopupList.Button disabled={!modified || busy} onClick={...}>Discard changes</PopupList.Button>
```

- **Fix:** Replace PopupList.Button usages with @cleanstart/ui primitives (e.g. a plain <button> styled with existing CSS, or a DropdownMenuItem entry if the kebab is being rebuilt). PopupList.Button has a narrow API (active?, disabled?, href?, onClick?) that is easy to replicate without the @payloadcms/ui render dependency.

### [MEDIUM] Duplicate SchedulePublishDialog instances: global action component (uncontrolled) and CmsPublishButton (controlled) can both be open simultaneously (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload.config.ts:223`  **Category:** logic-bug
- **Problem:** SchedulePublishDialog is registered in admin.components.actions (payload.config.ts line 223) with no props, so it mounts in uncontrolled mode on every page. On edit views for schedule-enabled collections where the document has an id, CmsPublishButton also mounts a second controlled instance. Both are live simultaneously. The uncontrolled instance registers its own Cmd+Shift+S handler. Pressing Cmd+Shift+S while the controlled dialog is already open from the chevron menu opens a second dialog on top. Both have dismissOnBackdrop={false}, so neither closes via outside click.
- **Evidence:**

```
// In payload.config.ts actions array:
'./payload/admin/components/SchedulePublishDialog.tsx#SchedulePublishDialog'
// In CmsPublishButton.tsx line 168-172 (rendered when canSchedule=true):
<SchedulePublishDialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
```

- **Fix:** Remove SchedulePublishDialog from admin.components.actions. The keyboard shortcut (Cmd+Shift+S) should be wired inside CmsPublishButton's controlled dialog (guard: only open if !open, call setScheduleOpen(true)). This centralises the open-state in one owner and prevents the double-mount.

### [MEDIUM] schedulePublish called via `as unknown as` double-cast that bypasses TypeScript entirely (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SchedulePublishDialog.tsx:222`  **Category:** type-safety
- **Problem:** The onSubmit handler casts schedulePublish (type: SchedulePublishClient) to `unknown` then to `(a: Record<string, unknown>) => Promise<{ error?: string } | undefined>`. This forces the call through with a plain object instead of the typed SchedulePublishHandlerArgs shape, and asserts the return is `{ error?: string }` when the actual return is `Promise<unknown>`. If the server function's actual return shape ever changes or if a server error manifests differently, the check `if (result?.error)` silently swallows it. Line 245's `as { error?: string }` cast on onDelete has the same problem without the double-cast.
- **Evidence:**

```
const result = (await (
  schedulePublish as unknown as (a: Record<string, unknown>) => Promise<{ error?: string } | undefined>
)(args)) ?? undefined;
```

- **Fix:** Call schedulePublish directly with a properly typed args object matching SchedulePublishHandlerArgs (date: Date, type, timezone, doc?, global?) instead of Record<string, unknown>. For the return value, cast once from `unknown` with a type guard: `function isErrorResult(r: unknown): r is { error: string } { return typeof (r as any)?.error === 'string'; }`. This eliminates both the bypass cast and the silent-failure risk.

### [LOW] PublishChecklistBanner fetches checklist only once per mount — stale for existing documents after the editor fixes issues (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/PublishChecklistBanner.tsx:67`  **Category:** ux-question
- **Problem:** The useEffect depends on [load], and load's deps are [id, collectionSlug, config]. For an existing document, id never changes during the edit session. So the checklist is fetched exactly once on component mount. If an editor sees 'Slug is missing' in the banner, adds the slug, and clicks Publish, the banner still shows the old blocker until the page reloads. The comment says 'calls GET...on mount and whenever the document ID changes (after save)' which is inaccurate — the id doesn't change on save for existing docs.
- **Evidence:**

```
const load = useCallback(async () => { ... }, [id, collectionSlug, config]);
useEffect(() => { void load(); }, [load]);
```

- **Fix:** Add a listener for Payload's save events (or a custom 'cs-cms:save-success' CustomEvent dispatched from CmsPublishButton after a successful save) to re-fetch the checklist. Alternatively, use useFormModified() with a 3-second debounce to re-run the check when the form becomes clean after a save. At minimum, fix the JSDoc comment to accurately describe the actual reload behaviour.

### [LOW] SaveShortcut fallback selectors reference non-existent Payload 3.x CSS class .doc-controls__publish (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SaveShortcut.tsx:38`  **Category:** logic-bug
- **Problem:** SaveShortcut attempts document.getElementById('action-save') first (which succeeds on edit views because CmsPublishButton renders that id). The fallback selectors on lines 38-43 are only reached when #action-save is absent. One of those fallbacks is '.doc-controls__publish > button' which does not exist in Payload 3.84's CSS/DOM. This is dormant dead code in the fallback path but adds confusion and will never activate.
- **Evidence:**

```
const button =
  document.getElementById('action-save') ||
  document.querySelector<HTMLButtonElement>(
    '.doc-controls__publish > button, .doc-controls .btn--style-primary > button',
  ) || ...
```

- **Fix:** Remove the stale fallback selectors. Since the comment already states 'not on an edit view — let the browser handle it', the correct behaviour when #action-save is absent is to return early. Simplify to: `const button = document.getElementById('action-save'); if (!button) return;`

### [LOW] EditorFullscreenToggle MutationObserver fires probe() on every DOM mutation, including every keystroke in Lexical editor (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/EditorFullscreenToggle.tsx:57`  **Category:** performance
- **Problem:** The MutationObserver is attached to document.body with { childList: true, subtree: true }, triggering probe() — which calls querySelectorAll('.rich-text-lexical__wrap') — on every DOM change. In a Lexical-powered editor, typing produces continuous DOM mutations. While React's Object.is comparison prevents re-renders, the querySelectorAll calls and setState invocations still run on every keystroke for the lifetime of the edit view.
- **Evidence:**

```
const observer = new MutationObserver(probe);
observer.observe(document.body, { childList: true, subtree: true });
```

- **Fix:** Scope the observer to the form column container instead of document.body, and add a debounce (e.g. 200ms) before calling probe(). Alternatively, only re-observe when the set of `.rich-text-lexical__wrap` elements actually changes.

### [LOW] SavedStateIndicator runs a 500ms setInterval polling loop on every page in the admin, including list and dashboard views (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SavedStateIndicator.tsx:115`  **Category:** performance
- **Problem:** The route-detection effect starts a 500ms setInterval on mount and never suspends it on non-edit-view pages. The intent is to detect Next.js client-side navigation that doesn't fire popstate. While the per-tick work is cheap, the interval runs globally — including on list views, the dashboard, and the media library.
- **Evidence:**

```
const i = window.setInterval(detect, 500);
return () => { window.removeEventListener('popstate', detect); window.clearInterval(i); };
```

- **Fix:** Use Next.js router events or pathname from usePathname() to detect route changes without polling. If polling is necessary, increase to 2000ms and add a no-op guard: `if (matchEditPath(window.location.pathname) === editPath) return;` to skip redundant setState calls.

### [INFO] Stale comment in doc-status-bar-mount.ts misidentifies schedule entry point as 'PublishMenu' (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/doc-status-bar-mount.ts:41`  **Category:** dead-code
- **Problem:** The comment on line 41 says 'The schedule entry point lives in PublishMenu and routes to SchedulePublishDialog.' PublishMenu is in views/edit/PublishMenu.tsx and is only used by CmsEditView — which is never registered. The actual live schedule entry point is the chevron button in CmsPublishButton.tsx.
- **Evidence:**

```
// Replace Payload's stock PublishButton (whose built-in submenu opens
// the default ScheduleDrawer) with our minimal submit-only button.
// The schedule entry point lives in PublishMenu and routes to
// SchedulePublishDialog.
```

- **Fix:** Update the comment to: 'The schedule entry point is the chevron button in CmsPublishButton, which opens SchedulePublishDialog in controlled mode.'

### [INFO] CmsEditView imports DocumentFields — a render-side @payloadcms/ui component — without an enforced allowlist exception (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/edit/CmsEditView.tsx:13`  **Category:** convention-violation
- **Problem:** CmsEditView imports DocumentFields from @payloadcms/ui, which is a render-side component explicitly forbidden by CLAUDE.md. The file contains a long comment justifying this as a 'narrow, documented exception'. This exception is not in the ESLint allowlist and will fail Wave 8's stricter rule. Since CmsEditView is dead code, this violation never runs — but once/if the view is activated, the Wave 8 lint gate will block the build.
- **Evidence:**

```
// CLAUDE.md says `@payloadcms/ui` is data-layer-only — `DocumentFields`
// is a render-side export. We import it here under a narrow, documented
// exception...
import { DocumentFields, useConfig, useDocumentInfo } from '@payloadcms/ui';
```

- **Fix:** If CmsEditView is intended to be activated in a future wave, add DocumentFields to the ESLint @payloadcms/ui allowlist with a comment referencing the wave ticket. If CmsEditView will be deleted (because the deferred wave is now abandoned), delete the file and the comment is moot.

---

## ui-primitives-pickers

> The UI primitive layer is well-architected: @cleanstart/ui components are correctly re-exported from thin shim files, @payloadcms/ui imports are limited to the allowed data-layer hooks, and the Dialog/Drawer primitives use the native &lt;dialog&gt; element correctly. No runtime-throwing hook misuse was found in this scope. The main quality issues are: (1) MediaField.tsx contains a full duplicated inline browse-dialog implementation that was never removed after the shared MediaBrowseDialog was extracted, producing ~400 lines of dead-but-executed code and two diverging implementations; (2) MediaPicker has a documented but real double-fetch race condition when search changes while page > 1; (3) MediaField attaches a permanent document-level Escape handler that fires on every keypress while the field is mounted, regardless of overlay state. Several minor issues exist in accessibility (missing tabpanel role on tab content, decorative-only alt in EmbedDialog, dead ariaLabel prop) and a deprecated alias is still in active use.

Counts: 0 critical · 0 high · 4 medium · 8 low · 0 info

### [MEDIUM] MediaField: full inline browse-dialog duplicates MediaBrowseDialog — dead/diverged code (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/MediaField/MediaField.tsx:199`  **Category:** dead-code
- **Problem:** MediaBrowseDialog.tsx was extracted from MediaField so that SocialCardField, UploadField, and InlineImageInsertDialog can all share the same picker UX. However, the original inline implementation (state variables, refs, three useEffects, and the full inline <dialog> starting at line 953) was never removed from MediaField.tsx. The field now maintains two independent browse implementations: its own inline one and the shared component used everywhere else. The two have already diverged (MediaBrowseDialog shows dimensions and type label in tiles; MediaField's inline copy omits dimensions).
- **Evidence:**

```
MediaField.tsx declares const [browseOpen, setBrowseOpen] = useState(false) at line 199 and renders a full <dialog ref={browseDialogRef}> at line 953. MediaBrowseDialog.tsx exports the same component used by 4 other files. MediaField never imports MediaBrowseDialog.
```

- **Fix:** Replace the inline browse dialog in MediaField.tsx with `<MediaBrowseDialog open={browseOpen} onClose={() => setBrowseOpen(false)} onSelect={onSelectExisting} />`. Remove the ~15 state variables, 3 useEffects, and 100+ JSX lines from MediaField that duplicate this functionality. This also removes the tile divergence (missing dimensions row in MediaField's copy).

### [MEDIUM] MediaPicker: double-fetch race condition when search changes while page > 1 (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/pickers/MediaPicker.tsx:58`  **Category:** logic-bug
- **Problem:** When the user types a new search term while a second (or later) page is loaded, `onSearchChange` fires `fetchMedia(1, next)` immediately AND resets page to 1 which triggers the `useEffect([open, page])` to also fire `fetchMedia(1, search_old_value_at_effect_time)`. Both fetches race to call `setDocs(rows)`. The effect closure captures the stale `search` value, so it fetches with the old query. Whichever fetch resolves last wins, and if the useEffect's stale-search fetch lands last, the user sees results for the old query with the new query text displayed in the input.
- **Evidence:**

```
Line 58–67: useEffect deps are [open, page] and closes over search. Line 69–77: onSearchChange calls setPage(1) AND immediately fires fetchMedia(1, next). The biome-ignore comment acknowledges the intentional exclusion of search from deps but does not eliminate the race when page > 1.
```

- **Fix:** Either: (a) add an AbortController to the useEffect so the stale-search fetch is aborted when onSearchChange fires its own fetch, or (b) move ALL fetch logic into the useEffect by including `search` in deps and removing the parallel fetch from onSearchChange entirely, using a debounce in the effect instead. Option (b) is cleaner and eliminates the dual-path architecture.

### [MEDIUM] InlineImageEditDialog: filename rename does not call the /rename endpoint (uses bare PATCH instead) (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/InlineImage/InlineImageEditDialog.tsx:221`  **Category:** logic-bug
- **Problem:** MediaSelfChrome.tsx (the authoritative Media edit page) explicitly uses the dedicated `/api/media/:id/rename` endpoint for filename renames, with a comment explaining that bare PATCH would diverge `media.url` from R2. InlineImageEditDialog.tsx's `onSaveFilename` callback uses `PATCH /api/media/${doc.id}?depth=0` with `{ filename: next }` — the same bare-PATCH pattern that MediaSelfChrome explicitly avoids. After this rename, the stored URL in Payload's DB will not match the actual R2 object path.
- **Evidence:**

```
InlineImageEditDialog.tsx lines 221–228: fetch(`/api/media/${doc.id}?depth=0`, { method: 'PATCH', body: JSON.stringify({ filename: next }) }). MediaSelfChrome.tsx lines 159–161: fetch(`/api/media/${id}/rename`, { method: 'POST', ... }) with comment 'Use the dedicated /rename endpoint rather than a bare PATCH'.
```

- **Fix:** Change `onSaveFilename` in InlineImageEditDialog to POST to `/api/media/${doc.id}/rename` using the same pattern as MediaSelfChrome.tsx, passing `{ filename: cleaned }` (the stem without extension — the rename endpoint adds the extension). Update the response handling to match the `{ ok, filename, error }` shape returned by the rename endpoint.

### [MEDIUM] MediaField: inline filename rename also uses bare PATCH instead of /rename endpoint (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/MediaField/MediaField.tsx:501`  **Category:** logic-bug
- **Problem:** Same issue as InlineImageEditDialog. MediaField.tsx's `onSaveFilename` callback PATCHes `/api/media/${doc.id}?depth=0` with `{ filename: next }` for rename. MediaSelfChrome.tsx explicitly documents why this is wrong for R2 storage: the bare PATCH updates the DB row but does not move the R2 object, leaving the stored URL pointing to a non-existent key. Only the Media self-edit page uses the correct `/rename` endpoint.
- **Evidence:**

```
MediaField.tsx lines 501–509: const res = await fetch(`/api/media/${doc.id}?depth=0`, { method: 'PATCH', body: JSON.stringify({ filename: next }) });. MediaSelfChrome.tsx comment: 'Bare PATCH is blocked by rejectFilenameRename because it would diverge media.url from R2'.
```

- **Fix:** Replace the PATCH in `onSaveFilename` with a POST to `/api/media/${doc.id}/rename` following MediaSelfChrome's pattern. Note: the rename endpoint may also be blocked on MediaField's CORS surface if no special admin auth is forwarded, which should be verified.

### [LOW] MediaField: permanent document-level Escape handler fires on every keypress while field is mounted (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/MediaField/MediaField.tsx:322`  **Category:** logic-bug
- **Problem:** The useEffect at line 322 registers a `document.addEventListener('keydown', onKey)` with an empty dependency array. The handler fires on EVERY Escape keypress across the entire document regardless of whether the browse or preview overlay is currently open. With multiple MediaField instances on a form, every Escape keystroke calls `setPreviewOpen(false)` and `setBrowseOpen(false)` on all mounted MediaField instances simultaneously. The native `<dialog>` already handles ESC via the browser's cancel event wired to `onClose`.
- **Evidence:**

```
Line 322–332: useEffect(() => { document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, []); where onKey calls setPreviewOpen(false); setBrowseOpen(false) unconditionally on Escape.
```

- **Fix:** Remove the global Escape handler entirely. The native `<dialog>` elements already dispatch `cancel` → `onClose` on ESC. If truly needed for non-dialog overlays, gate with `if (!previewOpen && !browseOpen) return;` and guard the effect with the overlay open state in the dep array.

### [LOW] InlineImageInsertDialog: Browse tab leaves inner dialog open with empty body (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/InlineImage/InlineImageInsertDialog.tsx:166`  **Category:** ux-question
- **Problem:** When the Browse tab is selected, the inner `<dialog>` remains open and visible (showing the tab bar with 'Browse media' active but an empty body area), while `MediaBrowseDialog` opens on top as a second native dialog. The inner dialog body renders nothing for `tab === 'browse'`. On ESC within the browse picker, focus returns to the inner dialog which now shows an empty body until the tab switches back to 'device'.
- **Evidence:**

```
Lines 166–229: div.cs-inline-image-dialog__body only renders content for tab === 'device' and tab === 'url'. No JSX is rendered when tab === 'browse'. The outer <dialog> stays open while MediaBrowseDialog open={open && tab === 'browse'} renders on top.
```

- **Fix:** Add a minimal placeholder to the body for the browse tab (e.g. 'Browsing media…' or a spinner), or hide the inner dialog panel visually while the browse dialog is open using CSS (`visibility: hidden` or `display: none` when `tab === 'browse'`).

### [LOW] EmbedDialog: redundant ariaLabel silently suppressed by labelledBy (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/Embed/EmbedDialog.tsx:220`  **Category:** dead-code
- **Problem:** EmbedDialog passes both `ariaLabel="Insert embed"` and `labelledBy={...}` to the Dialog component. The Dialog primitive (packages/ui/src/primitives/Dialog.tsx:72) sets `aria-label={labelledBy ? undefined : ariaLabel}`, so when `labelledBy` is provided, `ariaLabel` is unconditionally suppressed. The `ariaLabel` string is never rendered to the DOM.
- **Evidence:**

```
EmbedDialog.tsx lines 220–222: ariaLabel="Insert embed" + labelledBy={`${titleId}-${TITLE_ID}`}. Dialog.tsx line 72: aria-label={labelledBy ? undefined : ariaLabel}.
```

- **Fix:** Remove the `ariaLabel="Insert embed"` prop from the Dialog invocation in EmbedDialog.tsx. The `labelledBy` referencing the `<DialogHeader id>` is the correct and sufficient accessible name.

### [LOW] InlineImageInsertDialog tab buttons use role='tab' without tabpanel / tablist / aria-controls (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/InlineImage/InlineImageInsertDialog.tsx:151`  **Category:** accessibility
- **Problem:** The tab buttons have `role='tab'` and `aria-selected` but: (1) the parent `<nav>` does not have `role='tablist'`; (2) the tab content `<div>` does not have `role='tabpanel'`; (3) no `aria-controls` connects tabs to panels. Screen readers will not correctly announce or navigate the tab widget. The same pattern exists in EmbedDialog (line 235) where the tab bar uses `role='tablist'` and `role='tab'` but also lacks `aria-controls` and `role='tabpanel'`.
- **Evidence:**

```
InlineImageInsertDialog.tsx lines 151–163: <nav aria-label='Source'> wrapping buttons with role='tab' but no role='tablist' on the nav and no role='tabpanel' on the body div. EmbedDialog.tsx line 235: <div role='tablist'> with role='tab' buttons but no aria-controls or role='tabpanel'.
```

- **Fix:** For InlineImageInsertDialog: change `<nav>` to `<div role='tablist' aria-label='Source'>`. Add `id` and `aria-controls` to each tab button. Wrap the tab content div in `<div role='tabpanel' id='...' aria-labelledby='...'>`. For EmbedDialog: add `aria-controls` to each tab and `role='tabpanel'` to the panel divs.

### [LOW] MediaField: toAbsoluteUrl defined after the component that calls it (declaration order smell) (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/MediaField/MediaField.tsx:1108`  **Category:** convention-violation
- **Problem:** The `toAbsoluteUrl` helper function is defined as a `const` at the bottom of the file (line 1108), after the `MediaField` component that calls it beginning at line 162. In JavaScript modules `const` is not hoisted, so this only works because the module is fully evaluated before any component renders. It creates a confusing read order and is inconsistent with the project convention of defining utilities before components. MediaBrowseDialog.tsx correctly defines `toAbsoluteUrl` at the top (line 47).
- **Evidence:**

```
MediaField.tsx line 162: export const MediaField = ... uses toAbsoluteUrl(doc.url) at line 467 and 576. const toAbsoluteUrl is defined at line 1108.
```

- **Fix:** Move `toAbsoluteUrl` to above the `MediaField` component definition. Alternatively, import it from a shared utility module since the identical function is also defined in MediaBrowseDialog.tsx and MediaSelfChrome.tsx — three copies of the same 4-line utility. Extract to `apps/cms/src/payload/lib/url.ts`.

### [LOW] toAbsoluteUrl defined in three separate files — duplicated utility (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/MediaField/MediaField.tsx:1108`  **Category:** over-engineered
- **Problem:** An identical or near-identical `toAbsoluteUrl` helper is copy-pasted into three files: MediaField.tsx (line 1108), MediaBrowseDialog.tsx (line 47), and MediaSelfChrome.tsx (line 44). The CLAUDE.md rule 'Three similar lines beats a premature abstraction' is now exceeded — there are three callers, warranting extraction.
- **Evidence:**

```
All three implementations: if (/^https?:\/\//...) return url; if (typeof window === 'undefined') return url; return new URL(url, window.location.origin).toString();. MediaSelfChrome.tsx wraps it in a try/catch; the other two do not — a behavioral divergence already exists.
```

- **Fix:** Extract to `apps/cms/src/payload/lib/url.ts` as `export const toAbsoluteUrl = (url: string): string => { ... }` using the try/catch variant from MediaSelfChrome for safety. Import from there in all three files. This also fixes the inconsistency where MediaField and MediaBrowseDialog can throw on invalid URLs while MediaSelfChrome cannot.

### [LOW] useAnchoredPosition: continuous rAF loop calls getBoundingClientRect every frame (confidence: high · effort: small · status: unverified)

- **File:** `packages/ui/src/hooks/useAnchoredPosition.ts:110`  **Category:** performance
- **Problem:** While a Popover is open, `useAnchoredPosition` schedules `window.requestAnimationFrame(tick)` recursively, calling `anchor.getBoundingClientRect()` and `floating.getBoundingClientRect()` every ~16ms. Each `getBoundingClientRect()` call forces a style flush if layout is dirty. For long-lived popovers (e.g. the RelationshipPicker search combobox open during typing), this fires 60 times/second. The existing resize listener already handles reposition-on-resize; scroll is the only missing trigger.
- **Evidence:**

```
Lines 110–115: const tick = (): void => { update(); frame = window.requestAnimationFrame(tick); }; frame = window.requestAnimationFrame(tick); — a continuous animation loop for the lifetime of the open popover.
```

- **Fix:** Replace the rAF loop with: one initial `update()` call, a `ResizeObserver` on both anchor and floating elements, and a `'scroll'` listener (passive, capture=true) on `window`. This covers all layout-change sources without polling 60×/sec. Only add the rAF loop as a fallback for CSS transitions on open (one-shot, not recursive).

### [LOW] uploadMediaFromUrl deprecated alias still in active use in InlineImageInsertDialog (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/InlineImage/InlineImageInsertDialog.tsx:9`  **Category:** dead-code
- **Problem:** upload-media-file.ts exports `ingestMediaFromUrl` as the canonical function and marks `uploadMediaFromUrl` as `@deprecated`. InlineImageInsertDialog.tsx imports `uploadMediaFromUrl` (the deprecated alias) instead of `ingestMediaFromUrl`. RichPastePlugin correctly uses `ingestMediaFromUrl`.
- **Evidence:**

```
InlineImageInsertDialog.tsx line 9: import { uploadMediaFromUrl, ... }. upload-media-file.ts lines 210–213: @deprecated Use ingestMediaFromUrl. Retained as a temporary alias.
```

- **Fix:** Replace the `uploadMediaFromUrl` import and all call sites in InlineImageInsertDialog.tsx with `ingestMediaFromUrl`. Then delete the deprecated alias export from upload-media-file.ts.

---

## ui-seo-suite

> The SEO and redirect UI layer is well-structured overall: all @payloadcms/ui imports are correctly limited to data-layer hooks (useField, useAllFormFields, useFormFields, useDocumentInfo, useAuth), all live previews compute from form state correctly, and the health-score/density scorers are pure functions with solid test coverage. Two distinct logic bugs are present: a stale closure in OutboundRedirectField makes the Enter-key shortcut silently submit stale form data, and both SeoTitleField and SeoDescriptionField initialise auto-sync incorrectly when a stored manual value happens to equal its source — causing the auto-sync to re-engage and overwrite it on the next source change. Additionally, InboundRedirectsField and both exports from SchemaAddonsAdder.tsx are entirely dead code that was never cleaned up after the SEO sidebar was refactored.

Counts: 0 critical · 0 high · 2 medium · 7 low · 1 info

### [MEDIUM] Stale closure: OutboundRedirectField Enter key calls outdated handleSave (confidence: high · effort: trivial · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/OutboundRedirectField.tsx:152`  **Category:** logic-bug
- **Problem:** handleKeyDown is a useCallback with deps [form.saving]. handleSave is defined later with deps [form, sitePath, publicUrl, fetchState.row, refetch]. When an editor types into the "Redirect to" input, React recreates handleSave with the new form.to, but handleKeyDown is NOT recreated because form.saving did not change. Pressing Enter triggers the stale handleSave, which reads the old form.to (empty string), producing a spurious validation error "Target is required" even though the input visibly shows a value.
- **Evidence:**

```
const handleKeyDown = useCallback(
  (e) => { if (!form.saving) void handleSave(); },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [form.saving], // <-- handleSave missing from deps
);
const handleSave = useCallback(async () => {
  const toTrim = form.to.trim();
  if (!isGone && toTrim.length === 0) {
    setForm((p) => ({ ...p, error: 'Target is required...' }));
  }
}, [form, sitePath, publicUrl, fetchState.row, refetch]);
```

- **Fix:** Add handleSave to handleKeyDown's dependency array and move handleSave above handleKeyDown in the component body. The eslint-disable comment confirms the author knew this was problematic — the correct fix is `[form.saving, handleSave]`. Alternatively, call `void handleSave()` via a stable ref pattern. [verifier note: The recommended fix is correct: move handleSave above handleKeyDown and add it to the dependency array ([form.saving, handleSave], or just [handleSave] since recreating on every form change keeps form.saving fresh too); the ref pattern is an equivalent alternative. Severity downgraded from high to medium: this is a usability/correctness bug on the keyboard-save affordance only — the on-screen Save/Enable button still works correctly, there is no data corruption, and the failure mode is conservative (a spurious blocking error, not a silently wrong write). The blast radius is one admin sidebar field's Enter-to-submit, with an obvious workaround (click the button). Still a genuine stale-closure bug that should be fixed.]

### [MEDIUM] SeoTitleField / SeoDescriptionField: manualMode lost when stored value equals source on load (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SeoTitleField.tsx:67`  **Category:** logic-bug
- **Problem:** The useState initializer for manualMode computes `stored !== '' && stored !== docTitle`. If an editor previously typed a custom SEO title that happened to equal the document title (common for short titles), on reload stored === docTitle and manualMode initialises to false (auto mode). The auto-sync effect then re-engages: the next time the editor modifies the document title, the SEO title will be overwritten with no warning. The same defect exists in SeoDescriptionField (SeoDescriptionField.tsx:62).
- **Evidence:**

```
const [manualMode, setManualMode] = useState<boolean>(() => {
  const stored = (seoTitleValue ?? '').trim();
  const docTitle = (docTitleValue ?? '').trim();
  return stored !== '' && stored !== docTitle; // false when they coincidentally match
});
```

- **Fix:** Add a dedicated boolean field `seo._titleOverridden` (and `seo._descriptionOverridden`) to the schema to record the editor's explicit intent. On load, initialise manualMode from that flag rather than inferring it from value equality. Until the schema change lands, at minimum document the limitation in the field's JSDoc comment.

### [LOW] InboundRedirectsField is dead code — removed from seoSidebarFields() but file not deleted (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/InboundRedirectsField.tsx:1`  **Category:** dead-code
- **Problem:** InboundRedirectsField is never imported or mounted outside its own file. The seo.ts seoSidebarFields() function was updated to replace the inbound-redirect card with OutboundRedirectField, but the 621-line InboundRedirectsField file was not removed. The comment in seo.ts at line 665 explicitly says 'the inbound-redirect sidebar card was removed'.
- **Evidence:**

```
grep -rn 'InboundRedirectsField' src/payload/ — only returns the file itself and a comment in Notice.tsx. No field registration in any collection or seo.ts.
```

- **Fix:** Delete apps/cms/src/payload/admin/components/InboundRedirectsField.tsx. If the inbound-redirects view is ever needed again it can be restored from git history.

### [LOW] SchemaAddonsAdder and SchemaAddonsSection are dead exports — field is Payload-hidden (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SchemaAddonsAdder.tsx:131`  **Category:** dead-code
- **Problem:** Both exports from this file (SchemaAddonsSection and the legacy SchemaAddonsAdder default export) are never imported or registered anywhere. The schemaAddonsField they target is `admin: { hidden: true }` in fields/schema-addons.ts, which means Payload never renders it — the DOM elements that driveStockDrawerToAdd attempts to click never exist. The 'Add' button silently polls for 2 seconds and exits without doing anything. The legacy SchemaAddonsAdder incorrectly types useField as returning `ReadonlyArray<Entry>` for a blocks field.
- **Evidence:**

```
grep -rn 'SchemaAddonsSection\|SchemaAddonsAdder' src/payload/ — returns only SchemaAddonsAdder.tsx itself.
schemaAddonsField in fields/schema-addons.ts line 308: admin: { hidden: true }.
driveStockDrawerToAdd polls document.querySelector('[id$="field-schemaAddons"] .blocks-field__drawer-toggler') which is never in DOM.
```

- **Fix:** Delete the SchemaAddonsSection export and the legacy SchemaAddonsAdder export. If a functional schema-addons UI is needed in the future, the correct approach is to unhide the blocks field (`hidden: false`) and implement a proper custom blocks component rather than driving Payload's internal DOM.

### [LOW] CanonicalField shows 'Checking the URL…' immediately on every keystroke, not after debounce (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/CanonicalField.tsx:67`  **Category:** ux-question
- **Problem:** The health-check effect sets `setHealth({ kind: 'checking' })` before the 600 ms setTimeout fires. Every individual keystroke triggers a React re-render, which runs cleanup then re-runs the effect and immediately shows 'Checking the URL…'. The indicator reads 'Checking' throughout the entire time the editor is typing, even though no network request has been made yet.
- **Evidence:**

```
setHealth({ kind: 'checking' });  // line 67 — before setTimeout
let cancelled = false;
const timer = window.setTimeout(async () => {  // 600 ms timer
```

- **Fix:** Move `setHealth({ kind: 'checking' })` inside the setTimeout callback, immediately before the fetch call. The effect exit path already handles the transition to 'idle' when conditions aren't met.

### [LOW] SocialCardField: XHR upload has no abort on component unmount (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SocialCardField.tsx:249`  **Category:** error-handling
- **Problem:** performUpload creates an XMLHttpRequest but never exposes an abort method to callers, and no useEffect cleanup aborts in-flight uploads if the component unmounts. The XHR will complete and call onProgress/onSuccess which trigger setState on a potentially unmounted component. React 18 treats post-unmount setState as a no-op so there is no crash, but the XHR continues consuming network and server resources unnecessarily.
- **Evidence:**

```
const xhr = new XMLHttpRequest();
// ... no returned cancel / abort function from performUpload
// no useEffect(() => () => xhr.abort(), []) for the in-flight upload
```

- **Fix:** Refactor performUpload to return an abort function. Store the current XHR ref in a useRef and call xhr.abort() in the useEffect cleanup. Or replace with fetch + AbortController following the pattern already used by fetchMedia in the same file.

### [LOW] SchemaOverrideModal handleApply: redundant double-branch logic — overridable path is always a superset of action=merge path (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SchemaPreviewField.tsx:725`  **Category:** logic-bug
- **Problem:** handleApply has two branches: `if (checked && row.item.overridable)` and `else if (checked && row.item.action === 'merge')`. Any item with `action === 'merge'` is by definition overridable. The second branch therefore only fires for overridable=false + action=merge items, a combination the buildIngestPlan function never produces. This means the second branch is unreachable.
- **Evidence:**

```
if (checked && row.item.overridable) {
  merged.push(row.item.blob);
} else if (checked && row.item.action === 'merge') {  // unreachable per current plan logic
  merged.push(row.item.blob);
}
```

- **Fix:** Collapse to a single condition: `if (checked && (row.item.overridable || row.item.action === 'merge'))`. Also consider verifying against the ingest plan's invariant in a comment so the intent is explicit for future maintainers.

### [LOW] SeoAdvancedPanel summary: speakableSelectors.length used as useMemo dep instead of full array (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SeoAdvancedPanel.tsx:120`  **Category:** logic-bug
- **Problem:** The summary useMemo depends on `speakableSelectors.length` rather than `speakableSelectors`. This means if an existing selector's text is changed (the length stays the same), the summary chip count won't invalidate. In practice this is benign because the summary only shows a count, not the selector text, but the dep is semantically incorrect.
- **Evidence:**

```
}, [
  noarchive, nosnippet, noimageindex, notranslate, maxImagePreview,
  speakableSelectors.length,  // should be speakableSelectors
]);
```

- **Fix:** Change `speakableSelectors.length` to `speakableSelectors` in the useMemo dependency array. The array reference changes on any mutation, so the memo will invalidate correctly.

### [MEDIUM] SchemaAddonsAdder (legacy): useField typed as ReadonlyArray<Entry> for a blocks-type field (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SchemaAddonsAdder.tsx:276`  **Category:** type-safety
- **Problem:** The legacy SchemaAddonsAdder component calls useField<ReadonlyArray<Entry> | null | undefined>({ path: 'schemaAddons' }). Payload's useField hook on a blocks-type field returns a number (row count), not an array. The setValue(next) call with an array would write an invalid value to Payload's form state. Although the component is currently never rendered, the type mismatch would cause a runtime error if the field were ever re-enabled.
- **Evidence:**

```
const { value, setValue } = useField<ReadonlyArray<Entry> | null | undefined>({
  path: 'schemaAddons',  // blocks field → returns number, not array
});
...
setValue(next);  // passes Entry[] to a blocks field expecting a row-count number
```

- **Fix:** Delete the SchemaAddonsAdder export (see the dead-code finding above). If ever revived, use useField<number | null | undefined> for the row count and drive block mutations via Payload's blocks-field internal methods rather than calling setValue with an array.

### [INFO] SerpPreviewField / SeoHealthScoreField / SchemaPreviewField: DEFAULT_SITE_URL reads process.env at module load, not at render time (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SerpPreviewField.tsx:39`  **Category:** convention-violation
- **Problem:** All three components evaluate `process.env.NEXT_PUBLIC_SITE_URL` at module evaluation time via a top-level const. In a Next.js bundle this is typically inlined at build time, so it works correctly. However, the pattern is repeated across four files with slightly different fallback strings. If the env var is missing, all fall back to consistent values, but the duplication means a site-URL change requires updates in four places.
- **Evidence:**

```
const DEFAULT_SITE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) ||
  'https://cleanstart.com'; // repeated in 4 files
```

- **Fix:** Extract DEFAULT_SITE_URL to a single shared constant in _redirects-shared.ts or a new lib/seo/site-url.ts and import it into the four consuming components.

---

## ui-lexical-editor

> The custom Lexical plugin suite is substantially well-built: commands are registered with proper cleanup, paste normalisation is thorough, inline-image upload handles both file and URL paths, and the Embed node correctly implements all required Lexical interfaces. There are no runtime crashes under normal single-editor use. The main actionable findings are: (1) a logic bug in LinkPopover.tsx that self-queries the document for its anchor element, causing mispositioned popovers when multiple rich-text editors share a page (confirmed to occur in Guides); (2) the BlockHandlePlugin and its entire feature chain are fully implemented but never registered in editor-config.ts, making them dead code; (3) missing .ts extension on the AddMenu ClientFeature path (inconsistent with every other feature registration); (4) the EmbedPlugin insert-fallback branch is meaningless dead code; (5) EmbedDialog and InlineImageInsertDialog use role="tab" markup but omit role="tabpanel", aria-controls, and tabIndex management required by WCAG 4.1.2; (6) the global MutationObserver in StockToolbarSuppressorPlugin fires on every DOM mutation for each mounted editor instance — a performance concern on busier admin pages.

Counts: 0 critical · 0 high · 3 medium · 8 low · 0 info

### [MEDIUM] LinkPopover self-queries document for anchor element instead of using prop — wrong editor picked on multi-editor pages (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/LinkPopover.tsx:117`  **Category:** logic-bug
- **Problem:** LinkPopover computes its position offset by calling document.querySelector('[data-lexical-editor="true"]')?.parentElement at render time. The portal destination is correctly passed from LinkPopoverPlugin, but the position arithmetic subtracts the bounding rect of whichever editor element appears first in the DOM — not necessarily the editor that opened the popover. On any form with two rich-text fields (confirmed: Guides.ts has `body` + an FAQ `body` at line 136), editing a link in the second editor causes the position offset to be calculated against the first editor's container.
- **Evidence:**

```
const anchorElem = typeof document !== 'undefined' ? (document.querySelector('[data-lexical-editor="true"]')?.parentElement ?? null) : null; const position = useMemo(() => computePosition(anchorRect, anchorElem), [anchorRect, anchorElem]);
```

- **Fix:** Pass anchorElem as a prop from LinkPopoverPlugin (it already receives it) through to LinkPopover, and remove the internal querySelector. Change Props to include `anchorElem: HTMLElement | null` and have the plugin pass `anchorElem={anchorElem}` to the component.

### [MEDIUM] EmbedDialog and InlineImageInsertDialog tab widgets are missing role="tabpanel", aria-controls, and tabIndex management (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/Embed/EmbedDialog.tsx:235`  **Category:** accessibility
- **Problem:** Both EmbedDialog.tsx (lines 235-254) and InlineImageInsertDialog.tsx (lines 151-164) implement a tab interface with role="tablist" / role="tab" buttons. Neither assigns role="tabpanel" to the panel divs, aria-controls on tabs pointing to their panel, aria-labelledby on panels pointing to their tab, nor tabIndex -1/0 on inactive/active tab buttons. This violates WCAG 4.1.2. Additionally, InlineImageInsertDialog uses a <nav> element (not role="tablist") as the tab container while its children have role="tab" — orphaned tab roles without a tablist ancestor fail ARIA semantics.
- **Evidence:**

```
EmbedDialog line 235: <div className="cs-embed-dialog__tabs" role="tablist"> — no aria-controls on tabs, no role="tabpanel" on cs-embed-dialog__panel divs, no tabIndex. InlineImageInsertDialog line 151: <nav className="cs-inline-image-dialog__tabs" aria-label="Source"> with role="tab" children — <nav> is not a valid tablist ancestor.
```

- **Fix:** For both dialogs: assign unique ids to each tab button and its corresponding panel, add aria-controls="panel-id" to each tab, add role="tabpanel" + aria-labelledby="tab-id" to each panel, set tabIndex={state.tab === id ? 0 : -1} on each tab button, and change InlineImageInsertDialog's <nav> to <div role="tablist">.

### [MEDIUM] InlineImagePlugin capture-phase listener registered for both 'click' and 'mousedown' — causes duplicate dispatch (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/InlineImage/InlineImagePlugin.tsx:411`  **Category:** logic-bug
- **Problem:** The capture-phase listener `onCapture` is registered for both 'click' and 'mousedown' events (lines 411-414). The handler's three action branches (toolbarUpload, editBtn, swapBtn) all call event.stopPropagation() and dispatch commands or set state. For any intercepted element, both 'mousedown' and 'click' fire in sequence. The 'mousedown' fires first and dispatches the command; the 'click' then fires and dispatches the same command a second time — opening the dialog, closing it, and reopening it, or double-incrementing state.
- **Evidence:**

```
document.addEventListener('click', onCapture, true); document.addEventListener('mousedown', onCapture, true); — same handler, both listeners, no guard to prevent double-fire. Cases 1-3 stop propagation but not the paired event type.
```

- **Fix:** Register the listener for 'mousedown' only (remove the 'click' registration). All three stock Payload buttons (Upload, Edit, Swap) use onMouseDown to prevent focus loss, so 'mousedown' is the earlier and more reliable intercept point. The filename toggler (case 4) should also add event.stopPropagation() for consistency. Remove `document.removeEventListener('click', onCapture, true)` from the cleanup accordingly.

### [LOW] BlockHandlePlugin, CleanstartBlockHandleFeatureClient, and block-handle-feature.ts are fully implemented but never registered — dead code (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/lib/lexical/block-handle-feature.ts:1`  **Category:** dead-code
- **Problem:** cleanstartBlockHandleFeature() is exported from block-handle-feature.ts and the entire client/plugin chain is implemented (CleanstartBlockHandleFeatureClient.ts → BlockHandlePlugin.tsx). However, cleanstartBlockHandleFeature is never imported or called in editor-config.ts. The drag-reorder affordance it provides is therefore inaccessible to editors.
- **Evidence:**

```
grep 'blockHandle\|BlockHandle' apps/cms/src/payload/lib/lexical/editor-config.ts → 0 matches. The feature is only referenced within its own three files.
```

- **Fix:** Either add `cleanstartBlockHandleFeature()` to the features array in editor-config.ts (after QA-testing the experimental DraggableBlockPlugin in this Lexical version) or delete the three files (BlockHandlePlugin.tsx, CleanstartBlockHandleFeatureClient.ts, block-handle-feature.ts) if the feature is not planned for this release.

### [LOW] add-menu-feature.ts ClientFeature path missing .ts extension — inconsistent with all other feature registrations (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/lib/lexical/add-menu-feature.ts:6`  **Category:** convention-violation
- **Problem:** The ClientFeature string for cleanstartAddMenuFeature omits the .ts suffix. Every other custom feature (embed-feature.ts, link-popover-feature.ts, inline-image-feature.ts, rich-paste-feature.ts, slash-menu-feature.ts, table-popover-feature.ts, block-handle-feature.ts) appends .ts to the module path. Payload 3 resolves these strings through its own bundler pipeline; under some Next.js module resolution configurations, omitting the extension can silently fail to load the client feature or cause hard-to-debug build errors after a Payload upgrade.
- **Evidence:**

```
'@/payload/admin/components/AddMenu/CleanstartAddMenuFeatureClient#CleanstartAddMenuFeatureClient' vs '@/payload/admin/components/RichPasteFeatureClient.ts#RichPasteFeatureClient' (all others have .ts)
```

- **Fix:** Add .ts to the path: '@/payload/admin/components/AddMenu/CleanstartAddMenuFeatureClient.ts#CleanstartAddMenuFeatureClient'

### [LOW] EmbedPlugin insert-fallback branch calls $insertNodes via a meaningless DOM element guard (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/Embed/EmbedPlugin.tsx:107`  **Category:** logic-bug
- **Problem:** The fallback branch (lines 107-111) reads `const root = editor.getRootElement()` (a DOM HTMLElement) and only calls `$insertNodes([embedNode])` if that element is truthy. This is intended as 'append to root when there is no selection', but the intent is wrong: $insertNodes() already internally calls `$getRoot().selectEnd()` when `$getSelection()` returns null. The `editor.getRootElement()` check guards against an unmounted editor, which is not a realistic scenario inside an editor.update() callback.
- **Evidence:**

```
const root = editor.getRootElement(); if (root) $insertNodes([embedNode]); // $insertNodes source: if (selection === null) { selection = $getRoot().selectEnd(); }
```

- **Fix:** Remove the dead-branch DOM check. Replace the else block with simply `$getRoot().selectEnd(); $insertNodes([embedNode]);` to make the intent explicit, or rely on $insertNodes' internal null-selection handling by calling it unconditionally.

### [LOW] StockToolbarSuppressorPlugin registers a body-wide MutationObserver per mounted editor instance (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/StockToolbarSuppressorPlugin.tsx:50`  **Category:** performance
- **Problem:** StockToolbarSuppressorPlugin creates a MutationObserver on document.body with { childList: true, subtree: true }, firing hideStockToolbarItems on every DOM mutation anywhere in the page. The plugin is mounted once per editor instance. A form with multiple rich-text fields (e.g. Guides) mounts N identical observers. Each observer iteration scans STOCK_BUTTON_KEYS and STOCK_GROUP_KEYS via querySelectorAll across the full document subtree.
- **Evidence:**

```
observer.observe(document.body, { childList: true, subtree: true }); — mounted once per editor instance (position: 'normal' in CleanstartLinkPopoverFeatureClient.ts:70). On a Guides form with 2 rich text fields, this creates 2 identical observers.
```

- **Fix:** Use a module-level singleton pattern: track mount count in a module-scope variable and only create the MutationObserver on first mount, disconnecting only when the last instance unmounts. Alternatively, narrow the observer to the specific toolbar container element instead of document.body.

### [LOW] SlashMenuPlugin buttons use aria-pressed for active-item state inside a role="menu" context (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SlashMenuPlugin.tsx:342`  **Category:** accessibility
- **Problem:** Menu item buttons use aria-pressed={isActive} to indicate the currently highlighted item. aria-pressed is a toggle-button state attribute and is semantically invalid on elements inside a role="menu" container. Screen readers announce it as a toggle state rather than selection/focus state. The correct approach for a navigable menu is to drive focus to the active item, or use aria-current="true".
- **Evidence:**

```
<button type="button" aria-pressed={isActive} className={`cs-slash-menu__item...`}> inside <Popover role="menu">
```

- **Fix:** Remove aria-pressed from the menu item buttons. Instead, programmatically focus the active button using a useEffect that calls itemRefs[activeIdx].current?.focus() whenever activeIdx changes, and set tabIndex={isActive ? 0 : -1} on each button.

### [LOW] Internal anchor links (#anchor) round-trip through toStoredUrl/fromStoredUrl with path shape change (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/internal-routes.ts:63`  **Category:** logic-bug
- **Problem:** toStoredUrl('#anchor') produces 'https://cleanstart.com/#anchor' (correctly adds a leading slash before the fragment). fromStoredUrl('https://cleanstart.com/#anchor') returns '/#anchor' — the path component. So an anchor typed as '#anchor' is serialized, then on re-open deserialized as '/#anchor'. The isInternalPath check still classifies '/#anchor' as internal, so the Internal radio is correctly selected. However the displayed value in the search box changes from '#anchor' to '/#anchor' across a save/reload cycle. A similar shape change happens for query strings: '?q=1' round-trips to '/?q=1'.
- **Evidence:**

```
toStoredUrl('#anchor') = SITE_ORIGIN + '/' + '#anchor' = 'https://cleanstart.com/#anchor'. fromStoredUrl: pathname='/', search='', hash='#anchor', tail = '/' + '' + '#anchor' = '/#anchor'. Input '#anchor' → stored → display '/#anchor'.
```

- **Fix:** In toStoredUrl, when the input starts with '#' or '?', append it directly to SITE_ORIGIN without inserting an extra '/': return `${SITE_ORIGIN}${trimmed}`. This makes the round-trip lossless. Verify that Payload's sanitizeUrl accepts 'https://cleanstart.com#anchor'.

### [LOW] LinkPopoverPlugin re-registers all three Lexical commands on every popover state change (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/LinkPopoverPlugin.tsx:243`  **Category:** performance
- **Problem:** The merged useEffect (lines 243-277) lists state in its dependency array because the SELECTION_CHANGE_COMMAND handler reads state. Every time the popover opens, updates its initial doc title, or closes, all three commands are unregistered and re-registered. This is functionally correct but wasteful: only the SELECTION_CHANGE_COMMAND handler actually reads state.
- **Evidence:**

```
mergeCleanups(editor.registerCommand(OPEN_LINK_POPOVER_CREATE, ...), editor.registerCommand(OPEN_LINK_POPOVER_EDIT, ...), editor.registerCommand(SELECTION_CHANGE_COMMAND, () => { if (!state || ...) })) with deps: [editor, openForCurrentSelection, state]
```

- **Fix:** Split the three registrations into separate useEffects: one for CREATE/EDIT (deps: [editor, openForCurrentSelection]) and one for SELECTION_CHANGE (deps: [editor, state]). This avoids the unnecessary churn on the two stable commands.

### [LOW] normalizeRichHtml stripStripTagsRecursive: namespaced-tag sweep uses getElementsByTagName('*') but removes during iteration — potential skips (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/lib/normalize-rich-html.ts:117`  **Category:** logic-bug
- **Problem:** stripStripTagsRecursive (line 109) first removes STRIP_TAGS elements, then sweeps all elements for namespace prefixes using Array.from(root.getElementsByTagName('*')). Array.from() takes a snapshot, so previously removed nodes are not in the array. However, if a namespace-prefixed node contains other namespace-prefixed descendants, removing the parent first removes the descendants from the live HTMLCollection before they are snapshotted. In practice this is harmless because removing a parent removes all descendants from the DOM, but the code's comment implies that each node is independently removed, which is misleading.
- **Evidence:**

```
for (const node of Array.from(root.getElementsByTagName('*'))) { const tag = node.tagName.toLowerCase(); if (STRIP_TAG_PREFIXES.some(...)) { node.remove(); } } — parent removal also removes descendants silently.
```

- **Fix:** Add a comment acknowledging that parent removal implicitly covers descendants. No functional change needed unless the loop ever needs to process descendants before parents. The current behavior is correct and safe.

---

## ui-dashboard-nav

> The scope is largely well-structured — server-side data fetching is safe, hook usage is correct, keyboard handling is mostly solid, and the pub-sub patterns (slug-status-store, ToastBus event bus) are clean. No runtime-crashing hook API misuse was found in this scope. However there are three real bugs worth fixing: (1) the shortcut help table documents the wrong meaning for Cmd+/, actively misleading editors, (2) CommandPalette navigation uses window.location.href causing full page reloads instead of Next.js client-side transitions, and (3) the Dashboard server component imports a render-side UI component from @payloadcms/ui in direct violation of the project's data-layer-only rule for that package. A handful of resource-leak and type-safety patterns round out the lower-priority findings.

Counts: 0 critical · 0 high · 3 medium · 9 low · 0 info

### [MEDIUM] CommandPalette uses window.location.href causing full page reload on every navigation (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/CommandPalette.tsx:252`  **Category:** logic-bug
- **Problem:** The activate() function sets `window.location.href = action.href` for every navigation. In Payload's Next.js App Router admin, this triggers a full browser reload instead of a client-side route transition. The result is a full page flash, loss of any in-memory state, and significantly slower navigation than Next.js router.push() would provide. All the palette's UX benefit of instant keyboard navigation is undercut by the hard reload.
- **Evidence:**

```
const activate = useCallback((action: Action): void => { saveRecent(action); window.location.href = action.href; close(); }, [close]);
```

- **Fix:** Import `useRouter` from `next/navigation` and call `router.push(action.href)` instead of `window.location.href`. The component is a client component so this is straightforward. Remove the now-dead `close()` call after the push.

### [MEDIUM] Dashboard imports Gutter (render component) from @payloadcms/ui — convention violation (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/Dashboard/Dashboard.tsx:1`  **Category:** convention-violation
- **Problem:** CLAUDE.md is explicit: `@payloadcms/ui` is data-layer-only. Render-side exports are forbidden and ESLint will enforce this as an error from Wave 8. `Gutter` is a React.FC that renders a `<div>` with project-specific padding tokens — it is unambiguously a render component. Dashboard.tsx is a server component, so there is no runtime crash today, but this import is a convention breach that will become a lint error.
- **Evidence:**

```
import { Gutter } from '@payloadcms/ui'; — Gutter is React.FC<GutterProps>, a render component. @cleanstart/ui does not export a Gutter equivalent.
```

- **Fix:** Replace `<Gutter className="cs-dashboard">` with `<div className="cs-dashboard">`. The CSS class already carries all the layout; Gutter just adds its own padding tokens which may conflict with the cs-dashboard styles anyway.

### [MEDIUM] NavGroupPersistence MutationObserver never disconnected after initial application (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/NavGroupPersistence.tsx:82`  **Category:** logic-bug
- **Problem:** The MutationObserver is created to detect when nav-group elements appear and then apply stored collapsed state. Once `appliedOnce` becomes true the callback is a no-op (guarded by `!appliedOnce`), but the observer is never disconnected — it continues firing on every childList mutation on `document.body` (with `subtree: true`) for the entire session. In a content-heavy admin view with many DOM updates, this creates a persistent observer that calls an empty guard function on every single DOM change.
- **Evidence:**

```
Line 82-88: const observer = new MutationObserver(() => { if (!appliedOnce && document.querySelector('.nav-group')) { apply(); } }); observer.observe(document.body, { childList: true, subtree: true }); — observer.disconnect() is only called in cleanup (line 111), but could be called eagerly inside the callback after appliedOnce=true.
```

- **Fix:** Inside the MutationObserver callback, call `observer.disconnect()` immediately after `apply()` completes (after `appliedOnce = true` is set). This removes the body-wide observer as soon as the one-shot work is done.

### [LOW] ShortcutHelpDialog documents wrong meaning for Cmd+/ (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/ShortcutHelpDialog.tsx:29`  **Category:** logic-bug
- **Problem:** The SHORTCUTS table lists `['mod', '/']` with description 'Toggle focus mode on body editor', but the actual keydown handler for Cmd+/ at line 58 opens/closes the shortcut help dialog itself. EditorFullscreenToggle.tsx has no Cmd+/ listener at all — it only responds to Escape. Editors who read the shortcut sheet and press Cmd+/ expecting to enter fullscreen will instead see the dialog close; the real fullscreen affordance is only reachable by clicking the button.
- **Evidence:**

```
ShortcutHelpDialog.tsx:29 { keys: ['mod', '/'], description: 'Toggle focus mode on body editor' } — but line 58: if ((event.metaKey || event.ctrlKey) && event.key === '/') { setOpen((v) => !v); } opens/closes this dialog. EditorFullscreenToggle.tsx has only an Escape listener (line 106).
```

- **Fix:** Either (a) add a Cmd+/ keydown listener to EditorFullscreenToggle.tsx that calls toggle(), and keep the SHORTCUTS table entry as-is, or (b) correct the table entry to 'Open keyboard shortcut reference' and remove the duplicate Cmd+/ handler from ShortcutHelpDialog if '?' alone is sufficient to open it. [verifier note: The bug is real and reachable but the impact is a misleading keyboard hint in internal CMS editor chrome — no data loss, no security/publish path affected, and the fullscreen feature is still reachable via its button. "high" is overstated; low is appropriate for a docs/UX-accuracy defect in admin tooling. Both proposed fixes are valid. Caveat for fix (b): the component docstring at lines 44-48 explicitly states the dialog opens on `?` AND Cmd+/, so removing the Cmd+/ handler must also update that comment. `?` (handled at lines 63-73, guarded against editable targets) does suffice as a standalone open trigger, so fix (b) is viable; fix (a) preserves the documented two-key affordance and is the lower-risk option since it only adds a listener to EditorFullscreenToggle calling its existing toggle().]

### [LOW] ToastBus auto-dismiss setTimeouts are never cleared on unmount (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/ToastBus.tsx:98`  **Category:** logic-bug
- **Problem:** Each toast creates a `window.setTimeout(() => dismiss(id), ttl)` but the timer handle is discarded — not stored, not cancelled in any cleanup. If the component were to unmount (HMR reload, error boundary) while a toast is visible, the timer fires and calls `setItems()` on the unmounted component. React 18 silently ignores this but the closure keeps the dismiss callback alive in memory until the timer fires. In production ToastBus never unmounts, so this is currently harmless but is a code-quality issue.
- **Evidence:**

```
Line 98: window.setTimeout(() => dismiss(id), ttl); — no handle stored, no clearTimeout in the useEffect cleanup.
```

- **Fix:** Collect timer handles in a `useRef<Map<number, ReturnType<typeof window.setTimeout>>>` and clear them on unmount. Alternatively, store all pending IDs and their handles, clear them in the useEffect return.

### [LOW] AnalyticsCards uses unnecessary `as unknown as` casts for readCache calls (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/Dashboard/AnalyticsCards.tsx:73`  **Category:** type-safety
- **Problem:** All four render functions cast `payload as unknown as Parameters<typeof readCache>[0]`. The `readCache` function accepts `BasePayload` as its first parameter. In payload 3.84, `type Payload = BasePayload` (they are the same type). The double cast `as unknown as BasePayload` is therefore a no-op that breaks the type chain unnecessarily and hides any future incompatibility if the types diverge.
- **Evidence:**

```
payload as unknown as Parameters<typeof readCache>[0] appears 4 times (lines 73, 110, 143, 177). Payload's dist/index.d.ts line 487: type Payload = BasePayload;
```

- **Fix:** Change the function signatures of `renderGa4`, `renderGsc`, `renderClarity`, `renderCfWa` to accept `BasePayload` directly (import from `payload`), or simply pass `payload` without any cast since Payload IS BasePayload.

### [LOW] Dashboard greetingFor() uses server time, not editor's local time (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/Dashboard/Dashboard.tsx:431`  **Category:** logic-bug
- **Problem:** The Dashboard is a server component. `greetingFor()` calls `new Date()` which evaluates at request time on the server (likely UTC). An editor in San Francisco (UTC-8) loading the dashboard at 9pm local time may see 'Good morning' if the server is UTC+0 and it's 5am UTC. This is a minor but observable UX oddity — the greeting reflects the server timezone, not where the editor is sitting.
- **Evidence:**

```
Line 380: const greetingFor = (now: Date = new Date()): string => { const h = now.getHours(); ... } — called at line 431 with no argument, executes on the server.
```

- **Fix:** Move the greeting to a small `'use client'` component that reads `new Date()` on the client. The server component can render a neutral placeholder and the client hydrates it. Alternatively, accept the limitation and document it.

### [LOW] UserMenu: initialsFor returns empty string for all-whitespace names (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/UserMenu.tsx:18`  **Category:** logic-bug
- **Problem:** When `user.name` is a string of only whitespace characters (e.g. `'   '`), `initialsFor` returns an empty string rather than `'?'`. The function checks `!name` which is falsy for empty string but truthy for `'   '`, then `trim().split(/\s+/)` produces `['']`, and `parts[0]?.slice(0, 2)` is `''` which is not nullish so the `?? '?'` fallback never fires. The avatar span renders empty.
- **Evidence:**

```
Confirmed by runtime test: initialsFor('  ') returns ''. '   '.trim() = ''; ''.split(/\s+/) = ['']; ''?.slice(0,2) = ''; '' ?? '?' = ''.
```

- **Fix:** Add a guard after the slice: `return ((parts[0]?.slice(0, 2) ?? '') || '?').toUpperCase();` — the logical OR catches the empty-string case that nullish coalescing misses.

### [LOW] NavBadges makes 25 HTTP requests per minute per open admin tab (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/NavBadges.tsx:220`  **Category:** performance
- **Problem:** fetchAndInject fires every 60 seconds and makes: 9 versioned collections × 2 (draft + published) = 18 requests, plus 7 non-versioned collections × 1 = 7 requests, totalling 25 concurrent Payload REST API calls per poll cycle per open browser tab. With 3 concurrent admin sessions this is 75 REST calls/minute at idle. Under load this approaches throttle territory.
- **Evidence:**

```
Lines 220-230: VERSIONED_CONTENT.map(async (slug) => { [draft, published] = await Promise.all([fetchCount(slug,'draft'), fetchCount(slug,'published')]); }) — 9 slugs × 2 = 18. Plus TOTAL_CHIP_CONTENT.map (7 slugs) = 25 total.
```

- **Fix:** Add a single server endpoint (e.g. `GET /api/admin-counts`) that returns all counts in one DB round-trip using a single aggregated query per collection with GROUP BY _status. The client polls this one endpoint every 60s instead of 25 separate calls.

### [LOW] CommandPalette missing keyboard accessibility: no role=listbox/option ARIA on result rows (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/CommandPalette.tsx:604`  **Category:** accessibility
- **Problem:** The result rows use `role='menu'` / `role='menuitem'` on groups/buttons but the palette has combobox semantics (a search input filtering a list). ARIA combobox pattern requires `role=combobox` on the input, `role=listbox` on the results container, and `role=option` on each row, with `aria-activedescendant` on the input. The current implementation uses `role=menu/menuitem` which is semantically wrong for a search palette.
- **Evidence:**

```
Line 229: role='menu' on the result group div. Line 611: ActionRow renders as <button type='button'> with no role=option. The input at line 483 has no aria-controls, aria-expanded, or aria-activedescendant.
```

- **Fix:** Refactor to the combobox pattern: add `role=combobox` + `aria-controls` + `aria-expanded` + `aria-activedescendant` to the input; `role=listbox` on the results container; `role=option` + `id=cmdk-opt-{index}` + `aria-selected` on each row. Update `scrollIntoView` to use the element id.

### [LOW] CommandPalette O(N) indexOf calls per render row — minor quadratic pattern (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/CommandPalette.tsx:516`  **Category:** performance
- **Problem:** Each ActionRow/RecentRow in the render loop calls `allActions.indexOf(a)` three times (for index, active check, and onHover). With allActions sized up to ~50 items this is O(N) per row, O(N²) total on each render. While negligible at current scale, it runs on every keypress during search which can be ~10 renders/second.
- **Evidence:**

```
Lines 516-519: index={allActions.indexOf(a)} active={allActions.indexOf(a) === activeIndex} onHover={() => setActiveIndex(allActions.indexOf(a))} — same O(N) lookup repeated 3× per row in 3 separate render blocks.
```

- **Fix:** Build an index map before the render: `const indexMap = useMemo(() => new Map(allActions.map((a, i) => [a.id, i])), [allActions])` and replace `allActions.indexOf(a)` with `indexMap.get(a.id) ?? 0`. This collapses all lookups to O(1).

---

## ui-integrations

> The integrations admin UI is well-structured overall: hook imports are data-layer-only (compliant with the @payloadcms/ui rule), cancellation tokens prevent state updates after unmount, and the endpoint auth/Zod validation is tight. However, there are two concrete logic bugs that produce misleading results (test always fails when routing filters are set; wrong frontend URL built for GSC queries), three components that parse JSON without checking HTTP status first (producing cryptic SyntaxError messages on 500s), and a silent network-error swallow in FormSlugsMultiSelect that shows a misleading empty-state message. The wire-analytics-tab idempotency guard is fragile under tabs-field structures.

Counts: 0 critical · 0 high · 4 medium · 3 low · 0 info

### [MEDIUM] useDocUrl builds wrong URL: window.location.origin is the CMS host, not the web frontend (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/integrations/AnalyticsTab.tsx:86`  **Category:** logic-bug
- **Problem:** window.location.origin returns the CMS server origin (e.g. https://cms.cleanstart.com). The replace(/\/admin.*/, '') regex is applied to origin, but origin never contains a path — it has only protocol + host — so the replace is a no-op. The resulting URL is https://cms.cleanstart.com/<slug> instead of https://cleanstart.com/<slug>. This wrong URL is sent to the GSC per-doc queries endpoint and the GSC URL Inspection endpoint, meaning all GSC lookups will return empty/error results for every document.
- **Evidence:**

```
AnalyticsTab.tsx:85-88: window.location.origin.replace(/\/admin.*/, '') — origin has no path, replace does nothing; URL becomes https://cms.cleanstart.com/<slug>. siteSettings.ts:17-21 already stores baseUrl: 'https://cleanstart.com' as the canonical frontend URL and is accessible via /api/globals/siteSettings.
```

- **Fix:** Remove the window.location.origin branch entirely. Fetch the canonical base URL from /api/globals/siteSettings?depth=0 once on mount, and use that as the base. Until that plumbing exists, the hardcoded fallback 'https://cleanstart.com' that is already in the file is the correct value — use it unconditionally. [verifier note: The finding and its recommendation are accurate. The fix is correct: drop the window.location.origin branch and use the canonical base. Best approach is to fetch /api/globals/siteSettings?depth=0 once on mount and use its baseUrl (the value editors actually control); the existing hardcoded 'https://cleanstart.com' is a fine interim default. Note the bug only degrades the GSC sections — GA4 and Clarity primary fetches hit cached global endpoints (/api/dashboards/ga4DataApi, /api/dashboards/msClarity) that do not depend on `url`, so the panel is not entirely empty (Clarity's per-URL row match on line 210 also silently fails to find a row). I down-graded high→medium: this is a fully-broken-but-isolated feature degradation with no data-loss or security impact; high is defensible given it is 100% broken in prod, but medium better reflects blast radius.]

### [MEDIUM] TestButton, HealthBadge, and AuditTrail call res.json() without checking res.ok — SyntaxError on 500 (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/integrations/TestButton.tsx:43`  **Category:** error-handling
- **Problem:** All three fetch-based components call res.json() unconditionally, without first checking res.ok. When the server returns a 500 or gateway-error HTML page, res.json() throws SyntaxError: Unexpected token '<', which bubbles to the catch block and surfaces as a raw JavaScript error message in the UI. The same pattern exists in HealthBadge.tsx:50 and AuditTrail.tsx:61. This makes it impossible for editors to distinguish a real integration failure from a server-side crash.
- **Evidence:**

```
TestButton.tsx:43: const body = (await res.json()) as TestResponse; — no if (!res.ok) guard. HealthBadge.tsx:50 and AuditTrail.tsx:61 have the identical pattern. All three pass the error message directly to UI state (TestButton:58, HealthBadge:62, AuditTrail:71).
```

- **Fix:** Add `if (!res.ok) throw new Error('HTTP ' + res.status);` immediately before each res.json() call, or use a shared helper: `const safeJson = async (r: Response) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }`. Apply to all three components and AnalyticsTab's fetch chains.

### [MEDIUM] FormSlugsMultiSelect silently swallows network errors — shows misleading 'No forms found' empty state (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/integrations/FormSlugsMultiSelect.tsx:45`  **Category:** error-handling
- **Problem:** The fetchForms fetch inside useEffect handles only HTTP-level errors (res.ok check inside fetchForms returns []). The .then(setOptions).finally(setLoading) chain has no .catch(). If fetch itself throws (network offline, CORS error, TLS error), the rejection skips .then(setOptions) — options stays [] — and .finally sets loading = false. The dropdown then shows 'No forms found — create a form first.' which is factually wrong. There is also no cancelled flag, so a state update fires on an unmounted component when the component unmounts while loading.
- **Evidence:**

```
FormSlugsMultiSelect.tsx:44-47: fetchForms(serverURL).then(setOptions).finally(() => setLoading(false)); — no .catch(), no cancelled token. Compare with AuditTrail.tsx and HealthBadge.tsx which both use a cancelled flag pattern correctly.
```

- **Fix:** Add .catch(() => setOptions([])) and expose a separate error state. Add a cancelled token identical to the pattern in AuditTrail.tsx. Show an explicit error message (e.g. 'Could not load forms') instead of the empty-forms message when the fetch fails.

### [MEDIUM] wire-analytics-tab idempotency guard misses fields nested inside tabs blocks (confidence: medium · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/lib/wire-analytics-tab.ts:40`  **Category:** logic-bug
- **Problem:** The idempotency check iterates collection.fields (the top-level array only) and explicitly skips tabs-type fields: `f.type !== 'tabs' && 'name' in f && f.name === 'analyticsTab'`. If the collection wraps its fields inside a tabs block, the analyticsTab field will live inside a tab's fields array, not at the top level. The guard fails to detect it and appends a duplicate analyticsTab field at the top level. This can cause `payload generate:types` to fail with a duplicate field error, and the admin UI will render two analytics tab widgets.
- **Evidence:**

```
wire-analytics-tab.ts:40-43: const alreadyHas = collection.fields.some((f) => f.type !== 'tabs' && 'name' in f && f.name === 'analyticsTab'); — skips all tabs-type fields by design, making detection impossible when the field is nested inside a tab.
```

- **Fix:** Write a recursive helper that walks into type: 'tabs' -> each tab's fields array when searching for the existing field. Or simplify: since COLLECTIONS_WITH_ANALYTICS is a static Set, track wired slugs in a module-level Set (Set<string> of slugs already wired).

### [LOW] AuditTrail has no pagination — hard cap of 50 rows with no disclosure to editor (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/integrations/AuditTrail.tsx:104`  **Category:** under-implemented
- **Problem:** The audit trail fetches exactly 50 rows and renders them in a single table. There is no pagination control, no 'showing 50 of N' label, and no 'load more' affordance. For active integrations on busy sites, the table silently truncates history. An editor reviewing a suspected delivery issue has no way to scroll back further than 50 entries.
- **Evidence:**

```
integrations-actions.ts:255-258: limit: 50, sort: '-createdAt' — fixed cap, no totalDocs in response payload. AuditTrail.tsx: no page/offset state, renders state.rows directly with no count display.
```

- **Fix:** Include `totalDocs` in the audit endpoint response. Add a `page` query param to the endpoint (defaulting to 1) and pass it from the component. Render simple prev/next navigation below the table when totalDocs > 50, and a 'Showing N of M' label.

### [LOW] AnalyticsTab shows no loading indicator during initial data fetch — tab appears blank (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/integrations/AnalyticsTab.tsx:217`  **Category:** ux-question
- **Problem:** The tab returns null while integrations are loading because showGa4/showGsc/showClarity are all false (ga4/gsc/clarity are null, and configured === true fails). An editor opening a document with configured integrations sees a blank tab with no indication of activity until both parallel fetches complete. This is particularly visible on slow connections.
- **Evidence:**

```
AnalyticsTab.tsx:217-224: const showGa4 = ga4?.configured === true; — false while ga4 is null. if (!showGa4 && !showGsc && !showClarity) return null; — blank render during loading.
```

- **Fix:** Track a loading boolean initialised to true, set to false when the parallel fetches complete (regardless of success/failure). While loading is true, render a small loading indicator instead of returning null.

### [LOW] CollectionsMultiSelect and EventsMultiSelect control-wrapper div has interactive handlers but no role or tabIndex (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/integrations/CollectionsMultiSelect.tsx:92`  **Category:** accessibility
- **Problem:** The outer .cs-collections-select__control div handles onClick and onKeyDown but is a plain div with no role or tabIndex. Screen readers receive no announcement that this is an interactive container. The inner combobox input handles all real keyboard navigation correctly, so the div handlers are mostly redundant — but the pattern is incorrect and will be flagged by axe / Pa11y audits. The same pattern exists in EventsMultiSelect.tsx:93.
- **Evidence:**

```
CollectionsMultiSelect.tsx:92-99: <div className="cs-collections-select__control" onClick={...} onKeyDown={...}> — no role, no tabIndex, no aria attribute. EventsMultiSelect.tsx:93 is identical.
```

- **Fix:** Remove the onKeyDown handler from the div (the inner input already handles ArrowDown/Enter/Escape correctly). The onClick can remain as a click-target convenience. Optionally add role="group" and an aria-labelledby pointing to the field label to group the pills, input, and dropdown semantically.

---

## ui-auth-misc

> The codebase in this scope is generally well-structured and clearly written. The auth components, DSAR flows, and bulk-paste logic are solid. Three substantive bugs were found: (1) AuthorCredibilityField queries the Resources collection with an authors filter that does not exist on that collection, silently distorting published counts; (2) both DSAR endpoints (find and delete) load at most 1000 leads without pagination, silently missing matching records in large deployments; (3) AuthorCredibilityField sorts by publishedAt but reads updatedAt as the "last published" date shown to editors. Security: CmsAccountForm allows password/email change with no current-password verification (session-hijack vector). Convention: FaqBulkPaste imports useForm from @payloadcms/ui which is not in the project's data-layer-only allowlist.

Counts: 0 critical · 1 high · 3 medium · 8 low · 0 info

### [HIGH] DSAR find and delete endpoints scan only first 1000 leads — silently miss matches in large datasets (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/endpoints/leads-dsar.ts:64`  **Category:** logic-bug
- **Problem:** Both dsarFindEndpoint (line 64) and dsarDeleteEndpoint (line 131) call req.payload.find({ collection: 'leads', limit: 1000 }) without pagination. If the leads table exceeds 1000 rows, the in-memory email filter will only inspect the first 1000. Matching records beyond that threshold are not found (Art. 15) and not deleted (Art. 17). GDPR erasure requests that appear to complete successfully may leave PII in the database. This is a compliance risk once the database grows past 1000 leads.
- **Evidence:**

```
const result = await req.payload.find({ collection: 'leads', limit: 1000, depth: 0, overrideAccess: true }); // no pagination loop
```

- **Fix:** Replace the single-page find with a paginated loop: fetch page 1 with limit 200, then continue while result.hasNextPage is true. The in-memory email filter approach is also inherently scalability-limited; a better long-term fix is adding a dedicated hashed-email index column. For now, paginate to at least cover the full dataset. [verifier note: Verdict confirmed. Only mitigating factor is the threshold: the gap is latent until the leads table exceeds 1000 rows. A 365-day PII redaction purge job exists (per CLAUDE.md) which caps unbounded growth, but does not prevent exceeding 1000 within a retention window for a moderately active site, so high severity is justified — silent incomplete GDPR erasure that reports success is materially worse than a visible failure. Recommendation refinement: (1) For the find/export path a paginated loop or `pagination: false` both work. (2) For the DELETE path, do NOT delete while iterating pages — deleting shifts offsets and can skip rows; collect all matching IDs across pages first (loop until hasNextPage is false, or use pagination:false to fetch all docs in one query since the endpoint is admin-only and rate-limited), then delete. (3) The proposed limit:200 loop is fine but `pagination:false` is simpler here. The hashed-email index column is a sound long-term optimization but optional; correctness is fully restored by removing the 1000-row ceiling.]

### [MEDIUM] AuthorCredibilityField displays updatedAt as 'Most recent' publish date instead of publishedAt (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/AuthorCredibilityField.tsx:71`  **Category:** logic-bug
- **Problem:** The API query sorts by sort=-publishedAt and fetches limit=1 to find the most recently published document. However, line 82 reads r.docs?.[0]?.updatedAt as the candidate for the latest date, not publishedAt. A document published 2 years ago that was edited last week will display 'Most recent: last week' — giving editors a false impression of the author's recent publishing activity. The sort is correct but the field read is wrong.
- **Evidence:**

```
url.searchParams.set('sort', '-publishedAt'); // sort is right
...
const candidate = r.docs?.[0]?.updatedAt; // should be publishedAt
```

- **Fix:** Change the CountQueryResult type to include publishedAt?: string and read r.docs?.[0]?.publishedAt as the candidate. Also add select[publishedAt]=true to the query to ensure the field is returned at depth:0.

### [MEDIUM] CmsAccountForm allows password/email change without current-password verification (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/CmsAccountForm.tsx:51`  **Category:** security
- **Problem:** The onSubmit handler PATCHes /api/users/:id with the new password and email using only the session cookie for authentication. There is no 'current password' field that must be re-entered. Any active session — including one obtained via XSS, session fixation, or a stolen cookie — can silently change the account email and password without knowing the current credentials. Payload's default auth PATCH does not enforce currentPassword verification.
- **Evidence:**

```
const body = { name, email }; if (form.newPassword) body.password = form.newPassword; await fetch('/api/users/'+user.id, { method: 'PATCH', credentials: 'include', body: JSON.stringify(body) });
```

- **Fix:** Add a 'Current password' text input (type='password', autoComplete='current-password') and include currentPassword in the PATCH body when a new password is being set. Payload's auth PATCH accepts a currentPassword parameter for self-service password changes. For email changes, at minimum require re-entering the current password. This matches standard security practice for account settings.

### [MEDIUM] FaqBulkPaste imports useForm from @payloadcms/ui — not in the data-layer-only allowlist (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/FaqBulkPaste.tsx:3`  **Category:** convention-violation
- **Problem:** CLAUDE.md defines a strict allowlist of @payloadcms/ui hooks permitted in the codebase: useField, useFormFields, useDocumentInfo, useListQuery, useTableColumns, useSelection, useAuth, useConfig, useLocale, useTranslation, useDocumentDrawer. useForm is NOT in that list. The ESLint rule (Wave 8 flips from warn to error) will flag this import. useForm returns addFieldRow, removeFieldRow, dispatchFields, and getDataByPath — functionality that useFormFields alone does not provide.
- **Evidence:**

```
import { useField, useForm } from '@payloadcms/ui'; // useForm absent from allowlist
```

- **Fix:** Either (a) add useForm to the allowlist in CLAUDE.md and the ESLint rule if the team agrees it is data-layer-only (it is a context hook, not a render component), or (b) refactor FaqBulkPaste to avoid useForm by using useFormFields for field reads and dispatching via the internal form context directly. Option (a) is the lower-effort path since useForm exposes no render-side components.

### [LOW] DisableUserAction renders 'Disable account' button before document data is loaded (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/DisableUserAction.tsx:26`  **Category:** ux-question
- **Problem:** alreadyDisabled is computed from data?.enabled === false. When data is undefined (still loading), alreadyDisabled evaluates to false, so the button is rendered. If the user is already disabled, the button briefly appears and then hides once data loads. This causes a visible flash of the 'Disable account' button for accounts that are already disabled.
- **Evidence:**

```
const alreadyDisabled = (data as { enabled?: boolean } | null)?.enabled === false; // false when data=undefined
```

- **Fix:** Also hide the button when data is undefined: `const alreadyDisabled = !data || (data as { enabled?: boolean }).enabled === false;`. This keeps the button hidden until the current enabled state is confirmed.

### [LOW] ShareLinkDialog label field retains stale text when mint fails and dialog is closed (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/CopyPreviewLink.tsx:80`  **Category:** ux-question
- **Problem:** setLabel('') is only called on successful mint (line 80). If the mint fails (network error, 400/403 response), the label value persists in state. When the dialog is closed via the Cancel button and then reopened, the previous label text reappears in the input. A failed-mint label would rarely be the intended starting point for a new attempt.
- **Evidence:**

```
onClose(); setLabel(''); // only called on success path inside try block, not in finally
```

- **Fix:** Move setLabel('') to an onClose handler or reset state when open transitions from true to false. A `useEffect(() => { if (!open) setLabel(''); }, [open])` is the cleanest pattern.

### [LOW] LeadsCsvTruncationBanner monkey-patches window.fetch in a way that breaks under React StrictMode double-mount (confidence: medium · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/LeadsCsvTruncationBanner.tsx:31`  **Category:** logic-bug
- **Problem:** The useEffect stores const original = window.fetch and then sets window.fetch = wrapped. The cleanup restores window.fetch = original. Under React StrictMode the effects mount/cleanup/remount, which is safe. However, if two instances of this component ever mount simultaneously (currently prevented by mounting once in beforeListTable), the second cleanup would restore to wrapped1, leaving window.fetch permanently patched. The current mounting context prevents this, but the pattern is fragile for future reuse.
- **Evidence:**

```
const original = window.fetch; window.fetch = wrapped; return () => { window.fetch = original; };
```

- **Fix:** Add a guard against double-mounting: check if window.fetch already has a _cs_truncation_wrapped marker before patching. Alternatively, use a module-level singleton for the patch rather than mounting it in a React effect.

### [LOW] JourneyMirrorWarning useEffect .then() calls have no .catch() (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/JourneyMirrorWarning.tsx:44`  **Category:** error-handling
- **Problem:** Both useEffect blocks call fetchTarget(...).then(handler) without .catch(). While fetchTarget itself catches all errors internally and returns null, the .then() callback (if it somehow threw) would produce an unhandled promise rejection. The ESLint rule @typescript-eslint/no-floating-promises may flag this.
- **Evidence:**

```
fetchTarget(previousId, 'next').then((t) => { if (!cancelled) setPrevTarget(t); }); // no .catch()
```

- **Fix:** Add .catch(() => { /* no-op — fetchTarget already catches */ }) or use the void operator with an async IIFE: `void (async () => { const t = await fetchTarget(...); if (!cancelled) setPrevTarget(t); })()`. The async IIFE pattern also makes the cancelled check placement clearer.

### [LOW] LockedReason uses both title and aria-label — potential double-announcement for screen readers (confidence: medium · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/LockedReason.tsx:28`  **Category:** accessibility
- **Problem:** The outer <span> has role='img' with aria-label='${label}: ${props.reason}' and also title={props.reason}. Some screen readers (NVDA, JAWS) will read both the aria-label and the title attribute on a role='img' element, potentially announcing the reason twice. The title attribute is useful for mouse users' hover tooltip, but it should ideally be kept only for sighted users while the aria-label alone covers screen readers.
- **Evidence:**

```
role="img" aria-label={`${label}: ${props.reason}`} title={props.reason}
```

- **Fix:** Use a separate visually hidden span for the screen reader text and use title only for the hover tooltip on a presentational span. Alternatively, accept the minor duplication since role='img' + aria-label typically takes precedence over title in most screen readers.

### [LOW] FaqBulkPaste uses window.confirm for Clear All — breaks in headless/test environments (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/FaqBulkPaste.tsx:291`  **Category:** under-implemented
- **Problem:** The handleClearAll callback uses window.confirm() for the destruction confirmation. This is inconsistent with the rest of the codebase which uses @cleanstart/ui ConfirmDialog (e.g. FlaggedLeadsTab, DisableUserAction, DsarActionsPanel all use ConfirmDialog). window.confirm() also blocks the main thread, is styled by the browser (breaks branding), and cannot be tested without mocking.
- **Evidence:**

```
if (!window.confirm(`Clear all ${count} row${count === 1 ? '' : 's'}? This cannot be undone (until you save).`)) { return; }
```

- **Fix:** Replace window.confirm() with the @cleanstart/ui ConfirmDialog pattern: add confirmOpen/setConfirmOpen state, render a <ConfirmDialog> at the bottom of the return, and trigger it from handleClearAll. The portal-rendered button can set confirmOpen=true and the ConfirmDialog's onConfirm does the removal loop.

### [LOW] DsarActionsPanel uses alert() for error feedback — inconsistent with rest of codebase (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/DsarActionsPanel.tsx:49`  **Category:** convention-violation
- **Problem:** handleFind (line 49) and handleDelete (line 72) both use alert() for error feedback. The rest of the codebase uses either showToast() (ToastBus) or the Notice component for in-form feedback. alert() blocks the main thread, can't be styled, and is inconsistent UX. FlaggedLeadsTab also uses alert() at line 121.
- **Evidence:**

```
alert(`Find failed: ${body.error ?? 'unknown error'}`); // line 49
alert(`Delete failed: ${body.error ?? 'unknown error'}`); // line 72
```

- **Fix:** Replace alert() calls in DsarActionsPanel and FlaggedLeadsTab with showToast({ message, type: 'error' }) from '../ToastBus'. This is already imported for other components (e.g. CmsAccountForm) and provides consistent, non-blocking error feedback.
