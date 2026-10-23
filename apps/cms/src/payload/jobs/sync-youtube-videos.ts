import type { TaskConfig } from 'payload';

import { resolveYoutubeCredentials } from '../lib/integrations/credentials';
import { type RunSyncPayload, runYoutubeSync } from '../lib/videos/run-sync';
import { createYoutubeClient } from '../lib/videos/youtube-client';
import { createYoutubeRssClient } from '../lib/videos/youtube-rss-client';

/**
 * Hourly at minute 7 UTC: imports new public YouTube uploads as needs-review
 * drafts and refreshes the synced snapshot of existing ones. Uses the Data API
 * when YOUTUBE_API_KEY is set (duration, privacy, missing-video detection) and
 * the RSS feed otherwise. Gated by PAYLOAD_AUTO_RUN.
 */
export const syncYoutubeVideosTask: TaskConfig<'syncYoutubeVideos'> = {
  slug: 'syncYoutubeVideos',
  retries: 1,
  schedule: [{ cron: '7 * * * *', queue: 'youtubeVideosSync' }],
  handler: async ({ req }) => {
    const creds = resolveYoutubeCredentials();
    const mode = creds.apiKey ? 'api' : 'rss';
    // Logged every run so a missing key is visible, never silent.
    req.payload.logger.info({ mode }, 'syncYoutubeVideos starting');
    const result = await runYoutubeSync({
      payload: req.payload as unknown as RunSyncPayload,
      client: creds.apiKey ? createYoutubeClient({ apiKey: creds.apiKey }) : createYoutubeRssClient(),
      channelId: creds.channelId,
      autoPublish: process.env.VIDEOS_AUTO_PUBLISH === 'true',
    });
    return { output: { mode, ...result } };
  },
};
