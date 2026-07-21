'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $isLinkNode,
  type LinkNode,
  TOGGLE_LINK_COMMAND,
  useEditorConfigContext,
} from '@payloadcms/richtext-lexical/client';
import { useDocumentInfo, useField } from '@payloadcms/ui';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection,
  SELECTION_CHANGE_COMMAND,
  createCommand,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { fromStoredUrl, toStoredUrl } from './internal-routes';
import {
  LinkPopover,
  type LinkPopoverDoc,
  type LinkPopoverValue,
} from './LinkPopover';

// Two open-paths feed the popover:
//   * `OPEN_LINK_POPOVER_CREATE` — fired by our custom toolbar button
//     when the editor has a non-empty selection but no link wraps it.
//   * `OPEN_LINK_POPOVER_EDIT` — fired by the click handler on any
//     existing <a> in the editor (and re-used internally when the
//     toolbar button fires while caret is already inside a link).
// The stock Payload drawer is suppressed via CSS in LinkPopover.scss
// (`.link-editor` + the `.toolbar-popup__button-link` button).
export const OPEN_LINK_POPOVER_CREATE: LexicalCommand<void> = createCommand(
  'OPEN_LINK_POPOVER_CREATE',
);
export const OPEN_LINK_POPOVER_EDIT: LexicalCommand<void> = createCommand(
  'OPEN_LINK_POPOVER_EDIT',
);

const mergeCleanups = (
  ...cleanups: Array<() => void>
): (() => void) => {
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
};

// Pending link commits, keyed by the rich-text field's form path. MODULE
// scope, not a React ref: a stale `getFormState` response re-keys (re-mounts)
// the whole editor subtree, destroying this plugin instance — a ref-held
// pending value was lost at exactly the moment it was needed, which is how a
// created link could still vanish under prod latency. An entry lives until the
// server echoes a form state that contains it (content-acknowledged), a newer
// editor change supersedes it, or the safety timeout expires.
const PENDING_COMMIT_TTL_MS = 15_000;
const pendingCommits = new Map<string, { json: unknown; until: number }>();

// Key-order-insensitive deep equality. `getFormState` echoes come back from
// postgres with unstable JSON key order, so reference or stringify comparison
// misreads an acknowledged commit as unacknowledged.
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (a && b && typeof a === 'object') {
    if (Array.isArray(b)) return false;
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }
  return false;
};

type Mode = 'edit' | 'create';

type PopoverState = {
  initial: LinkPopoverValue;
  mode: Mode;
  rect: DOMRect;
};

const DEFAULT_VALUE: LinkPopoverValue = {
  doc: null,
  internalPath: null,
  linkType: 'internal',
  newTab: false,
  rel: 'follow',
  url: '',
};

// A relative path or anchor (e.g. `/about-us`, `#section`, `?q=1`)
// — treated as "internal" in the editor UI even though Payload stores
// it under `linkType: 'custom'` because there's no CMS doc behind it.
const isInternalPath = (raw: string | undefined | null): boolean => {
  if (typeof raw !== 'string' || raw.length === 0) return false;
  return (
    raw.startsWith('/') ||
    raw.startsWith('#') ||
    raw.startsWith('?')
  );
};

const getNativeSelectionRect = (editor: LexicalEditor): DOMRect | null => {
  const root = editor.getRootElement();
  if (!root) return null;
  const win = root.ownerDocument.defaultView;
  const native = win?.getSelection();
  if (!native || native.rangeCount === 0) return null;
  const range = native.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    // Collapsed selection at line start can give a zero rect — fall
    // back to the closest element rect so the popover still anchors.
    const node = native.anchorNode;
    const el =
      node instanceof Element
        ? node
        : (node?.parentElement ?? null);
    return el?.getBoundingClientRect() ?? null;
  }
  return rect;
};

const readLinkAtSelection = (
  selection: RangeSelection,
): { node: LinkNode | null; text: string } => {
  const nodes = selection.getNodes();
  const text = selection.getTextContent();
  for (const node of nodes) {
    let current: typeof node | null = node;
    while (current) {
      if ($isLinkNode(current)) {
        return { node: current, text };
      }
      current = current.getParent();
    }
  }
  return { node: null, text };
};

