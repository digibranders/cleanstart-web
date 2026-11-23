-- Optional poster image and captions file for a video document. Nullable keys on documents, so the documents row level
-- security policies cover them with no new table. Safe to run again.
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "poster_key" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "captions_key" text;
