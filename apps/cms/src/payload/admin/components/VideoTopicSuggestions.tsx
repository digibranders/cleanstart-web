'use client';

import { useField, useFormFields } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { type TopicRef, suggestTopicIds } from '../../lib/videos/topic-match';

type TopicDoc = { id: number | string; name?: string; aliases?: { value?: string }[] | null };
type Id = number | string;

const idOf = (entry: unknown): Id | null => {
  if (typeof entry === 'number' || typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object' && 'id' in entry) return (entry as { id: Id }).id;
  return null;
};

/**
 * Under the Topics field: topics whose name or alias appears in the video's YouTube tags or
 * hashtags, one click to add. Uses the same matching rule as the sync, so what the editor is
 * offered here is what an import would have pre-filled.
 */
export const VideoTopicSuggestions = (): ReactElement | null => {
  const { value, setValue } = useField<unknown[]>({ path: 'topics' });
  const tags = useFormFields(([fields]) =>
    Object.entries(fields)
      .filter(([key]) => key.startsWith('source.tags.') && key.endsWith('.value'))
      .map(([, field]) => field.value)
      .filter((tag): tag is string => typeof tag === 'string'),
  );
  const description = useFormFields(([fields]) => {
    const raw = fields['source.description']?.value;
    return typeof raw === 'string' ? raw : '';
  });
  const [topics, setTopics] = useState<(TopicRef & { name: string })[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/videoTopics?limit=200&depth=0', { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<{ docs?: TopicDoc[] }>) : { docs: [] }))
      .then(({ docs = [] }) => {
        if (cancelled) return;
        setTopics(
          docs.map((d) => ({
            id: d.id,
            name: d.name ?? '',
            aliases: (d.aliases ?? []).flatMap((a) => (a.value ? [a.value] : [])),
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = new Set((Array.isArray(value) ? value : []).map(idOf).filter((id): id is Id => id !== null));
  const suggested = suggestTopicIds({ tags, description }, topics)
    .filter((id) => !selected.has(id))
    .map((id) => topics.find((t) => t.id === id))
    .filter((t): t is TopicRef & { name: string } => t !== undefined);
  if (suggested.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', margin: '-8px 0 20px', fontSize: 13 }}>
      <span style={{ color: 'var(--theme-elevation-600)' }}>Suggested from the YouTube hashtags:</span>
      {suggested.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => setValue([...selected, topic.id])}
          style={{
            border: '1px solid var(--theme-elevation-150)',
            background: 'var(--theme-elevation-50)',
            borderRadius: 999,
            padding: '2px 10px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + {topic.name}
        </button>
      ))}
    </div>
  );
};

export default VideoTopicSuggestions;
