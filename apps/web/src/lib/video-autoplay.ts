// One-shot "start this video when its page opens" flag. A click on a video link
// sets it; the watch page's player consumes it. A direct visit, a refresh or a
// crawler has no flag, so those never autoplay (and never pull in YouTube's
// player code before anyone asked for it).

const KEY = "cs:autoplay-video";

export function requestAutoplay(videoId: string): void {
  try {
    window.sessionStorage.setItem(KEY, videoId);
  } catch {
    // Storage blocked: the visitor just gets the poster and a play button.
  }
}

/** True once for the video a click asked for; clears the flag either way. */
export function consumeAutoplay(videoId: string): boolean {
  try {
    const requested = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return requested === videoId;
  } catch {
    return false;
  }
}
