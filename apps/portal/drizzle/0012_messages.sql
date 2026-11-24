-- Messages: partner and staff chat (direct chats and groups, receipts, attachments, reactions, pins, typing, presence).
-- Access is members only (see rls.sql). Safe to run again.
CREATE TABLE IF NOT EXISTS "chat_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" text NOT NULL,
  "partner_id" uuid,
  "title" text,
  "created_by" uuid NOT NULL,
  "member_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  "direct_key" text,
  "last_msg_seq" bigint DEFAULT 0 NOT NULL,
  "rev" bigint DEFAULT 0 NOT NULL,
  "last_message_at" timestamp with time zone,
  "last_preview" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_conversations_kind_chk" CHECK ("kind" in ('direct', 'group')),
  CONSTRAINT "chat_conversations_title_chk" CHECK ("kind" = 'direct' or ("title" is not null and length(btrim("title")) > 0)),
  CONSTRAINT "chat_conversations_direct_chk" CHECK (("kind" = 'direct') = ("direct_key" is not null))
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_members" (
  "conversation_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "display_name" text NOT NULL,
  "org" text NOT NULL,
  "is_staff" boolean NOT NULL,
  "role" text DEFAULT 'member' NOT NULL,
  "last_read_seq" bigint DEFAULT 0 NOT NULL,
  "last_delivered_seq" bigint DEFAULT 0 NOT NULL,
  "muted_until" timestamp with time zone,
  "digest_seq" bigint DEFAULT 0 NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  "left_at" timestamp with time zone,
  CONSTRAINT "chat_members_conversation_id_user_id_pk" PRIMARY KEY ("conversation_id", "user_id"),
  CONSTRAINT "chat_members_role_chk" CHECK ("role" in ('owner', 'member'))
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "seq" bigint NOT NULL,
  "rev" bigint NOT NULL,
  "kind" text DEFAULT 'text' NOT NULL,
  "sender_id" uuid,
  "sender_name" text NOT NULL,
  "sender_org" text NOT NULL,
  "body" text DEFAULT '' NOT NULL,
  "reply_to_id" uuid,
  "mentions" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  "refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "edited_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_messages_kind_chk" CHECK ("kind" in ('text', 'system'))
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "partner_id" uuid,
  "message_id" uuid,
  "uploader_id" uuid NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "mime" text NOT NULL,
  "size" bigint NOT NULL,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_attachments_size_chk" CHECK ("size" > 0)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_reactions" (
  "conversation_id" uuid NOT NULL,
  "message_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "emoji" text NOT NULL,
  "user_name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_reactions_message_id_user_id_emoji_pk" PRIMARY KEY ("message_id", "user_id", "emoji"),
  CONSTRAINT "chat_reactions_emoji_chk" CHECK ("emoji" in ('thumbs_up', 'check', 'heart', 'party', 'laugh', 'thanks'))
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_pins" (
  "conversation_id" uuid NOT NULL,
  "message_id" uuid NOT NULL,
  "pinned_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_pins_conversation_id_message_id_pk" PRIMARY KEY ("conversation_id", "message_id")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_typing" (
  "conversation_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_typing_conversation_id_user_id_pk" PRIMARY KEY ("conversation_id", "user_id")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_presence" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "seen_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('chat_conversations', 'chat_conversations_partner_id_partners_id_fk', 'FOREIGN KEY ("partner_id") REFERENCES "partners"("id")'),
    ('chat_conversations', 'chat_conversations_created_by_users_id_fk', 'FOREIGN KEY ("created_by") REFERENCES "users"("id")'),
    ('chat_members', 'chat_members_conversation_id_fk', 'FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id")'),
    ('chat_members', 'chat_members_user_id_users_id_fk', 'FOREIGN KEY ("user_id") REFERENCES "users"("id")'),
    ('chat_messages', 'chat_messages_conversation_id_fk', 'FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id")'),
    ('chat_messages', 'chat_messages_sender_id_users_id_fk', 'FOREIGN KEY ("sender_id") REFERENCES "users"("id")'),
    ('chat_messages', 'chat_messages_reply_to_id_fk', 'FOREIGN KEY ("reply_to_id") REFERENCES "chat_messages"("id")'),
    ('chat_attachments', 'chat_attachments_conversation_id_fk', 'FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id")'),
    ('chat_attachments', 'chat_attachments_partner_id_partners_id_fk', 'FOREIGN KEY ("partner_id") REFERENCES "partners"("id")'),
    ('chat_attachments', 'chat_attachments_message_id_fk', 'FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id")'),
    ('chat_attachments', 'chat_attachments_uploader_id_users_id_fk', 'FOREIGN KEY ("uploader_id") REFERENCES "users"("id")'),
    ('chat_reactions', 'chat_reactions_conversation_id_fk', 'FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id")'),
    ('chat_reactions', 'chat_reactions_message_id_fk', 'FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id")'),
    ('chat_reactions', 'chat_reactions_user_id_users_id_fk', 'FOREIGN KEY ("user_id") REFERENCES "users"("id")'),
    ('chat_pins', 'chat_pins_conversation_id_fk', 'FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id")'),
    ('chat_pins', 'chat_pins_message_id_fk', 'FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id")'),
    ('chat_pins', 'chat_pins_pinned_by_users_id_fk', 'FOREIGN KEY ("pinned_by") REFERENCES "users"("id")'),
    ('chat_typing', 'chat_typing_conversation_id_fk', 'FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id")'),
    ('chat_typing', 'chat_typing_user_id_users_id_fk', 'FOREIGN KEY ("user_id") REFERENCES "users"("id")'),
    ('chat_presence', 'chat_presence_user_id_users_id_fk', 'FOREIGN KEY ("user_id") REFERENCES "users"("id")')
  ) AS v(tbl, name, def) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = r.name) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I %s', r.tbl, r.name, r.def);
    END IF;
  END LOOP;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chat_conversations_direct_key" ON "chat_conversations" ("direct_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_conversations_members_gin" ON "chat_conversations" USING gin ("member_ids");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_conversations_partner_idx" ON "chat_conversations" ("partner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_members_user_idx" ON "chat_members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chat_messages_conv_seq_key" ON "chat_messages" ("conversation_id", "seq");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_conv_rev_idx" ON "chat_messages" ("conversation_id", "rev");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_body_trgm" ON "chat_messages" USING gin ("body" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chat_attachments_key_key" ON "chat_attachments" ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_attachments_message_idx" ON "chat_attachments" ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_attachments_partner_idx" ON "chat_attachments" ("partner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_reactions_conv_idx" ON "chat_reactions" ("conversation_id");--> statement-breakpoint
-- A mention notification and the new email category (default on for everyone who exists today).
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_kind_chk";--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_kind_chk') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_kind_chk" CHECK ("notifications"."kind" in ('registration_submitted', 'registration_accepted', 'registration_rejected', 'registration_resubmitted', 'registration_stage', 'registration_message', 'registration_expiring', 'registration_expired', 'extension_requested', 'extension_decided', 'document_new', 'access_requested', 'application_new', 'team_joined', 'team_removed', 'role_changed', 'material_request_update', 'chat_mention'));
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "notification_prefs" DROP CONSTRAINT IF EXISTS "notification_prefs_category_chk";--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_prefs_category_chk') THEN
    ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_category_chk" CHECK ("notification_prefs"."category" in ('decision', 'stage', 'expiry', 'docs', 'team', 'messages'));
  END IF;
END $$;--> statement-breakpoint
INSERT INTO "notification_prefs" ("user_id", "category", "email") SELECT "id", 'messages', true FROM "users" ON CONFLICT ("user_id", "category") DO NOTHING;
