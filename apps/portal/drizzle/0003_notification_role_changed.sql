ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_kind_chk";--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_kind_chk') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_kind_chk" CHECK ("notifications"."kind" in ('registration_submitted', 'registration_accepted', 'registration_rejected', 'registration_resubmitted', 'registration_stage', 'registration_message', 'registration_expiring', 'registration_expired', 'extension_requested', 'extension_decided', 'document_new', 'access_requested', 'application_new', 'team_joined', 'team_removed', 'role_changed'));
  END IF;
END $$;--> statement-breakpoint
INSERT INTO "notification_prefs" ("user_id", "category", "email") SELECT "id", 'docs', false FROM "users" ON CONFLICT ("user_id", "category") DO NOTHING;
