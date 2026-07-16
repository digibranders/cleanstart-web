'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $isLinkNode,
  type LinkNode,
  TOGGLE_LINK_COMMAND,
} from '@payloadcms/richtext-lexical/client';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  type LexicalCommand,
  type LexicalEditor,
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
    (mode: Mode) => {
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
        const { node } = readLinkAtSelection(selection);
        if (node) {
          editLinkKeyRef.current = node.getKey();
          const fields = node.getFields() as unknown as Record<
            string,
            unknown
          >;
          initial = fieldsToValue(fields);
        }
      });
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
          openForCurrentSelection('create');
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        OPEN_LINK_POPOVER_EDIT,
        () => {
          openForCurrentSelection('edit');
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
    const root = editor.getRootElement();
    if (!root) return;
    const handleClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor || !root.contains(anchor)) return;
      // Defer so Lexical's own selection sync runs first; otherwise the
      // selection rect we read is stale.
      setTimeout(() => {
        editor.dispatchCommand(OPEN_LINK_POPOVER_EDIT, undefined);
      }, 0);
    };
    root.addEventListener('click', handleClick);
    return () => {
      root.removeEventListener('click', handleClick);
    };
  }, [editor]);

  useEffect(() => {
    if (!state) return;
    const handleDocClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
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
        // Node no longer exists (text was rewritten) — fall through to the
        // command path, which re-wraps the current selection.
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
        editor.update(() => {
          $setSelection(savedSelection.clone());
        });
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
        fields,
        selectedNodes: [],
        text: null,
      });
      editLinkKeyRef.current = null;
      createSelectionRef.current = null;
      setState(null);
    },
    [editor],
  );

  const handleRemove = useCallback(() => {
    const editKey = editLinkKeyRef.current;
    if (editKey) {
      let removed = false;
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
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    editLinkKeyRef.current = null;
    setState(null);
  }, [editor]);

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