// The single LinkNode enclosing the ENTIRE selection, or null. This is the
// edit-vs-create discriminator: only a selection fully inside one link is an
// edit of that link. A selection that merely OVERLAPS a link (a phrase
// spanning plain text plus an already-linked word — routine in migrated,
// link-dense bodies) must be treated as create: targeting the inner link
// would rewrite that link's fields and silently never wrap the user's
// selection, which surfaced as "Add link does nothing / shows Update".
const $findSingleEnclosingLink = (
  selection: RangeSelection,
): LinkNode | null => {
  let enclosing: LinkNode | null = null;
  for (const node of selection.getNodes()) {
    let link: LinkNode | null = null;
    let current: LexicalNode | null = node;
    while (current) {
      if ($isLinkNode(current)) {
        link = current;
        break;
      }
      current = current.getParent();
    }
    if (!link) return null;
    if (enclosing && link.getKey() !== enclosing.getKey()) return null;
    enclosing = link;
  }
  return enclosing;
};

const extractDoc = (
  raw: unknown,
): { collection: string; id: string } | null => {
  if (!raw || typeof raw !== 'object') return null;
  const docObj = raw as { relationTo?: unknown; value?: unknown };
  if (typeof docObj.relationTo !== 'string') return null;
  const value = docObj.value;
  if (typeof value === 'string' || typeof value === 'number') {
    return { collection: docObj.relationTo, id: String(value) };
  }
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === 'string' || typeof id === 'number') {
      return { collection: docObj.relationTo, id: String(id) };
    }
  }
  return null;
};

const fieldsToValue = (
  fields: Record<string, unknown> | undefined,
): LinkPopoverValue => {
  const rawLinkType =
    fields?.linkType === 'internal' ? 'internal' : 'external';
  const rel =
    typeof fields?.rel === 'string' ? (fields.rel as string) : undefined;
  const docPick = extractDoc(fields?.doc);
  const doc: LinkPopoverDoc | null = docPick
    ? { collection: docPick.collection, id: docPick.id }
    : null;
  const rawUrl = typeof fields?.url === 'string' ? (fields.url as string) : '';
  // Storage holds an absolute URL (`https://cleanstart.com/news/foo`)
  // because Payload's sanitizer rejects bare paths. For display we
  // strip the site origin back to a path so the editor still sees
  // `/news/foo` under the Internal radio.
  const displayUrl = fromStoredUrl(rawUrl);
  const isPathInternal = !doc && isInternalPath(displayUrl);
  const linkType =
    rawLinkType === 'internal' || isPathInternal ? 'internal' : 'external';
  return {
    doc,
    internalPath: isPathInternal ? displayUrl : null,
    linkType,
    newTab: Boolean(fields?.newTab),
    rel: rel ?? (linkType === 'internal' ? 'follow' : 'nofollow'),
    url: displayUrl,
  };
};

const fetchDocTitle = async (
  collection: string,
  id: string,
): Promise<string | undefined> => {
  try {
    const response = await fetch(
      `/api/${collection}/${id}?depth=0`,
      { credentials: 'include' },
    );
    if (!response.ok) return undefined;
    const json = (await response.json()) as Record<string, unknown>;
    if (typeof json.title === 'string') return json.title;
    if (typeof json.name === 'string') return json.name;
    return undefined;
  } catch {
    return undefined;
  }
};

