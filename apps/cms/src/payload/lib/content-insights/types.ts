export interface ContentDocRecord {
  collection: string;
  id: string;
  slug: string;
  title: string;
  url: string;
  authorLabels: string[];
  categoryLabels: string[];
  publishedAt: string | null;
  updatedAt: string | null;
  sessionsRecent: number;
  sessionsPrior: number;
  usersRecent: number;
  conversionsRecent: number;
  clicks: number;
  impressions: number;
  position: number;
  indexedProxy: boolean;
}

export interface SnapshotQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SnapshotQueryPageRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface ContentSnapshot {
  capturedAt: string;
  windows: { recentDays: number; priorDays: number; gscDays: number };
  docs: ContentDocRecord[];
  queries: SnapshotQueryRow[];
  queryPages: SnapshotQueryPageRow[];
}

export interface DecayRow {
  collection: string;
  id: string;
  title: string;
  url: string;
  updatedAt: string | null;
  sessionsRecent: number;
  sessionsPrior: number;
  /** Negative = decline, e.g. -0.42 for a 42% drop. */
  lossPct: number;
  /** `sessionsPrior - sessionsRecent` (positive when declining). */
  lossAbs: number;
  /** `updatedAt` older than `STALE_MONTHS`. */
  stale: boolean;
}

export interface LeaderboardRow {
  label: string;
  docCount: number;
  sessions: number;
  clicks: number;
  conversions: number;
}

export interface LeaderboardsSection {
  byAuthor: LeaderboardRow[];
  byCategory: LeaderboardRow[];
}

export interface OrphanRow {
  collection: string;
  id: string;
  title: string;
  url: string;
  publishedAt: string | null;
  sessionsRecent: number;
  impressions: number;
}

export interface IndexationCollectionRow {
  collection: string;
  published: number;
  indexed: number;
  /** `indexed / published`, 0..1. */
  coverage: number;
  notIndexed: Array<{ id: string; title: string; url: string }>;
}

export interface VelocityBucket {
  label: string;
  docCount: number;
  avgSessions: number;
  totalSessions: number;
}

export interface AttributionRow {
  collection: string;
  id: string;
  title: string;
  url: string;
  conversions: number;
}

export interface StrikingDistanceRow {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface LowCtrRow {
  query: string;
  position: number;
  ctr: number;
  expectedCtr: number;
  missedClicks: number;
}

export interface CannibalizationPage {
  collection: string;
  id: string;
  title: string;
  url: string;
  impressions: number;
  position: number;
}

export interface CannibalizationRow {
  query: string;
  totalImpressions: number;
  pages: CannibalizationPage[];
}

export interface ContentInsightsResponse {
  ok: boolean;
  configured: boolean;
  capturedAt: string | null;
  fromCache: boolean;
  keyEventsConfigured: boolean;
  sections: {
    decay: DecayRow[];
    leaderboards: LeaderboardsSection;
    orphans: OrphanRow[];
    indexation: IndexationCollectionRow[];
    velocity: VelocityBucket[];
    attribution: AttributionRow[];
    strikingDistance: StrikingDistanceRow[];
    lowCtr: LowCtrRow[];
    cannibalization: CannibalizationRow[];
  } | null;
}
