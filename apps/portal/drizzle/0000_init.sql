CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE SEQUENCE "public"."application_reference_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"note" text,
	"requested_role" text DEFAULT 'sales' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_requests_email_lower" CHECK ("access_requests"."email" = lower("access_requests"."email")),
	CONSTRAINT "access_requests_status_chk" CHECK ("access_requests"."status" in ('open', 'approved', 'declined'))
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"company" text NOT NULL,
	"domain" text NOT NULL,
	"applicant_name" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"phone" text,
	"category" text,
	"region" text,
	"reason" text,
	"source" text NOT NULL,
	"source_ref" text,
	"personal_email" boolean DEFAULT false NOT NULL,
	"existing_domain" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"decline_reason" text,
	"partner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_email_lower" CHECK ("applications"."email" = lower("applications"."email")),
	CONSTRAINT "applications_domain_lower" CHECK ("applications"."domain" = lower("applications"."domain")),
	CONSTRAINT "applications_source_chk" CHECK ("applications"."source" in ('portal', 'website')),
	CONSTRAINT "applications_status_chk" CHECK ("applications"."status" in ('new', 'approved', 'declined')),
	CONSTRAINT "applications_web_ref_chk" CHECK ("applications"."source" = 'portal' or "applications"."source_ref" is not null)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"actor_label" text NOT NULL,
	"actor_role" text,
	"who" text NOT NULL,
	"kind" text NOT NULL,
	"event" text NOT NULL,
	"action" text,
	"target" text,
	"text" text NOT NULL,
	"source" text DEFAULT 'portal' NOT NULL,
	"before" text,
	"after" text,
	"note" text,
	"partner_id" uuid,
	"subject_type" text,
	"subject_id" text,
	CONSTRAINT "audit_log_who_chk" CHECK ("audit_log"."who" in ('staff', 'partner', 'sync')),
	CONSTRAINT "audit_log_kind_chk" CHECK ("audit_log"."kind" in ('deal_decisions', 'partners', 'documents', 'people_access'))
);
--> statement-breakpoint
CREATE TABLE "auth_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_account_provider_key" UNIQUE("provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_two_factor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" uuid NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"failed_verification_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_audience" (
	"document_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_audience_document_id_partner_id_pk" PRIMARY KEY("document_id","partner_id")
);
--> statement-breakpoint
CREATE TABLE "document_opens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"file_key" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime" text NOT NULL,
	"original_name" text NOT NULL,
	"replaced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"purge_after" timestamp with time zone NOT NULL,
	"replaced_by" uuid,
	CONSTRAINT "document_versions_doc_version_key" UNIQUE("document_id","version")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"product" text NOT NULL,
	"summary" text,
	"audience_kind" text DEFAULT 'all' NOT NULL,
	"audience_categories" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_key" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime" text NOT NULL,
	"original_name" text NOT NULL,
	"duration_minutes" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"uploaded_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_type_chk" CHECK ("documents"."type" in ('datasheet', 'solution_sheet', 'battlecard', 'price_list', 'video', 'enablement_guide')),
	CONSTRAINT "documents_product_chk" CHECK ("documents"."product" in ('images', 'libraries', 'cleansight', 'all')),
	CONSTRAINT "documents_audience_chk" CHECK ("documents"."audience_kind" in ('all', 'categories', 'named')),
	CONSTRAINT "documents_categories_chk" CHECK ("documents"."audience_categories" <@ array['distributor', 'channel', 'integrator']::text[]),
	CONSTRAINT "documents_categories_required_chk" CHECK ("documents"."audience_kind" <> 'categories' or cardinality("documents"."audience_categories") > 0),
	CONSTRAINT "documents_version_chk" CHECK ("documents"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "hubspot_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"op" text NOT NULL,
	"subject_id" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hubspot_outbox_op_chk" CHECK ("hubspot_outbox"."op" in ('partner.upsert', 'user.upsert', 'registration.create', 'registration.update_end', 'registration.expire')),
	CONSTRAINT "hubspot_outbox_status_chk" CHECK ("hubspot_outbox"."status" in ('pending', 'done', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "hubspot_sync_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"kind" text NOT NULL,
	"partner_id" uuid,
	"role" text NOT NULL,
	"staff_region" text,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"resent_count" integer DEFAULT 0 NOT NULL,
	"invited_by" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_email_lower" CHECK ("invites"."email" = lower("invites"."email")),
	CONSTRAINT "invites_kind_chk" CHECK ("invites"."kind" in ('partner', 'staff')),
	CONSTRAINT "invites_kind_partner_chk" CHECK (("invites"."kind" = 'partner' and "invites"."partner_id" is not null and "invites"."role" in ('partner_admin', 'sales', 'technical') and "invites"."staff_region" is null)
        or ("invites"."kind" = 'staff' and "invites"."partner_id" is null and "invites"."role" in ('partner_manager', 'sales', 'marketing') and "invites"."staff_region" is not null))
);
--> statement-breakpoint
CREATE TABLE "notification_prefs" (
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"email" boolean NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_prefs_user_id_category_pk" PRIMARY KEY("user_id","category"),
	CONSTRAINT "notification_prefs_category_chk" CHECK ("notification_prefs"."category" in ('decision', 'stage', 'expiry', 'docs', 'team'))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_kind_chk" CHECK ("notifications"."kind" in ('registration_submitted', 'registration_accepted', 'registration_rejected', 'registration_resubmitted', 'registration_stage', 'registration_message', 'registration_expiring', 'registration_expired', 'extension_requested', 'extension_decided', 'document_new', 'access_requested', 'application_new', 'team_joined', 'team_removed'))
);
--> statement-breakpoint
CREATE TABLE "partner_checklist" (
	"partner_id" uuid NOT NULL,
	"step" text NOT NULL,
	"done_at" timestamp with time zone DEFAULT now() NOT NULL,
	"done_by" uuid,
	CONSTRAINT "partner_checklist_partner_id_step_pk" PRIMARY KEY("partner_id","step"),
	CONSTRAINT "partner_checklist_step_chk" CHECK ("partner_checklist"."step" in ('agreement', 'company', 'team', 'kickoff', 'playbook', 'deal'))
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"category" text NOT NULL,
	"region" text NOT NULL,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"status_before_suspend" text,
	"manager_id" uuid,
	"agreement_version" text,
	"agreement_accepted_at" timestamp with time zone,
	"website" text,
	"phone" text,
	"address" text,
	"about" text,
	"hubspot_company_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_domain_lower" CHECK ("partners"."domain" = lower("partners"."domain")),
	CONSTRAINT "partners_category_chk" CHECK ("partners"."category" in ('distributor', 'channel', 'integrator')),
	CONSTRAINT "partners_region_chk" CHECK ("partners"."region" in ('india', 'middle_east', 'elsewhere')),
	CONSTRAINT "partners_status_chk" CHECK ("partners"."status" in ('onboarding', 'active', 'inactive', 'suspended')),
	CONSTRAINT "partners_prior_status_chk" CHECK ("partners"."status_before_suspend" is null or "partners"."status_before_suspend" in ('onboarding', 'active', 'inactive', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "registration_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"partner_id" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"email" text,
	"phone" text,
	"hubspot_contact_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"partner_id" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"text" text NOT NULL,
	"by_label" text NOT NULL,
	"source" text NOT NULL,
	"auto" boolean DEFAULT false NOT NULL,
	CONSTRAINT "registration_events_source_chk" CHECK ("registration_events"."source" in ('portal', 'crm', 'system'))
);
--> statement-breakpoint
CREATE TABLE "registration_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"partner_id" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
	"author_id" uuid,
	"author_name" text NOT NULL,
	"author_org" text NOT NULL,
	"side" text NOT NULL,
	"body" text NOT NULL,
	"auto" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_messages_side_chk" CHECK ("registration_messages"."side" in ('partner', 'staff'))
);
--> statement-breakpoint
CREATE TABLE "registration_reminders" (
	"registration_id" uuid NOT NULL,
	"days_before" integer NOT NULL,
	"protection_end" date NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_reminders_registration_id_days_before_protection_end_pk" PRIMARY KEY("registration_id","days_before","protection_end")
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"registered_by" uuid,
	"registered_by_name" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_domain" text,
	"product" text NOT NULL,
	"region" text NOT NULL,
	"manager_id" uuid,
	"expected_close" text,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"stage" text DEFAULT 'Awaiting review' NOT NULL,
	"registered_on" date NOT NULL,
	"resubmitted_on" date,
	"decided_by" uuid,
	"decided_by_label" text,
	"decided_at" timestamp with time zone,
	"rejection_reason" text,
	"protection_end" date,
	"extension_status" text DEFAULT 'none' NOT NULL,
	"extension_requested_at" timestamp with time zone,
	"extension_reason" text,
	"extension_granted_at" timestamp with time zone,
	"extension_days" integer,
	"closed_on" date,
	"hubspot_deal_id" text,
	"hubspot_stage_id" text,
	"hubspot_synced_at" timestamp with time zone,
	"hubspot_missing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_status_chk" CHECK ("registrations"."status" in ('pending', 'accepted', 'rejected', 'expired', 'won', 'lost')),
	CONSTRAINT "registrations_region_chk" CHECK ("registrations"."region" in ('india', 'middle_east')),
	CONSTRAINT "registrations_product_chk" CHECK ("registrations"."product" in ('images', 'libraries', 'cleansight')),
	CONSTRAINT "registrations_extension_chk" CHECK ("registrations"."extension_status" in ('none', 'requested', 'granted', 'declined'))
);
--> statement-breakpoint
CREATE TABLE "staff_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"region" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_scopes_user_key" UNIQUE("user_id"),
	CONSTRAINT "staff_scopes_region_chk" CHECK ("staff_scopes"."region" in ('india', 'middle_east', 'all'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"kind" text NOT NULL,
	"partner_id" uuid,
	"role" text NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"title" text,
	"phone" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"password_changed_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"invited_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"hubspot_contact_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_lower" CHECK ("users"."email" = lower("users"."email")),
	CONSTRAINT "users_kind_chk" CHECK ("users"."kind" in ('partner', 'staff')),
	CONSTRAINT "users_status_chk" CHECK ("users"."status" in ('invited', 'active', 'disabled')),
	CONSTRAINT "users_kind_partner_role_chk" CHECK (("users"."kind" = 'partner' and "users"."partner_id" is not null and "users"."role" in ('partner_admin', 'sales', 'technical'))
        or ("users"."kind" = 'staff' and "users"."partner_id" is null and "users"."role" in ('partner_manager', 'sales', 'marketing')))
);
--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_two_factor" ADD CONSTRAINT "auth_two_factor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audience" ADD CONSTRAINT "document_audience_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audience" ADD CONSTRAINT "document_audience_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_opens" ADD CONSTRAINT "document_opens_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_opens" ADD CONSTRAINT "document_opens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_opens" ADD CONSTRAINT "document_opens_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_replaced_by_users_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_checklist" ADD CONSTRAINT "partner_checklist_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_checklist" ADD CONSTRAINT "partner_checklist_done_by_users_id_fk" FOREIGN KEY ("done_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_contacts" ADD CONSTRAINT "registration_contacts_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_contacts" ADD CONSTRAINT "registration_contacts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_events" ADD CONSTRAINT "registration_events_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_events" ADD CONSTRAINT "registration_events_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_messages" ADD CONSTRAINT "registration_messages_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_messages" ADD CONSTRAINT "registration_messages_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_messages" ADD CONSTRAINT "registration_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_reminders" ADD CONSTRAINT "registration_reminders_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_scopes" ADD CONSTRAINT "staff_scopes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "access_requests_open_key" ON "access_requests" USING btree ("partner_id","email") WHERE "access_requests"."status" = 'open';--> statement-breakpoint
CREATE UNIQUE INDEX "applications_reference_key" ON "applications" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_source_ref_key" ON "applications" USING btree ("source","source_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_open_portal_email_key" ON "applications" USING btree (lower("email")) WHERE "applications"."status" = 'new' and "applications"."source" = 'portal';--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "applications_domain_idx" ON "applications" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "audit_log_at_idx" ON "audit_log" USING btree ("at");--> statement-breakpoint
CREATE INDEX "audit_log_kind_idx" ON "audit_log" USING btree ("kind","at");--> statement-breakpoint
CREATE INDEX "audit_log_partner_idx" ON "audit_log" USING btree ("partner_id","at");--> statement-breakpoint
CREATE INDEX "auth_account_user_idx" ON "auth_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_session_token_key" ON "auth_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_session_user_idx" ON "auth_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_two_factor_user_idx" ON "auth_two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "document_audience_partner_idx" ON "document_audience" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "document_opens_doc_idx" ON "document_opens" USING btree ("document_id","partner_id");--> statement-breakpoint
CREATE INDEX "document_opens_partner_idx" ON "document_opens" USING btree ("partner_id","opened_at");--> statement-breakpoint
CREATE INDEX "document_versions_purge_idx" ON "document_versions" USING btree ("purge_after");--> statement-breakpoint
CREATE INDEX "documents_title_trgm" ON "documents" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "documents_listing_idx" ON "documents" USING btree ("updated_at") WHERE "documents"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "documents_file_key_key" ON "documents" USING btree ("file_key");--> statement-breakpoint
CREATE UNIQUE INDEX "hubspot_outbox_idempotency_key" ON "hubspot_outbox" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "hubspot_outbox_due_idx" ON "hubspot_outbox" USING btree ("next_attempt_at") WHERE "hubspot_outbox"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "invites_token_hash_key" ON "invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "invites_partner_idx" ON "invites" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "invites_email_idx" ON "invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_domain_key" ON "partners" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "partners_manager_idx" ON "partners" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "partners_name_trgm" ON "partners" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "registration_contacts_reg_idx" ON "registration_contacts" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "registration_contacts_partner_idx" ON "registration_contacts" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "registration_events_reg_idx" ON "registration_events" USING btree ("registration_id","at");--> statement-breakpoint
CREATE INDEX "registration_messages_reg_idx" ON "registration_messages" USING btree ("registration_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_open_unique" ON "registrations" USING btree ("partner_id",lower("customer_name"),"product") WHERE "registrations"."status" in ('pending', 'accepted');--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_hubspot_deal_key" ON "registrations" USING btree ("hubspot_deal_id") WHERE "registrations"."hubspot_deal_id" is not null;--> statement-breakpoint
CREATE INDEX "registrations_partner_status_idx" ON "registrations" USING btree ("partner_id","status");--> statement-breakpoint
CREATE INDEX "registrations_queue_idx" ON "registrations" USING btree ("status","region","registered_on");--> statement-breakpoint
CREATE INDEX "registrations_protection_end_idx" ON "registrations" USING btree ("protection_end") WHERE "registrations"."status" = 'accepted';--> statement-breakpoint
CREATE INDEX "registrations_customer_trgm" ON "registrations" USING gin ("customer_name" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_partner_idx" ON "users" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "users_name_trgm" ON "users" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "users_email_trgm" ON "users" USING gin ("email" gin_trgm_ops);