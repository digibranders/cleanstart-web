import { describe, expect, it } from 'vitest';

import { youtubeIdFrom } from './youtube-id';

const ID = 'uBItoX-x7Do';

describe('youtubeIdFrom', () => {
  it.each([
    ID,
    ` ${ID} `,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`,
    `youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
  ])('finds the id in %s', (input) => {
    expect(youtubeIdFrom(input)).toBe(ID);
  });

  it.each([
    '',
    '   ',
    'not a video',
    'https://vimeo.com/123456789',
    'https://www.youtube.com/channel/UC13c-XRmRlkWpp6WMG9SDjw',
    'https://www.youtube.com/watch?v=tooShort',
    'https://evil.example/watch?v=uBItoX-x7Do',
    'uBItoX-x7Do-extra',
  ])('rejects %j', (input) => {
    expect(youtubeIdFrom(input)).toBeNull();
  });

  it('handles missing input', () => {
    expect(youtubeIdFrom(null)).toBeNull();
    expect(youtubeIdFrom(undefined)).toBeNull();
  });
});
