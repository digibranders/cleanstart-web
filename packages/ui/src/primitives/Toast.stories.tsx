import type { Story } from '@ladle/react';
import type { ReactElement } from 'react';

import { ToastProvider, useToast } from './Toast';

const Inner = (): ReactElement => {
  const { push } = useToast();
  return (
    <div style={{ padding: 40, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => push({ message: 'Saved.', tone: 'success' })}>
        Success
      </button>
      <button type="button" onClick={() => push({ message: 'Heads up.', tone: 'warning' })}>
        Warning
      </button>
      <button
        type="button"
        onClick={() =>
          push({
            title: 'Couldn’t save',
            message: 'Network error.',
            tone: 'error',
            duration: 0,
            action: { label: 'Retry', onClick: () => {} },
          })
        }
      >
        Error (sticky)
      </button>
    </div>
  );
};

export const Basic: Story = () => (
  <ToastProvider>
    <Inner />
  </ToastProvider>
);

Basic.storyName = 'Toast · basic';
