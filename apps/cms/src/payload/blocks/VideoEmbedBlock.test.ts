import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';

import { VideoEmbedBlock } from './VideoEmbedBlock';
import { lexicalToPlainText } from '../lib/lexical/to-plain-text';

const field = (name: string): Field | undefined =>
  VideoEmbedBlock.fields.find((f) => 'name' in f && f.name === name);

describe('VideoEmbedBlock', () => {
  it('is the videoEmbed block the web renderer looks for', () => {
    expect(VideoEmbedBlock.slug).toBe('videoEmbed');
  });

  it('requires a video from the library, limited to published ones', () => {
    const video = field('video');
    expect(video).toMatchObject({
      type: 'relationship',
      relationTo: 'videos',
      required: true,
      filterOptions: { _status: { equals: 'published' } },
    });
  });

  it('has an optional caption', () => {
    const caption = field('caption');
    expect(caption).toMatchObject({ type: 'text' });
    expect(caption).not.toHaveProperty('required', true);
  });

  it('adds nothing to the plain text that search and word counts read', () => {
    const body = {
      root: {
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'Before.' }] },
          { type: 'block', fields: { blockType: 'videoEmbed', video: 7, caption: 'A caption' } },
          { type: 'paragraph', children: [{ type: 'text', text: 'After.' }] },
        ],
      },
    };
    expect(lexicalToPlainText(body)).toBe('Before. After.');
  });
});