export function LinkPopoverPlugin({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): React.ReactElement | null {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  // This rich-text field's form path, read from the editor-config context Payload
  // populates for every field editor. Used to push link mutations straight into
  // the form value (below).
  const { fieldProps } = useEditorConfigContext();
  const fieldPath = (fieldProps as { path?: string } | null)?.path ?? '';
  const { setValue: setFieldValue, initialValue: fieldInitialValue } =
    useField<unknown>({ path: fieldPath });
  // Pending commits are keyed by document + field, NOT fieldPath alone: the
  // path (`body`) repeats across documents, and the module-level map outlives
  // client-side navigation — an unscoped key could resurrect one document's
  // body into another.
  const { collectionSlug, id: docId } = useDocumentInfo();
  const commitKey = fieldPath
    ? `${collectionSlug ?? ''}:${docId ?? ''}:${fieldPath}`
    : '';
  // After a link mutation we push the new value into the field (below). A
  // `getFormState` response already in flight — from the focus change that drove
  // the popover — can land right after and overwrite the field with the server's
  // PRE-link value, wiping the link (the reported "link disappears / doesn't
  // save"). A `getFormState` arrival is exactly what changes `initialValue`, so we
  // re-assert the committed value on each `initialValue` change until the server
  // echo CONTAINS it (deep-equal — content-acknowledged, not time-boxed: under
  // prod latency a stale response can land seconds later, after any fixed window).
  // `fieldInitialValue` is intentionally a dependency even though the body does not
  // read it beyond the ack check: an `initialValue` reference change is exactly the
  // signal that a `getFormState` response landed, which is when we must re-assert.
  useEffect(() => {
    if (!commitKey) return;
    const pending = pendingCommits.get(commitKey);
    if (!pending) return;
    if (
      Date.now() > pending.until ||
      deepEqual(fieldInitialValue, pending.json)
    ) {
      pendingCommits.delete(commitKey);
      return;
    }
    setFieldValue(pending.json);
  }, [commitKey, fieldInitialValue, setFieldValue]);
  // Resurrection after a stale re-mount: when a link-less `getFormState`
  // response lands, Payload's Field re-keys the editor subtree, re-mounting the
  // editor from the stale value and destroying the previous plugin instance.
  // This mount effect runs in the NEW instance: if a pending commit is still
  // unacknowledged, push it back into both the form value and the freshly
  // mounted editor so the link the user just created doesn't visibly vanish.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only by design
  useEffect(() => {
    if (!commitKey) return;
    const pending = pendingCommits.get(commitKey);
    if (!pending || Date.now() > pending.until) return;
    const current = editor.getEditorState().toJSON();
    const pendingJson = pending.json as { root?: unknown } | null;
    if (!pendingJson || typeof pendingJson !== 'object' || !pendingJson.root) {
      return;
    }
    if (deepEqual(current.root, pendingJson.root)) return;
    setFieldValue(pending.json);
    editor.setEditorState(
      editor.parseEditorState(
        pending.json as Parameters<typeof editor.parseEditorState>[0],
      ),
    );
  }, []);
  // While a commit is pending, any newer content change in the editor becomes
  // the pending value — the open editor is the source of truth, and a re-assert
  // must never roll back typing that happened after the link mutation.
  useEffect(() => {
    if (!commitKey) return;
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        const pending = pendingCommits.get(commitKey);
        if (!pending) return;
        pendingCommits.set(commitKey, {
          json: editorState.toJSON(),
          until: Date.now() + PENDING_COMMIT_TTL_MS,
        });
      },
    );
  }, [editor, commitKey]);
  // Commit the editor's committed state into the Payload form value as soon as a
  // link create/edit/remove reconciles. Our popover mutates the editor while focus
  // lives in the popover (editor blurred); the field's own `OnChangePlugin` gates
  // out blurred-editor updates, so the mutation never reaches the form value on its
  // own. A one-shot update listener reads the post-commit state and writes it to
  // the form value, marking the field modified so Save keeps the link. Reading
  // synchronously after dispatch would capture the PRE-mutation tree (Lexical
  // reconciles on a later tick), so we must use the listener, not a direct read.
  const registerCommitOnNextChange = useCallback((): (() => void) => {
    if (!commitKey) return () => {};
    // The listener only runs on a later tick, so referencing `unregister` inside
    // it before this `const` settles is safe (no TDZ at call time).
    const unregister = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        // Ignore the selection-only restore update; wait for the content change.
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        unregister();
        const json = editorState.toJSON();
        setFieldValue(json);
        // Guard the commit against late stale `getFormState` responses until
        // the server acknowledges it (see the re-assert effect above).
        pendingCommits.set(commitKey, {
          json,
          until: Date.now() + PENDING_COMMIT_TTL_MS,
        });
      },
    );
    return unregister;
  }, [editor, commitKey, setFieldValue]);
  // Key of the LinkNode under edit. Captured when the popover opens over an
  // existing link so the save can target that node directly instead of relying
  // on the editor's RangeSelection — which is lost once focus moves into the
  // popover inputs (collapsed caret selections do not survive the blur, so the
  // stock TOGGLE_LINK_COMMAND would no-op and the edit would silently revert).
  const editLinkKeyRef = useRef<string | null>(null);
  // Snapshot of the editor's RangeSelection captured the moment the popover
  // opens. Focus then moves into the popover inputs, so by save-time the live
  // editor selection is no longer a RangeSelection — the stock $toggleLink
  // would early-return and the new link would silently not be created. On save
  // (create path) we restore this snapshot so the command wraps the intended
  // text. Edit uses editLinkKeyRef instead and never needs this.
  const createSelectionRef = useRef<RangeSelection | null>(null);

  const close = useCallback(() => {
    editLinkKeyRef.current = null;
    createSelectionRef.current = null;
    setState(null);
    editor.focus();
  }, [editor]);

  const openForCurrentSelection = useCallback(
    () => {
      const rect = getNativeSelectionRect(editor);
      if (!rect) return;
      let initial: LinkPopoverValue = DEFAULT_VALUE;
      editLinkKeyRef.current = null;
      createSelectionRef.current = null;
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        // Snapshot the selection so a new link can be wrapped after focus
        // leaves the editor for the popover inputs.
        createSelectionRef.current = selection.clone();
        const node = $findSingleEnclosingLink(selection);
        if (node) {
          editLinkKeyRef.current = node.getKey();
          const fields = node.getFields() as unknown as Record<
            string,
            unknown
          >;
          initial = fieldsToValue(fields);
        }
      });
      // Which command opened the popover doesn't decide the mode — what the
      // selection actually encloses does. A CREATE from the toolbar with the
      // caret inside a link is really an edit of that link; an EDIT open
      // whose selection spans beyond the link must create/wrap, or the save
      // would target the inner link and drop the wider selection.
      const mode: Mode =
        editLinkKeyRef.current !== null ? 'edit' : 'create';
      setState({ initial, mode, rect });
      // Resolve the doc title in the background so the popover can
      // display "Blog: Some Title" instead of "blogs/<id>" when editing
      // an existing internal link.
      if (initial.doc && !initial.doc.title) {
        const { collection, id } = initial.doc;
        void fetchDocTitle(collection, id).then((title) => {
          if (!title) return;
          setState((current) =>
            current && current.initial.doc?.id === id
              ? {
                  ...current,
                  initial: {
                    ...current.initial,
                    doc: { collection, id, title },
                  },
                }
              : current,
          );
        });
      }
    },
    [editor],
  );

  useEffect(() => {
    return mergeCleanups(
      editor.registerCommand(
        OPEN_LINK_POPOVER_CREATE,
        () => {
          openForCurrentSelection();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        OPEN_LINK_POPOVER_EDIT,
        () => {
          openForCurrentSelection();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          if (!state || state.mode !== 'edit') return false;
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            setState(null);
            return false;
          }
          const { node } = readLinkAtSelection(selection);
          if (!node) setState(null);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, openForCurrentSelection, state]);

  useEffect(() => {
    const handleClick = (event: MouseEvent): void => {
      if (event.button !== 0) return;
      // Deliberate "follow the link" gesture — let Payload's stock
      // ClickableLinkPlugin handle it (opens in a new tab).
      if (event.metaKey || event.ctrlKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor || !editor.getRootElement()?.contains(anchor)) return;
      // Editor anchors are clickable again (pointer-events restored in
      // _editor.scss so this handler can fire at all). A plain click inside
      // the editor means "edit this link", not "follow it": preventDefault
      // stops the browser navigation, and stopImmediatePropagation stops the
      // stock ClickableLinkPlugin — a bubble listener on this same root whose
      // window.open ignores preventDefault. Caret placement is unaffected
      // (the browser sets it on mousedown, not click).
      event.preventDefault();
      event.stopImmediatePropagation();
      // Defer so Lexical's own selection sync runs first; otherwise the
      // selection rect we read is stale.
      setTimeout(() => {
        editor.dispatchCommand(OPEN_LINK_POPOVER_EDIT, undefined);
      }, 0);
    };
    // registerRootListener (not a one-shot getRootElement read): the
    // ContentEditable attaches AFTER this plugin's effects run, so
    // `editor.getRootElement()` is still null here and a listener bound to it
    // would never exist — clicking a link would silently do nothing. The root
    // listener fires with the element once it mounts and again on re-attach.
    // Capture phase, so it runs before the root's bubble listeners.
    return editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener('click', handleClick, true);
      rootElement?.addEventListener('click', handleClick, true);
    });
  }, [editor]);

  useEffect(() => {
    if (!state) return;
    const handleDocClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      // Selecting a result in the popover's own dropdown synchronously
      // unmounts that result (the results list closes on select), so by the
      // time this document-level `mousedown` handler runs the clicked node is
      // already detached from the DOM. `contains()` would then report it as
      // "outside" and wrongly dismiss the whole popover — the reported
      // "clicking the page suggestion makes the popover vanish" bug. A
      // detached target was inside our tree when the click landed, so treat
      // it as inside and do not dismiss.
      if (!target.isConnected) return;
      if (popoverRef.current?.contains(target)) return;
      const root = editor.getRootElement();
      if (root?.contains(target)) return;
      setState(null);
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [state, editor, close]);

  const handleSave = useCallback(
    (value: LinkPopoverValue): void => {
      // Every save serializes as `linkType: 'custom'` with a `url`
      // string. Reason: Payload's stock LinkNode.createDOM only sets
      // an `href` attribute when linkType === 'custom' — internal
      // links ship as bare `<a>` tags with no destination, which
      // doesn't render as a link in the editor. Doc-picker resolves
      // to a public path via the route map; static-page paths and
      // external URLs flow through here unchanged. The Internal vs
      // External UI affordance is restored on edit by detecting the
      // path shape (see fieldsToValue → isInternalPath).
      const trimmed = value.url.trim();
      if (!trimmed) return;
      const fields = {
        doc: null,
        linkType: 'custom' as const,
        newTab: value.newTab,
        rel: value.rel,
        url: toStoredUrl(trimmed),
      };

      // Editing an existing link: write straight to the captured node. This is
      // selection-independent, so it survives focus living in the popover (the
      // root cause of the previous "Update does nothing" behaviour).
      const editKey = editLinkKeyRef.current;
      if (editKey) {
        let updated = false;
        const cancelCommit = registerCommitOnNextChange();
        editor.update(() => {
          const node = $getNodeByKey(editKey);
          if ($isLinkNode(node)) {
            node.setFields(fields);
            updated = true;
          }
        });
        if (updated) {
          editLinkKeyRef.current = null;
          setState(null);
          return;
        }
        // Node no longer exists (text was rewritten) — no dirty update fired, so
        // drop the armed listener and fall through to the command path, which
        // re-wraps the current selection.
        cancelCommit();
      }

      // Creating a new link. Focus now lives in the popover, so the editor's
      // live selection is no longer the text the user picked — the stock
      // $toggleLink early-returns (no RangeSelection AND no selectedNodes) and
      // the link is silently never created (the reported "nothing happens" on
      // Add link). Restore the RangeSelection captured when the popover opened,
      // then dispatch: $toggleLink runs its own `selection.extract()` on the
      // restored selection and wraps it. Do NOT pre-extract/mutate the tree
      // here — that leaves the selection pointing at split nodes so the
      // command's own extract() finds nothing and no link is created.
      const savedSelection = createSelectionRef.current;
      if (savedSelection) {
        // `discrete: true` forces this selection restore to commit synchronously,
        // BEFORE the dispatch below. Without it the restore can still be pending
        // when `$toggleLink` runs, so the command reads the stale (collapsed) live
        // selection, extracts nothing, and silently creates no link — the reported
        // "nothing happens" when adding a link to a fresh selection.
        editor.update(
          () => {
            $setSelection(savedSelection.clone());
          },
          { discrete: true },
        );
      }
      // Arm the commit listener before the link-creating dispatch so it fires on
      // that update (the selection restore above is selection-only and skipped).
      registerCommitOnNextChange();
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
        fields,
        selectedNodes: [],
        text: null,
      });
      editLinkKeyRef.current = null;
      createSelectionRef.current = null;
      setState(null);
    },
    [editor, registerCommitOnNextChange],
  );

  const handleRemove = useCallback(() => {
    const editKey = editLinkKeyRef.current;
    if (editKey) {
      let removed = false;
      const cancelCommit = registerCommitOnNextChange();
      editor.update(() => {
        const node = $getNodeByKey(editKey);
        if ($isLinkNode(node)) {
          const children = node.getChildren();
          for (const child of children) node.insertBefore(child);
          node.remove();
          removed = true;
        }
      });
      if (removed) {
        editLinkKeyRef.current = null;
        setState(null);
        return;
      }
      cancelCommit();
    }
    registerCommitOnNextChange();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    editLinkKeyRef.current = null;
    setState(null);
  }, [editor, registerCommitOnNextChange]);

  if (!state) return null;

  return createPortal(
    <LinkPopover
      anchorRect={state.rect}
      anchorElem={anchorElem}
      initial={state.initial}
      mode={state.mode}
      onClose={close}
      onRemove={handleRemove}
      onSave={handleSave}
      ref={popoverRef}
    />,
    anchorElem,
  );
}
