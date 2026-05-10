import type { Story } from '@ladle/react';
import { useState } from 'react';

import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from './Drawer';

export const Right: Story = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} ariaLabel="Demo" side="right" size="md">
        <DrawerHeader title="Demo drawer" onClose={() => setOpen(false)} subtitle="A side panel." />
        <DrawerBody>
          <p>Content lives here. Esc dismisses; click outside dismisses.</p>
        </DrawerBody>
        <DrawerFooter>
          <button type="button" onClick={() => setOpen(false)}>
            Done
          </button>
        </DrawerFooter>
      </Drawer>
    </>
  );
};

Right.storyName = 'Drawer · right side';
