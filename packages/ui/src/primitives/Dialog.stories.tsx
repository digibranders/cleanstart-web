import type { Story } from '@ladle/react';
import { useState } from 'react';

import { Dialog, DialogBody, DialogFooter, DialogHeader } from './Dialog';

export const Basic: Story = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} ariaLabel="Demo">
        <DialogHeader title="Hello" onClose={() => setOpen(false)} />
        <DialogBody>This is a centred modal built on the native &lt;dialog&gt; element.</DialogBody>
        <DialogFooter>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

Basic.storyName = 'Dialog · basic';
