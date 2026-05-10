import type { Story } from '@ladle/react';
import { useRef, useState } from 'react';

import { DropdownMenu } from './DropdownMenu';

export const Basic: Story = () => {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 40 }}>
      <button ref={anchorRef} type="button" onClick={() => setOpen((o) => !o)}>
        Actions
      </button>
      <DropdownMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        ariaLabel="Demo actions"
        items={[
          { kind: 'label', id: 'lbl', label: 'Document' },
          { kind: 'item', id: 'edit', label: 'Edit', shortcut: '⌘E', onSelect: () => {} },
          { kind: 'item', id: 'dup', label: 'Duplicate', onSelect: () => {} },
          { kind: 'separator', id: 'sep' },
          {
            kind: 'item',
            id: 'del',
            label: 'Delete',
            tone: 'danger',
            onSelect: () => {},
          },
        ]}
      />
    </div>
  );
};

Basic.storyName = 'DropdownMenu · basic';
