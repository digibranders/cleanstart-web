import { describe, expect, it } from 'vitest';
import { parsePlaylistId } from './playlist-id';

const ID = 'PLabcdEFGH1234567890_-xyz';

describe('parsePlaylistId', () => {
  it.each([
    ['a bare id', ID],
    ['a bare id with surrounding whitespace', `  ${ID}\n`],
    ['a playlist URL', `https://www.youtube.com/playlist?list=${ID}`],
    ['a watch URL inside a playlist', `https://www.youtube.com/watch?v=AAAAAAAAAAA&list=${ID}&index=2`],
    ['a mobile URL', `https://m.youtube.com/playlist?list=${ID}`],
    ['a bare-domain URL', `https://youtube.com/playlist?list=${ID}`],
  ])('reads %s', (_label, raw) => {
    expect(parsePlaylistId(raw)).toBe(ID);
  });

  it.each([
    ['empty', ''],
    ['too short', 'PL123'],
    ['spaces inside', 'PL abc def ghi jkl'],
    ['a URL on another host', `https://evil.example/playlist?list=${ID}`],
    ['a lookalike host', `https://youtube.com.evil.example/playlist?list=${ID}`],
    ['a URL with no list', 'https://www.youtube.com/watch?v=AAAAAAAAAAA'],
    ['a URL with a malformed list', 'https://www.youtube.com/playlist?list=a%20b'],
    ['a non-http scheme', `javascript://www.youtube.com/playlist?list=${ID}`],
  ])('rejects %s', (_label, raw) => {
    expect(parsePlaylistId(raw)).toBeNull();
  });
});
