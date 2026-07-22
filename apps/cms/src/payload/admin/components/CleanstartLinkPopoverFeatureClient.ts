'use client';

import {
  $isLinkNode,
  createClientFeature,
  toolbarFeatureButtonsGroupWithItems,
} from '@payloadcms/richtext-lexical/client';
import {
  $isRangeSelection,
  type BaseSelection,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';

import { LinkPopoverIcon } from './LinkPopoverIcon';
import {
  LinkPopoverPlugin,
  OPEN_LINK_POPOVER_CREATE,
  OPEN_LINK_POPOVER_EDIT,
} from './LinkPopoverPlugin';
import { StockToolbarSuppressorPlugin } from './StockToolbarSuppressorPlugin';
import { ToolbarTipsPlugin } from './ToolbarTipsPlugin';

const isInsideLink = (node: LexicalNode | null): boolean => {
  let current: LexicalNode | null = node;
  while (current) {
    if ($isLinkNode(current)) return true;
    current = current.getParent();
  }
  return false;
};

type ToolbarSelection = { selection: BaseSelection | null };

const linkToolbarItem = {
  ChildComponent: LinkPopoverIcon,
  isActive: ({ selection }: ToolbarSelection): boolean => {
    if (!$isRangeSelection(selection)) return false;
    return isInsideLink(selection.getNodes()[0] ?? null);
  },
  isEnabled: ({ selection }: ToolbarSelection): boolean => {
    if (!$isRangeSelection(selection)) return false;
    // Text selected → create (or re-wrap) a link around it.
    if (selection.getTextContent().length > 0) return true;
    // Collapsed caret inside an existing link → the button edits that link.
    // Without this branch the button is silently disabled after a plain
    // click into linked text — the reported "toolbar link button does
    // nothing" bug.
    return isInsideLink(selection.getNodes()[0] ?? null);
  },
  key: 'cs-link',
  label: 'Link (inline)',
  onSelect: ({
    editor,
    isActive,
  }: {
    editor: LexicalEditor;
    isActive: boolean;
  }): void => {
    editor.dispatchCommand(
      isActive ? OPEN_LINK_POPOVER_EDIT : OPEN_LINK_POPOVER_CREATE,
      undefined,
    );
  },
  order: 1,
};

const toolbarGroups = [toolbarFeatureButtonsGroupWithItems([linkToolbarItem])];

export const CleanstartLinkPopoverFeatureClient = createClientFeature(() => ({
  plugins: [
    {
      Component: LinkPopoverPlugin,
      position: 'floatingAnchorElem',
    },
    {
      Component: StockToolbarSuppressorPlugin,
      position: 'normal',
    },
    {
      Component: ToolbarTipsPlugin,
      position: 'normal',
    },
  ],
  toolbarFixed: { groups: toolbarGroups },
  toolbarInline: { groups: toolbarGroups },
}));
