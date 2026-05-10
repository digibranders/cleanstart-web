import type { Story } from '@ladle/react';
import { useState } from 'react';

import { DateTimePicker } from './DateTimePicker';

export const DateOnly: Story = () => {
  const [v, setV] = useState<string | null>(null);
  return (
    <div style={{ padding: 40 }}>
      <DateTimePicker value={v} onChange={setV} mode="date" />
      <pre>{v ?? '(empty)'}</pre>
    </div>
  );
};

export const DateTime: Story = () => {
  const [v, setV] = useState<string | null>(null);
  return (
    <div style={{ padding: 40 }}>
      <DateTimePicker value={v} onChange={setV} mode="datetime" timezone="Asia/Kolkata" />
      <pre>{v ?? '(empty)'}</pre>
    </div>
  );
};

DateOnly.storyName = 'DateTimePicker · date only';
DateTime.storyName = 'DateTimePicker · date + time';
