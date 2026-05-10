import type { Story } from '@ladle/react';

import { Tooltip } from './Tooltip';

export const Basic: Story = () => (
  <div style={{ padding: 80 }}>
    <Tooltip content="This is a tooltip">
      <button type="button">Hover or focus me</button>
    </Tooltip>
  </div>
);

Basic.storyName = 'Tooltip · basic';
