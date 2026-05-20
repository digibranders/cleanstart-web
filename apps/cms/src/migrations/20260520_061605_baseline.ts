import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor', 'author');
  CREATE TYPE "public"."enum_media_folder" AS ENUM('web/blog', 'web/news', 'web/guide', 'web/resource', 'web/event', 'web/webinar', 'web/job', 'web/author', 'web/about', 'web/page', 'web/general');
  CREATE TYPE "public"."enum_redirects_status" AS ENUM('301', '302', '307', '308', '410');
  CREATE TYPE "public"."enum_redirects_source" AS ENUM('manual', 'slug-change', 'archive-with-redirect', 'migration-seed');
  CREATE TYPE "public"."enum_broken_links_status" AS ENUM('ok', 'broken', 'redirect', 'network');
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('lead_deleted', 'lead_exported', 'dsar_export', 'dsar_erasure', 'schema_override_changed', 'user_disabled', 'content_reassigned', 'display_publish_date_overridden');
  CREATE TYPE "public"."enum_webhooks_dead_letter_event" AS ENUM('document.published', 'lead.submitted');
  CREATE TYPE "public"."enum_webhooks_dead_letter_destination_kind" AS ENUM('teams', 'generic');
  CREATE TYPE "public"."enum_integrations_routing_events" AS ENUM('document.published', 'lead.submitted');
  CREATE TYPE "public"."enum_integrations_routing_collections" AS ENUM('blogs', 'news', 'guides', 'resources', 'knowledgeBase', 'events', 'webinars', 'jobs', 'pages');
  CREATE TYPE "public"."enum_integrations_teams_config_mentions_trigger_on" AS ENUM('document.published', 'lead.submitted');
  CREATE TYPE "public"."enum_integrations_kind" AS ENUM('teamsWorkflow', 'genericWebhook', 'hubspotCrm', 'ga4DataApi', 'gscSearchAnalyticsApi', 'gscUrlInspectionApi', 'msClarity', 'cloudflareWebAnalytics', 'calComInbound', 'brevoBounceCallback', 'zohoCrm');
  CREATE TYPE "public"."enum_integrations_hubspot_config_write_mode" AS ENUM('contactOnly', 'contactAndLead');
  CREATE TYPE "public"."enum_integrations_hubspot_config_default_lifecycle_stage" AS ENUM('subscriber', 'lead', 'marketingqualifiedlead', 'salesqualifiedlead', 'opportunity', 'customer', 'evangelist', 'other');
  CREATE TYPE "public"."enum_integrations_hubspot_config_default_lead_status" AS ENUM('NEW', 'OPEN', 'IN_PROGRESS', 'OPEN_DEAL', 'UNQUALIFIED', 'ATTEMPTED_TO_CONTACT', 'CONNECTED', 'BAD_TIMING');
  CREATE TYPE "public"."enum_integrations_source" AS ENUM('db', 'env');
  CREATE TYPE "public"."enum_analytics_cache_env" AS ENUM('production', 'staging', 'development');
  CREATE TYPE "public"."enum_analytics_cache_provider" AS ENUM('ga4DataApi', 'gscSearchAnalyticsApi', 'gscUrlInspectionApi', 'msClarity', 'cloudflareWebAnalytics');
  CREATE TYPE "public"."enum_analytics_cache_scope" AS ENUM('global', 'document');
  CREATE TYPE "public"."enum_authors_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_authors_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_seo_max_image_preview" AS ENUM('standard', 'large', 'none');
  CREATE TYPE "public"."enum_authors_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__authors_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__authors_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__authors_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_categories_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_categories_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_categories_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__categories_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__categories_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__categories_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_news_categories_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_news_categories_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_news_categories_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_categories_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__news_categories_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__news_categories_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_knowledge_categories_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_knowledge_categories_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_knowledge_categories_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__knowledge_categories_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__knowledge_categories_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__knowledge_categories_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_job_locations_type" AS ENUM('country', 'region', 'city');
  CREATE TYPE "public"."enum_forms_fields_conditions_rules_operator" AS ENUM('equals', 'notEquals', 'contains');
  CREATE TYPE "public"."enum_forms_fields_type" AS ENUM('text', 'email', 'textarea', 'select', 'checkbox', 'consent');
  CREATE TYPE "public"."enum_forms_fields_conditions_mode" AS ENUM('all', 'any');
  CREATE TYPE "public"."enum_forms_crm_handlers" AS ENUM('hubspot', 'salesforce');
  CREATE TYPE "public"."enum_forms_post_submit_kind" AS ENUM('message', 'redirect');
  CREATE TYPE "public"."enum_forms_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__forms_v_version_fields_conditions_rules_operator" AS ENUM('equals', 'notEquals', 'contains');
  CREATE TYPE "public"."enum__forms_v_version_fields_type" AS ENUM('text', 'email', 'textarea', 'select', 'checkbox', 'consent');
  CREATE TYPE "public"."enum__forms_v_version_fields_conditions_mode" AS ENUM('all', 'any');
  CREATE TYPE "public"."enum__forms_v_version_crm_handlers" AS ENUM('hubspot', 'salesforce');
  CREATE TYPE "public"."enum__forms_v_version_post_submit_kind" AS ENUM('message', 'redirect');
  CREATE TYPE "public"."enum__forms_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_leads_synced_to_status" AS ENUM('pending', 'synced', 'failed', 'skipped');
  CREATE TYPE "public"."enum_leads_email_health" AS ENUM('good', 'soft_bounce', 'hard_bounce', 'complaint', 'unsubscribed');
  CREATE TYPE "public"."enum_blogs_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_blogs_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_blogs_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_blogs_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_blogs_toc_depth" AS ENUM('h2', 'h2_h3', 'h2_h3_h4');
  CREATE TYPE "public"."enum_blogs_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_blogs_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_blogs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__blogs_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__blogs_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__blogs_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__blogs_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__blogs_v_version_toc_depth" AS ENUM('h2', 'h2_h3', 'h2_h3_h4');
  CREATE TYPE "public"."enum__blogs_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__blogs_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__blogs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_news_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_news_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_news_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_news_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_news_press_type" AS ENUM('press-release', 'news', 'announcement', 'feature');
  CREATE TYPE "public"."enum_news_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_news_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__news_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__news_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__news_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__news_v_version_press_type" AS ENUM('press-release', 'news', 'announcement', 'feature');
  CREATE TYPE "public"."enum__news_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__news_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_guides_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_guides_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_guides_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_guides_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_guides_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_guides_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guides_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__guides_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__guides_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__guides_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__guides_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__guides_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_resources_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_resources_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_resources_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_resources_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_resources_type" AS ENUM('whitepaper', 'ebook', 'datasheet', 'architecture-insights', 'report');
  CREATE TYPE "public"."enum_resources_access_level" AS ENUM('public', 'lead-gated', 'customer-only');
  CREATE TYPE "public"."enum_resources_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_resources_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_resources_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__resources_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__resources_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__resources_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__resources_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__resources_v_version_type" AS ENUM('whitepaper', 'ebook', 'datasheet', 'architecture-insights', 'report');
  CREATE TYPE "public"."enum__resources_v_version_access_level" AS ENUM('public', 'lead-gated', 'customer-only');
  CREATE TYPE "public"."enum__resources_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__resources_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__resources_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_knowledge_base_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_knowledge_base_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_knowledge_base_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_knowledge_base_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_knowledge_base_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_knowledge_base_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_knowledge_base_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__knowledge_base_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__knowledge_base_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__knowledge_base_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__knowledge_base_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__knowledge_base_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__knowledge_base_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__knowledge_base_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_events_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_events_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_events_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_events_registration_mode" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_events_event_status" AS ENUM('scheduled', 'postponed', 'cancelled');
  CREATE TYPE "public"."enum_events_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_events_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__events_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__events_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__events_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__events_v_version_registration_mode" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__events_v_version_event_status" AS ENUM('scheduled', 'postponed', 'cancelled');
  CREATE TYPE "public"."enum__events_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__events_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_webinars_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_webinars_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_webinars_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_webinars_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_webinars_webinar_type" AS ENUM('live', 'on-demand', 'panel', 'demo');
  CREATE TYPE "public"."enum_webinars_region" AS ENUM('north-america', 'asia-mea', 'emea', 'global');
  CREATE TYPE "public"."enum_webinars_registration_mode" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_webinars_event_status" AS ENUM('scheduled', 'postponed', 'cancelled');
  CREATE TYPE "public"."enum_webinars_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_webinars_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_webinars_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__webinars_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__webinars_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__webinars_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__webinars_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__webinars_v_version_webinar_type" AS ENUM('live', 'on-demand', 'panel', 'demo');
  CREATE TYPE "public"."enum__webinars_v_version_region" AS ENUM('north-america', 'asia-mea', 'emea', 'global');
  CREATE TYPE "public"."enum__webinars_v_version_registration_mode" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__webinars_v_version_event_status" AS ENUM('scheduled', 'postponed', 'cancelled');
  CREATE TYPE "public"."enum__webinars_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__webinars_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__webinars_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_podcast_episodes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__podcast_episodes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_jobs_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_jobs_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_jobs_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_jobs_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_jobs_source" AS ENUM('cms', 'ats');
  CREATE TYPE "public"."enum_jobs_department" AS ENUM('engineering', 'sales', 'marketing', 'customer-success', 'operations', 'finance', 'legal', 'people');
  CREATE TYPE "public"."enum_jobs_employment_type" AS ENUM('full-time', 'part-time', 'contract', 'internship');
  CREATE TYPE "public"."enum_jobs_experience_level" AS ENUM('entry', 'mid', 'senior', 'staff', 'principal');
  CREATE TYPE "public"."enum_jobs_salary_range_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_jobs_hiring_status" AS ENUM('open', 'paused', 'closed');
  CREATE TYPE "public"."enum_jobs_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_jobs_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_jobs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__jobs_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__jobs_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__jobs_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__jobs_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__jobs_v_version_source" AS ENUM('cms', 'ats');
  CREATE TYPE "public"."enum__jobs_v_version_department" AS ENUM('engineering', 'sales', 'marketing', 'customer-success', 'operations', 'finance', 'legal', 'people');
  CREATE TYPE "public"."enum__jobs_v_version_employment_type" AS ENUM('full-time', 'part-time', 'contract', 'internship');
  CREATE TYPE "public"."enum__jobs_v_version_experience_level" AS ENUM('entry', 'mid', 'senior', 'staff', 'principal');
  CREATE TYPE "public"."enum__jobs_v_version_salary_range_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__jobs_v_version_hiring_status" AS ENUM('open', 'paused', 'closed');
  CREATE TYPE "public"."enum__jobs_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__jobs_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__jobs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_about_galleries_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_galleries_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pages_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_pages_blocks_hero_primary_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum_pages_blocks_hero_secondary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_pages_blocks_hero_secondary_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum_pages_blocks_hero_background_kind" AS ENUM('none', 'image', 'video', 'gradient');
  CREATE TYPE "public"."enum_pages_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_pages_blocks_cta_primary_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum_pages_blocks_cta_secondary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_pages_blocks_cta_secondary_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum_pages_blocks_cta_background" AS ENUM('surface', 'inverted', 'brand');
  CREATE TYPE "public"."enum_pages_blocks_rich_text_max_width" AS ENUM('prose', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_form_block_post_submit_kind" AS ENUM('message', 'redirect');
  CREATE TYPE "public"."enum_pages_blocks_form_block_layout" AS ENUM('inline', 'split');
  CREATE TYPE "public"."enum_pages_blocks_feature_grid_features_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum_pages_blocks_feature_grid_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_pages_blocks_integration_logos_integrations_category" AS ENUM('ci-cd', 'registry', 'kubernetes', 'cloud', 'security', 'observability', 'other');
  CREATE TYPE "public"."enum_pages_blocks_testimonial_variant" AS ENUM('card', 'pull-quote');
  CREATE TYPE "public"."enum_pages_blocks_metrics_bar_background" AS ENUM('inverted', 'surface');
  CREATE TYPE "public"."enum_pages_blocks_gallery_layout" AS ENUM('grid', 'masonry', 'carousel');
  CREATE TYPE "public"."enum_pages_blocks_embed_provider" AS ENUM('youtube', 'vimeo', 'loom');
  CREATE TYPE "public"."enum_pages_blocks_embed_aspect_ratio" AS ENUM('16-9', '4-3', '1-1', '9-16');
  CREATE TYPE "public"."enum_pages_blocks_code_block_language" AS ENUM('bash', 'dockerfile', 'yaml', 'json', 'typescript', 'javascript', 'python', 'go', 'rust', 'sql', 'hcl', 'text');
  CREATE TYPE "public"."enum_pages_blocks_pricing_tiers_price_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_pages_blocks_pricing_tiers_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_pages_blocks_pricing_tiers_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum_pages_blocks_jobs_list_filters_department" AS ENUM('engineering', 'sales', 'marketing', 'customer-success', 'operations', 'finance', 'legal', 'people');
  CREATE TYPE "public"."enum_pages_blocks_table_rows_cells_type" AS ENUM('text', 'check', 'cross', 'partial');
  CREATE TYPE "public"."enum_pages_blocks_section_variant" AS ENUM('stack', 'two-column');
  CREATE TYPE "public"."enum_pages_blocks_section_gap" AS ENUM('sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_section_alignment" AS ENUM('start', 'center', 'end');
  CREATE TYPE "public"."enum_pages_blocks_section_background" AS ENUM('none', 'surface', 'inverted');
  CREATE TYPE "public"."enum_pages_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum_pages_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum_pages_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum_pages_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum_pages_page_layout" AS ENUM('default', 'narrow', 'full-bleed');
  CREATE TYPE "public"."enum_pages_schema_type" AS ENUM('auto', 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage');
  CREATE TYPE "public"."enum_pages_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum_pages_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_secondary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_secondary_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_background_kind" AS ENUM('none', 'image', 'video', 'gradient');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_primary_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_secondary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_secondary_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_background" AS ENUM('surface', 'inverted', 'brand');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_max_width" AS ENUM('prose', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_form_block_post_submit_kind" AS ENUM('message', 'redirect');
  CREATE TYPE "public"."enum__pages_v_blocks_form_block_layout" AS ENUM('inline', 'split');
  CREATE TYPE "public"."enum__pages_v_blocks_feature_grid_features_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_feature_grid_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__pages_v_blocks_integration_logos_integrations_category" AS ENUM('ci-cd', 'registry', 'kubernetes', 'cloud', 'security', 'observability', 'other');
  CREATE TYPE "public"."enum__pages_v_blocks_testimonial_variant" AS ENUM('card', 'pull-quote');
  CREATE TYPE "public"."enum__pages_v_blocks_metrics_bar_background" AS ENUM('inverted', 'surface');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_layout" AS ENUM('grid', 'masonry', 'carousel');
  CREATE TYPE "public"."enum__pages_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo', 'loom');
  CREATE TYPE "public"."enum__pages_v_blocks_embed_aspect_ratio" AS ENUM('16-9', '4-3', '1-1', '9-16');
  CREATE TYPE "public"."enum__pages_v_blocks_code_block_language" AS ENUM('bash', 'dockerfile', 'yaml', 'json', 'typescript', 'javascript', 'python', 'go', 'rust', 'sql', 'hcl', 'text');
  CREATE TYPE "public"."enum__pages_v_blocks_pricing_tiers_price_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__pages_v_blocks_pricing_tiers_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__pages_v_blocks_pricing_tiers_cta_link_kind" AS ENUM('doc', 'media', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_jobs_list_filters_department" AS ENUM('engineering', 'sales', 'marketing', 'customer-success', 'operations', 'finance', 'legal', 'people');
  CREATE TYPE "public"."enum__pages_v_blocks_table_rows_cells_type" AS ENUM('text', 'check', 'cross', 'partial');
  CREATE TYPE "public"."enum__pages_v_blocks_section_variant" AS ENUM('stack', 'two-column');
  CREATE TYPE "public"."enum__pages_v_blocks_section_gap" AS ENUM('sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_section_alignment" AS ENUM('start', 'center', 'end');
  CREATE TYPE "public"."enum__pages_v_blocks_section_background" AS ENUM('none', 'surface', 'inverted');
  CREATE TYPE "public"."enum__pages_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization');
  CREATE TYPE "public"."enum__pages_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication');
  CREATE TYPE "public"."enum__pages_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR');
  CREATE TYPE "public"."enum__pages_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace');
  CREATE TYPE "public"."enum__pages_v_version_page_layout" AS ENUM('default', 'narrow', 'full-bleed');
  CREATE TYPE "public"."enum__pages_v_version_schema_type" AS ENUM('auto', 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage');
  CREATE TYPE "public"."enum__pages_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow');
  CREATE TYPE "public"."enum__pages_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'drainLeadQueue', 'purgeSearchLog', 'purgeLeadsPii', 'purgePreviewAudit', 'checkBrokenLinks', 'retryWebhook', 'meiliReindex', 'dashboardRefreshFrequent', 'dashboardRefreshDaily', 'analyticsCachePrune', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'drainLeadQueue', 'purgeSearchLog', 'purgeLeadsPii', 'purgePreviewAudit', 'checkBrokenLinks', 'retryWebhook', 'meiliReindex', 'dashboardRefreshFrequent', 'dashboardRefreshDaily', 'analyticsCachePrune', 'schedulePublish');
  CREATE TYPE "public"."enum_main_nav_items_mega_menu_columns_items_kind" AS ENUM('internal-doc', 'external-url', 'cta');
  CREATE TYPE "public"."enum_main_nav_items_mega_menu_columns_items_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_main_nav_items_kind" AS ENUM('internal-doc', 'external-url', 'cta');
  CREATE TYPE "public"."enum_main_nav_items_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_main_nav_items_mega_menu_featured_card_kind" AS ENUM('internal-doc', 'external-url');
  CREATE TYPE "public"."enum__main_nav_v_version_items_mega_menu_columns_items_kind" AS ENUM('internal-doc', 'external-url', 'cta');
  CREATE TYPE "public"."enum__main_nav_v_version_items_mega_menu_columns_items_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__main_nav_v_version_items_kind" AS ENUM('internal-doc', 'external-url', 'cta');
  CREATE TYPE "public"."enum__main_nav_v_version_items_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__main_nav_v_version_items_mega_menu_featured_card_kind" AS ENUM('internal-doc', 'external-url');
  CREATE TYPE "public"."enum_footer_nav_columns_items_kind" AS ENUM('internal-doc', 'external-url', 'cta');
  CREATE TYPE "public"."enum_footer_nav_columns_items_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_footer_nav_social_platform" AS ENUM('twitter', 'linkedin', 'github', 'youtube', 'mastodon', 'bluesky');
  CREATE TYPE "public"."enum__footer_nav_v_version_columns_items_kind" AS ENUM('internal-doc', 'external-url', 'cta');
  CREATE TYPE "public"."enum__footer_nav_v_version_columns_items_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__footer_nav_v_version_social_platform" AS ENUM('twitter', 'linkedin', 'github', 'youtube', 'mastodon', 'bluesky');
  CREATE TYPE "public"."enum_announcements_variant" AS ENUM('info', 'warn', 'promo');
  CREATE TYPE "public"."enum__announcements_v_version_variant" AS ENUM('info', 'warn', 'promo');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"preferences" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"folder" "enum_media_folder" DEFAULT 'web/general',
  	"decorative" boolean DEFAULT false,
  	"alt" varchar,
  	"caption" varchar,
  	"credit" varchar,
  	"focal_point_x" numeric DEFAULT 50,
  	"focal_point_y" numeric DEFAULT 50,
  	"prefix" varchar DEFAULT 'dev',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"status" "enum_redirects_status" DEFAULT '301' NOT NULL,
  	"to" varchar,
  	"source" "enum_redirects_source" DEFAULT 'manual' NOT NULL,
  	"notes" varchar,
  	"hit_count" numeric DEFAULT 0,
  	"last_hit_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "broken_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"status" "enum_broken_links_status" NOT NULL,
  	"http_status" numeric,
  	"source_collection" varchar NOT NULL,
  	"source_doc_id" varchar NOT NULL,
  	"source_doc_slug" varchar,
  	"first_seen_at" timestamp(3) with time zone,
  	"last_checked" timestamp(3) with time zone,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"timestamp" timestamp(3) with time zone NOT NULL,
  	"action" "enum_audit_log_action" NOT NULL,
  	"target_collection" varchar NOT NULL,
  	"target_id" varchar NOT NULL,
  	"actor_user_id_id" integer,
  	"request_ip" varchar,
  	"user_agent" varchar,
  	"accept_language" varchar,
  	"proxy_chain_length" numeric,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"query" varchar NOT NULL,
  	"results_count" numeric NOT NULL,
  	"locale" varchar,
  	"ip" varchar,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "preview_audit" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection" varchar NOT NULL,
  	"doc_id" varchar NOT NULL,
  	"actor_id" integer NOT NULL,
  	"label" varchar,
  	"ttl_seconds" numeric NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"revoked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "webhooks_dead_letter" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"webhook_id" varchar NOT NULL,
  	"event" "enum_webhooks_dead_letter_event" NOT NULL,
  	"event_payload" jsonb NOT NULL,
  	"destination_id" varchar NOT NULL,
  	"destination_kind" "enum_webhooks_dead_letter_destination_kind" NOT NULL,
  	"destination_label" varchar,
  	"attempt_count" numeric DEFAULT 1 NOT NULL,
  	"last_error" varchar,
  	"next_retry_at" timestamp(3) with time zone,
  	"resolved_at" timestamp(3) with time zone,
  	"request_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "integrations_routing_events" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_integrations_routing_events",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "integrations_routing_collections" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_integrations_routing_collections",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "integrations_teams_config_mentions_trigger_on" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_integrations_teams_config_mentions_trigger_on",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "integrations_teams_config_mentions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"aad_object_id" varchar,
  	"upn" varchar
  );
  
  CREATE TABLE "integrations_hubspot_config_field_mapping" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"submission_field" varchar,
  	"hubspot_property" varchar
  );
  
  CREATE TABLE "integrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"kind" "enum_integrations_kind" NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"teams_config_webhook_url" varchar,
  	"generic_config_url" varchar,
  	"generic_config_signing_secret" varchar,
  	"generic_config_signing_key_id" varchar,
  	"hubspot_config_write_mode" "enum_integrations_hubspot_config_write_mode" DEFAULT 'contactOnly',
  	"hubspot_config_default_lifecycle_stage" "enum_integrations_hubspot_config_default_lifecycle_stage" DEFAULT 'lead',
  	"hubspot_config_default_lead_status" "enum_integrations_hubspot_config_default_lead_status" DEFAULT 'NEW',
  	"ga4_config_property_id" varchar,
  	"gsc_config_site_url" varchar,
  	"cloudflare_config_account_tag" varchar,
  	"calcom_config_fallback_form_id" numeric,
  	"source" "enum_integrations_source" DEFAULT 'db',
  	"last_health_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "integrations_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "analytics_cache" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"env" "enum_analytics_cache_env" DEFAULT 'production' NOT NULL,
  	"provider" "enum_analytics_cache_provider" NOT NULL,
  	"scope" "enum_analytics_cache_scope" DEFAULT 'global' NOT NULL,
  	"key" varchar NOT NULL,
  	"captured_at" timestamp(3) with time zone NOT NULL,
  	"payload" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "authors_topic_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"topic" varchar
  );
  
  CREATE TABLE "authors_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"institution" varchar,
  	"degree" varchar,
  	"year" numeric
  );
  
  CREATE TABLE "authors_experience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"company" varchar,
  	"role" varchar,
  	"from_year" numeric,
  	"to_year" numeric
  );
  
  CREATE TABLE "authors_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"skill" varchar
  );
  
  CREATE TABLE "authors_awards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"issuer" varchar,
  	"year" numeric
  );
  
  CREATE TABLE "authors_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"photo_id" integer,
  	"role" varchar,
  	"location" varchar,
  	"bio_short" varchar,
  	"bio_long" jsonb,
  	"social_twitter" varchar,
  	"social_linkedin" varchar,
  	"social_github" varchar,
  	"social_website" varchar,
  	"social_email" varchar,
  	"legacy_bio" jsonb,
  	"accepting_new_bylines" boolean DEFAULT true,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_authors_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_authors_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_authors_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_authors_v_version_topic_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"topic" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_authors_v_version_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"institution" varchar,
  	"degree" varchar,
  	"year" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_authors_v_version_experience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"company" varchar,
  	"role" varchar,
  	"from_year" numeric,
  	"to_year" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_authors_v_version_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"skill" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_authors_v_version_awards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"issuer" varchar,
  	"year" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_authors_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_authors_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_photo_id" integer,
  	"version_role" varchar,
  	"version_location" varchar,
  	"version_bio_short" varchar,
  	"version_bio_long" jsonb,
  	"version_social_twitter" varchar,
  	"version_social_linkedin" varchar,
  	"version_social_github" varchar,
  	"version_social_website" varchar,
  	"version_social_email" varchar,
  	"version_legacy_bio" jsonb,
  	"version_accepting_new_bylines" boolean DEFAULT true,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__authors_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__authors_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__authors_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "categories_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"icon_id" integer,
  	"parent_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_categories_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_categories_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_categories_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_categories_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_categories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_icon_id" integer,
  	"version_parent_id" integer,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__categories_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__categories_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__categories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "news_categories_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "news_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"icon_id" integer,
  	"parent_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_news_categories_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_news_categories_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_categories_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_news_categories_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_categories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_icon_id" integer,
  	"version_parent_id" integer,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__news_categories_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__news_categories_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_categories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "knowledge_categories_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "knowledge_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"icon_id" integer,
  	"parent_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_knowledge_categories_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_knowledge_categories_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_knowledge_categories_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_knowledge_categories_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_knowledge_categories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_icon_id" integer,
  	"version_parent_id" integer,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__knowledge_categories_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__knowledge_categories_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__knowledge_categories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "job_locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_job_locations_type" DEFAULT 'city' NOT NULL,
  	"iso_country" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "forms_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "forms_fields_conditions_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field_name" varchar,
  	"operator" "enum_forms_fields_conditions_rules_operator" DEFAULT 'equals',
  	"value" varchar
  );
  
  CREATE TABLE "forms_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"type" "enum_forms_fields_type" DEFAULT 'text',
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"placeholder" varchar,
  	"help_text" varchar,
  	"default_value" varchar,
  	"consent_text" varchar,
  	"validation_min_length" numeric,
  	"validation_max_length" numeric,
  	"validation_pattern" varchar,
  	"conditions_mode" "enum_forms_fields_conditions_mode" DEFAULT 'all',
  	"error_message" varchar
  );
  
  CREATE TABLE "forms_crm_handlers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_forms_crm_handlers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "forms_notify_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar
  );
  
  CREATE TABLE "forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"submit_label" varchar DEFAULT 'Submit',
  	"post_submit_kind" "enum_forms_post_submit_kind" DEFAULT 'message',
  	"post_submit_body" jsonb,
  	"post_submit_url" varchar,
  	"schema_version" numeric DEFAULT 1,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_forms_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_forms_v_version_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_forms_v_version_fields_conditions_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"field_name" varchar,
  	"operator" "enum__forms_v_version_fields_conditions_rules_operator" DEFAULT 'equals',
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_forms_v_version_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"type" "enum__forms_v_version_fields_type" DEFAULT 'text',
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"placeholder" varchar,
  	"help_text" varchar,
  	"default_value" varchar,
  	"consent_text" varchar,
  	"validation_min_length" numeric,
  	"validation_max_length" numeric,
  	"validation_pattern" varchar,
  	"conditions_mode" "enum__forms_v_version_fields_conditions_mode" DEFAULT 'all',
  	"error_message" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_forms_v_version_crm_handlers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__forms_v_version_crm_handlers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_forms_v_version_notify_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_forms_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_submit_label" varchar DEFAULT 'Submit',
  	"version_post_submit_kind" "enum__forms_v_version_post_submit_kind" DEFAULT 'message',
  	"version_post_submit_body" jsonb,
  	"version_post_submit_url" varchar,
  	"version_schema_version" numeric DEFAULT 1,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__forms_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "leads_consent_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );
  
  CREATE TABLE "leads_synced_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"handler" varchar NOT NULL,
  	"status" "enum_leads_synced_to_status" NOT NULL,
  	"synced_at" timestamp(3) with time zone,
  	"external_id" varchar,
  	"error" varchar
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer NOT NULL,
  	"form_schema_version" numeric NOT NULL,
  	"fields" jsonb NOT NULL,
  	"source" varchar,
  	"utm_campaign" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_term" varchar,
  	"utm_content" varchar,
  	"ip" varchar,
  	"user_agent" varchar,
  	"consent_given_at" timestamp(3) with time zone,
  	"consent_snapshot" varchar,
  	"privacy_policy_version" varchar,
  	"enriched" jsonb,
  	"duplicate_of_id" integer,
  	"pii_redacted_at" timestamp(3) with time zone,
  	"honeypot" varchar,
  	"turnstile_passed" boolean DEFAULT true,
  	"email_health" "enum_leads_email_health" DEFAULT 'good',
  	"email_health_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blogs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "blogs_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "blogs_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "blogs_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "blogs_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "blogs_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "blogs_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_blogs_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "blogs_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_blogs_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_blogs_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "blogs_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "blogs_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_blogs_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "blogs_table_of_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"anchor" varchar
  );
  
  CREATE TABLE "blogs_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "blogs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"abstract" varchar,
  	"hero_image_id" integer,
  	"body" jsonb,
  	"reviewed_by_id" integer,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"categories_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"reading_minutes" numeric,
  	"word_count" numeric,
  	"toc_depth" "enum_blogs_toc_depth" DEFAULT 'h2',
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_blogs_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_blogs_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"featured" boolean DEFAULT false,
  	"pinned" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_blogs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "blogs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer,
  	"blogs_id" integer
  );
  
  CREATE TABLE "_blogs_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__blogs_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__blogs_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__blogs_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_blogs_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__blogs_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_blogs_v_version_table_of_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"anchor" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_blogs_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_blogs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_abstract" varchar,
  	"version_hero_image_id" integer,
  	"version_body" jsonb,
  	"version_reviewed_by_id" integer,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_categories_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_reading_minutes" numeric,
  	"version_word_count" numeric,
  	"version_toc_depth" "enum__blogs_v_version_toc_depth" DEFAULT 'h2',
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__blogs_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__blogs_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_featured" boolean DEFAULT false,
  	"version_pinned" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__blogs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_blogs_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer,
  	"blogs_id" integer
  );
  
  CREATE TABLE "news_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "news_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "news_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "news_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "news_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "news_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_news_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "news_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_news_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_news_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "news_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "news_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_news_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "news_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"abstract" varchar,
  	"hero_image_id" integer,
  	"publisher" varchar,
  	"publisher_logo_id" integer,
  	"press_type" "enum_news_press_type" DEFAULT 'press-release',
  	"location" varchar,
  	"body" jsonb,
  	"external_url" varchar,
  	"publication_date" timestamp(3) with time zone,
  	"reading_minutes" numeric,
  	"word_count" numeric,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_news_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_news_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "news_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer,
  	"news_categories_id" integer,
  	"news_id" integer
  );
  
  CREATE TABLE "_news_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_news_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_news_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_news_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__news_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_news_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__news_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__news_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_news_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__news_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_news_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_abstract" varchar,
  	"version_hero_image_id" integer,
  	"version_publisher" varchar,
  	"version_publisher_logo_id" integer,
  	"version_press_type" "enum__news_v_version_press_type" DEFAULT 'press-release',
  	"version_location" varchar,
  	"version_body" jsonb,
  	"version_external_url" varchar,
  	"version_publication_date" timestamp(3) with time zone,
  	"version_reading_minutes" numeric,
  	"version_word_count" numeric,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__news_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__news_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_news_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer,
  	"news_categories_id" integer,
  	"news_id" integer
  );
  
  CREATE TABLE "guides_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "guides_article_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "guides_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"source" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "guides_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar
  );
  
  CREATE TABLE "guides_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "guides_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "guides_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_guides_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_guides_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_guides_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "guides_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_guides_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_table_of_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"anchor" varchar
  );
  
  CREATE TABLE "guides_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"hero_image_id" integer,
  	"body" jsonb,
  	"reviewed_by_id" integer,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"how_to_enabled" boolean DEFAULT false,
  	"how_to_total_time" varchar,
  	"how_to_prep_time" varchar,
  	"how_to_perform_time" varchar,
  	"how_to_estimated_cost" varchar,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"reading_minutes" numeric,
  	"word_count" numeric,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_guides_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_guides_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_guides_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "guides_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer,
  	"guides_id" integer
  );
  
  CREATE TABLE "_guides_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_version_article_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_version_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"source" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_version_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__guides_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__guides_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__guides_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__guides_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_version_table_of_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"anchor" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_hero_image_id" integer,
  	"version_body" jsonb,
  	"version_reviewed_by_id" integer,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_how_to_enabled" boolean DEFAULT false,
  	"version_how_to_total_time" varchar,
  	"version_how_to_prep_time" varchar,
  	"version_how_to_perform_time" varchar,
  	"version_how_to_estimated_cost" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_reading_minutes" numeric,
  	"version_word_count" numeric,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__guides_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__guides_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__guides_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_guides_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer,
  	"guides_id" integer
  );
  
  CREATE TABLE "resources_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "resources_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "resources_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_resources_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_resources_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_resources_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "resources_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_resources_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "resources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"type" "enum_resources_type",
  	"summary" varchar,
  	"asset_id" integer,
  	"body" jsonb,
  	"gated" boolean DEFAULT false,
  	"gate_form_id" integer,
  	"access_level" "enum_resources_access_level" DEFAULT 'public',
  	"cta_button_text" varchar,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"download_count" numeric DEFAULT 0,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_resources_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_resources_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_resources_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_resources_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_resources_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_resources_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_resources_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_resources_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_resources_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__resources_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_resources_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__resources_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__resources_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_resources_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_resources_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__resources_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_resources_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_resources_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_type" "enum__resources_v_version_type",
  	"version_summary" varchar,
  	"version_asset_id" integer,
  	"version_body" jsonb,
  	"version_gated" boolean DEFAULT false,
  	"version_gate_form_id" integer,
  	"version_access_level" "enum__resources_v_version_access_level" DEFAULT 'public',
  	"version_cta_button_text" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_download_count" numeric DEFAULT 0,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__resources_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__resources_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__resources_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "knowledge_base_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "knowledge_base_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "knowledge_base_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "knowledge_base_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "knowledge_base_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "knowledge_base_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "knowledge_base_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_knowledge_base_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "knowledge_base_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_knowledge_base_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_knowledge_base_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "knowledge_base_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "knowledge_base_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_knowledge_base_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "knowledge_base_table_of_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"anchor" varchar
  );
  
  CREATE TABLE "knowledge_base_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "knowledge_base" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"abstract" varchar,
  	"hero_image_id" integer,
  	"category_id" integer,
  	"body" jsonb,
  	"reviewed_by_id" integer,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"reading_minutes" numeric,
  	"word_count" numeric,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_knowledge_base_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_knowledge_base_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_knowledge_base_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "knowledge_base_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"knowledge_base_id" integer
  );
  
  CREATE TABLE "_knowledge_base_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__knowledge_base_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__knowledge_base_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__knowledge_base_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__knowledge_base_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_version_table_of_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"anchor" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_knowledge_base_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_knowledge_base_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_abstract" varchar,
  	"version_hero_image_id" integer,
  	"version_category_id" integer,
  	"version_body" jsonb,
  	"version_reviewed_by_id" integer,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_reading_minutes" numeric,
  	"version_word_count" numeric,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__knowledge_base_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__knowledge_base_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__knowledge_base_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_knowledge_base_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"knowledge_base_id" integer
  );
  
  CREATE TABLE "events_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "events_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "events_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "events_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_events_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_events_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_events_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "events_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_events_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "events_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"venue" varchar,
  	"abstract" varchar,
  	"hero_image_id" integer,
  	"body" jsonb,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"timezone" varchar,
  	"custom_date_label" varchar,
  	"registration_mode" "enum_events_registration_mode" DEFAULT 'external',
  	"registration_url" varchar,
  	"registration_form_id" integer,
  	"attendees_cap" numeric,
  	"cta_label" varchar,
  	"post_event_cta_enabled" boolean DEFAULT false,
  	"post_event_cta_label" varchar,
  	"post_event_cta_url" varchar,
  	"event_status" "enum_events_event_status" DEFAULT 'scheduled',
  	"cancelled_at" timestamp(3) with time zone,
  	"previous_start_date" timestamp(3) with time zone,
  	"agenda_pdf_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_events_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_events_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );
  
  CREATE TABLE "_events_v_version_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_events_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_events_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_events_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__events_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_events_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__events_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__events_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_events_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__events_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_events_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_venue" varchar,
  	"version_abstract" varchar,
  	"version_hero_image_id" integer,
  	"version_body" jsonb,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_timezone" varchar,
  	"version_custom_date_label" varchar,
  	"version_registration_mode" "enum__events_v_version_registration_mode" DEFAULT 'external',
  	"version_registration_url" varchar,
  	"version_registration_form_id" integer,
  	"version_attendees_cap" numeric,
  	"version_cta_label" varchar,
  	"version_post_event_cta_enabled" boolean DEFAULT false,
  	"version_post_event_cta_label" varchar,
  	"version_post_event_cta_url" varchar,
  	"version_event_status" "enum__events_v_version_event_status" DEFAULT 'scheduled',
  	"version_cancelled_at" timestamp(3) with time zone,
  	"version_previous_start_date" timestamp(3) with time zone,
  	"version_agenda_pdf_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__events_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__events_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_events_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );
  
  CREATE TABLE "webinars_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "webinars_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "webinars_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "webinars_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "webinars_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "webinars_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_webinars_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "webinars_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_webinars_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_webinars_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "webinars_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "webinars_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_webinars_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "webinars_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "webinars" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"hero_image_id" integer,
  	"abstract" varchar,
  	"body" jsonb,
  	"webinar_type" "enum_webinars_webinar_type" DEFAULT 'live',
  	"region" "enum_webinars_region" DEFAULT 'global',
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"timezone" varchar,
  	"registration_mode" "enum_webinars_registration_mode" DEFAULT 'external',
  	"registration_url" varchar,
  	"registration_form_id" integer,
  	"attendees_cap" numeric,
  	"event_status" "enum_webinars_event_status" DEFAULT 'scheduled',
  	"cancelled_at" timestamp(3) with time zone,
  	"previous_start_date" timestamp(3) with time zone,
  	"pdf_id" integer,
  	"recording_url" varchar,
  	"slides_url" varchar,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_webinars_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_webinars_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_webinars_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "webinars_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );
  
  CREATE TABLE "_webinars_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_webinars_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_webinars_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_webinars_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_webinars_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_webinars_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__webinars_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_webinars_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__webinars_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__webinars_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_webinars_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_webinars_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__webinars_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_webinars_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_webinars_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_hero_image_id" integer,
  	"version_abstract" varchar,
  	"version_body" jsonb,
  	"version_webinar_type" "enum__webinars_v_version_webinar_type" DEFAULT 'live',
  	"version_region" "enum__webinars_v_version_region" DEFAULT 'global',
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_timezone" varchar,
  	"version_registration_mode" "enum__webinars_v_version_registration_mode" DEFAULT 'external',
  	"version_registration_url" varchar,
  	"version_registration_form_id" integer,
  	"version_attendees_cap" numeric,
  	"version_event_status" "enum__webinars_v_version_event_status" DEFAULT 'scheduled',
  	"version_cancelled_at" timestamp(3) with time zone,
  	"version_previous_start_date" timestamp(3) with time zone,
  	"version_pdf_id" integer,
  	"version_recording_url" varchar,
  	"version_slides_url" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__webinars_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__webinars_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__webinars_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_webinars_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );
  
  CREATE TABLE "podcast_episodes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"episode_number" numeric,
  	"youtube_url" varchar,
  	"youtube_video_id" varchar,
  	"thumbnail_override_id" integer,
  	"abstract" varchar,
  	"duration_seconds" numeric,
  	"featured" boolean DEFAULT false,
  	"publication_date" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_podcast_episodes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_podcast_episodes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_episode_number" numeric,
  	"version_youtube_url" varchar,
  	"version_youtube_video_id" varchar,
  	"version_thumbnail_override_id" integer,
  	"version_abstract" varchar,
  	"version_duration_seconds" numeric,
  	"version_featured" boolean DEFAULT false,
  	"version_publication_date" timestamp(3) with time zone,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__podcast_episodes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "jobs_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "jobs_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jobs_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jobs_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "jobs_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "jobs_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_jobs_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jobs_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_jobs_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_jobs_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "jobs_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "jobs_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_jobs_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "jobs_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"source" "enum_jobs_source" DEFAULT 'cms',
  	"ats_url" varchar,
  	"department" "enum_jobs_department",
  	"employment_type" "enum_jobs_employment_type" DEFAULT 'full-time',
  	"experience_level" "enum_jobs_experience_level",
  	"remote" boolean DEFAULT false,
  	"salary_range_min" numeric,
  	"salary_range_max" numeric,
  	"salary_range_currency" "enum_jobs_salary_range_currency" DEFAULT 'USD',
  	"body" jsonb,
  	"description_pdf_id" integer,
  	"apply_url" varchar,
  	"hiring_status" "enum_jobs_hiring_status" DEFAULT 'open',
  	"application_deadline" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"closed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_jobs_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_jobs_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_jobs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "jobs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"job_locations_id" integer
  );
  
  CREATE TABLE "_jobs_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_jobs_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_jobs_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_jobs_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_jobs_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_jobs_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__jobs_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_jobs_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__jobs_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__jobs_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_jobs_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_jobs_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__jobs_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_jobs_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_jobs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_source" "enum__jobs_v_version_source" DEFAULT 'cms',
  	"version_ats_url" varchar,
  	"version_department" "enum__jobs_v_version_department",
  	"version_employment_type" "enum__jobs_v_version_employment_type" DEFAULT 'full-time',
  	"version_experience_level" "enum__jobs_v_version_experience_level",
  	"version_remote" boolean DEFAULT false,
  	"version_salary_range_min" numeric,
  	"version_salary_range_max" numeric,
  	"version_salary_range_currency" "enum__jobs_v_version_salary_range_currency" DEFAULT 'USD',
  	"version_body" jsonb,
  	"version_description_pdf_id" integer,
  	"version_apply_url" varchar,
  	"version_hiring_status" "enum__jobs_v_version_hiring_status" DEFAULT 'open',
  	"version_application_deadline" timestamp(3) with time zone,
  	"version_expires_at" timestamp(3) with time zone,
  	"version_closed_at" timestamp(3) with time zone,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__jobs_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__jobs_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__jobs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_jobs_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"job_locations_id" integer
  );
  
  CREATE TABLE "about_galleries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"image_id" integer,
  	"caption" varchar,
  	"image_link" varchar,
  	"display_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_about_galleries_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_about_galleries_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_image_id" integer,
  	"version_caption" varchar,
  	"version_image_link" varchar,
  	"version_display_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__about_galleries_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "pages_breadcrumb" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"sub" varchar,
  	"primary_cta_variant" "enum_pages_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"primary_cta_tracking_id" varchar,
  	"primary_cta_link_text" varchar,
  	"primary_cta_link_kind" "enum_pages_blocks_hero_primary_cta_link_kind" DEFAULT 'doc',
  	"primary_cta_link_media_target_id" integer,
  	"primary_cta_link_url" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_variant" "enum_pages_blocks_hero_secondary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_tracking_id" varchar,
  	"secondary_cta_link_text" varchar,
  	"secondary_cta_link_kind" "enum_pages_blocks_hero_secondary_cta_link_kind" DEFAULT 'doc',
  	"secondary_cta_link_media_target_id" integer,
  	"secondary_cta_link_url" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"background_kind" "enum_pages_blocks_hero_background_kind" DEFAULT 'none',
  	"background_media_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"body" varchar,
  	"primary_cta_variant" "enum_pages_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"primary_cta_tracking_id" varchar,
  	"primary_cta_link_text" varchar,
  	"primary_cta_link_kind" "enum_pages_blocks_cta_primary_cta_link_kind" DEFAULT 'doc',
  	"primary_cta_link_media_target_id" integer,
  	"primary_cta_link_url" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_variant" "enum_pages_blocks_cta_secondary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_tracking_id" varchar,
  	"secondary_cta_link_text" varchar,
  	"secondary_cta_link_kind" "enum_pages_blocks_cta_secondary_cta_link_kind" DEFAULT 'doc',
  	"secondary_cta_link_media_target_id" integer,
  	"secondary_cta_link_url" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"background" "enum_pages_blocks_cta_background" DEFAULT 'surface',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" jsonb,
  	"max_width" "enum_pages_blocks_rich_text_max_width" DEFAULT 'prose',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_form_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"headline" varchar,
  	"description" varchar,
  	"override_post_submit" boolean DEFAULT false,
  	"post_submit_kind" "enum_pages_blocks_form_block_post_submit_kind" DEFAULT 'message',
  	"post_submit_body" jsonb,
  	"post_submit_url" varchar,
  	"layout" "enum_pages_blocks_form_block_layout" DEFAULT 'inline',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_feature_grid_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon_id" integer,
  	"title" varchar,
  	"body" varchar,
  	"link_text" varchar,
  	"link_kind" "enum_pages_blocks_feature_grid_features_link_kind" DEFAULT 'doc',
  	"link_media_target_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"columns" "enum_pages_blocks_feature_grid_columns" DEFAULT '3',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_logo_cloud_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "pages_blocks_logo_cloud" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"monochrome" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_integration_logos_integrations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"logo_id" integer,
  	"category" "enum_pages_blocks_integration_logos_integrations_category",
  	"url" varchar
  );
  
  CREATE TABLE "pages_blocks_integration_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sub" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_testimonial" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"person" varchar,
  	"role" varchar,
  	"company" varchar,
  	"company_logo_id" integer,
  	"avatar_id" integer,
  	"variant" "enum_pages_blocks_testimonial_variant" DEFAULT 'card',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"sublabel" varchar
  );
  
  CREATE TABLE "pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_metrics_bar_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_metrics_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background" "enum_pages_blocks_metrics_bar_background" DEFAULT 'inverted',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sub" varchar,
  	"allow_multiple_open" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"caption" varchar,
  	"link" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"layout" "enum_pages_blocks_gallery_layout" DEFAULT 'grid',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provider" "enum_pages_blocks_embed_provider" DEFAULT 'youtube',
  	"url" varchar,
  	"title" varchar,
  	"aspect_ratio" "enum_pages_blocks_embed_aspect_ratio" DEFAULT '16-9',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_code_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_pages_blocks_code_block_language" DEFAULT 'bash',
  	"content" varchar,
  	"show_line_numbers" boolean DEFAULT true,
  	"highlight_lines" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_pricing_tiers_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tooltip" varchar,
  	"included" boolean DEFAULT true
  );
  
  CREATE TABLE "pages_blocks_pricing_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price_monthly" varchar,
  	"price_yearly" varchar,
  	"price_currency" "enum_pages_blocks_pricing_tiers_price_currency" DEFAULT 'USD',
  	"tagline" varchar,
  	"cta_variant" "enum_pages_blocks_pricing_tiers_cta_variant" DEFAULT 'primary',
  	"cta_tracking_id" varchar,
  	"cta_link_text" varchar,
  	"cta_link_kind" "enum_pages_blocks_pricing_tiers_cta_link_kind" DEFAULT 'doc',
  	"cta_link_media_target_id" integer,
  	"cta_link_url" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"highlight" boolean DEFAULT false,
  	"highlight_label" varchar DEFAULT 'Most popular'
  );
  
  CREATE TABLE "pages_blocks_pricing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"billing_toggle" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_jobs_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sub" varchar,
  	"filters_department" "enum_pages_blocks_jobs_list_filters_department",
  	"filters_remote_only" boolean DEFAULT false,
  	"show_filters" boolean DEFAULT true,
  	"empty_message" varchar DEFAULT 'No openings right now — check back soon.',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_table_headers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"highlight" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_pages_blocks_table_rows_cells_type" DEFAULT 'text',
  	"value" varchar,
  	"tooltip" varchar
  );
  
  CREATE TABLE "pages_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"caption" varchar,
  	"first_col_is_header" boolean DEFAULT true,
  	"sticky_first_column" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_section_variant" DEFAULT 'stack',
  	"gap" "enum_pages_blocks_section_gap" DEFAULT 'md',
  	"alignment" "enum_pages_blocks_section_alignment" DEFAULT 'start',
  	"background" "enum_pages_blocks_section_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "pages_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum_pages_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum_pages_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum_pages_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "pages_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_pages_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"parent_id" integer,
  	"path" varchar,
  	"page_layout" "enum_pages_page_layout" DEFAULT 'default',
  	"schema_type" "enum_pages_schema_type" DEFAULT 'auto',
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "enum_pages_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "enum_pages_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_additional_schema" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"blogs_id" integer,
  	"news_id" integer,
  	"guides_id" integer,
  	"resources_id" integer,
  	"events_id" integer,
  	"webinars_id" integer,
  	"jobs_id" integer,
  	"authors_id" integer,
  	"categories_id" integer,
  	"news_categories_id" integer,
  	"job_locations_id" integer
  );
  
  CREATE TABLE "_pages_v_version_breadcrumb" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"path" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"sub" varchar,
  	"primary_cta_variant" "enum__pages_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"primary_cta_tracking_id" varchar,
  	"primary_cta_link_text" varchar,
  	"primary_cta_link_kind" "enum__pages_v_blocks_hero_primary_cta_link_kind" DEFAULT 'doc',
  	"primary_cta_link_media_target_id" integer,
  	"primary_cta_link_url" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_variant" "enum__pages_v_blocks_hero_secondary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_tracking_id" varchar,
  	"secondary_cta_link_text" varchar,
  	"secondary_cta_link_kind" "enum__pages_v_blocks_hero_secondary_cta_link_kind" DEFAULT 'doc',
  	"secondary_cta_link_media_target_id" integer,
  	"secondary_cta_link_url" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"background_kind" "enum__pages_v_blocks_hero_background_kind" DEFAULT 'none',
  	"background_media_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"body" varchar,
  	"primary_cta_variant" "enum__pages_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"primary_cta_tracking_id" varchar,
  	"primary_cta_link_text" varchar,
  	"primary_cta_link_kind" "enum__pages_v_blocks_cta_primary_cta_link_kind" DEFAULT 'doc',
  	"primary_cta_link_media_target_id" integer,
  	"primary_cta_link_url" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_variant" "enum__pages_v_blocks_cta_secondary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_tracking_id" varchar,
  	"secondary_cta_link_text" varchar,
  	"secondary_cta_link_kind" "enum__pages_v_blocks_cta_secondary_cta_link_kind" DEFAULT 'doc',
  	"secondary_cta_link_media_target_id" integer,
  	"secondary_cta_link_url" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"background" "enum__pages_v_blocks_cta_background" DEFAULT 'surface',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"body" jsonb,
  	"max_width" "enum__pages_v_blocks_rich_text_max_width" DEFAULT 'prose',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"headline" varchar,
  	"description" varchar,
  	"override_post_submit" boolean DEFAULT false,
  	"post_submit_kind" "enum__pages_v_blocks_form_block_post_submit_kind" DEFAULT 'message',
  	"post_submit_body" jsonb,
  	"post_submit_url" varchar,
  	"layout" "enum__pages_v_blocks_form_block_layout" DEFAULT 'inline',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_feature_grid_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon_id" integer,
  	"title" varchar,
  	"body" varchar,
  	"link_text" varchar,
  	"link_kind" "enum__pages_v_blocks_feature_grid_features_link_kind" DEFAULT 'doc',
  	"link_media_target_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"columns" "enum__pages_v_blocks_feature_grid_columns" DEFAULT '3',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_cloud_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_cloud" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"monochrome" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_integration_logos_integrations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"logo_id" integer,
  	"category" "enum__pages_v_blocks_integration_logos_integrations_category",
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_integration_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sub" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_testimonial" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"person" varchar,
  	"role" varchar,
  	"company" varchar,
  	"company_logo_id" integer,
  	"avatar_id" integer,
  	"variant" "enum__pages_v_blocks_testimonial_variant" DEFAULT 'card',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"sublabel" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_metrics_bar_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_metrics_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background" "enum__pages_v_blocks_metrics_bar_background" DEFAULT 'inverted',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sub" varchar,
  	"allow_multiple_open" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"caption" varchar,
  	"link" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"layout" "enum__pages_v_blocks_gallery_layout" DEFAULT 'grid',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider" "enum__pages_v_blocks_embed_provider" DEFAULT 'youtube',
  	"url" varchar,
  	"title" varchar,
  	"aspect_ratio" "enum__pages_v_blocks_embed_aspect_ratio" DEFAULT '16-9',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_code_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"language" "enum__pages_v_blocks_code_block_language" DEFAULT 'bash',
  	"content" varchar,
  	"show_line_numbers" boolean DEFAULT true,
  	"highlight_lines" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pricing_tiers_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tooltip" varchar,
  	"included" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pricing_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price_monthly" varchar,
  	"price_yearly" varchar,
  	"price_currency" "enum__pages_v_blocks_pricing_tiers_price_currency" DEFAULT 'USD',
  	"tagline" varchar,
  	"cta_variant" "enum__pages_v_blocks_pricing_tiers_cta_variant" DEFAULT 'primary',
  	"cta_tracking_id" varchar,
  	"cta_link_text" varchar,
  	"cta_link_kind" "enum__pages_v_blocks_pricing_tiers_cta_link_kind" DEFAULT 'doc',
  	"cta_link_media_target_id" integer,
  	"cta_link_url" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"highlight" boolean DEFAULT false,
  	"highlight_label" varchar DEFAULT 'Most popular',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pricing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"billing_toggle" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_jobs_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sub" varchar,
  	"filters_department" "enum__pages_v_blocks_jobs_list_filters_department",
  	"filters_remote_only" boolean DEFAULT false,
  	"show_filters" boolean DEFAULT true,
  	"empty_message" varchar DEFAULT 'No openings right now — check back soon.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table_headers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"highlight" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__pages_v_blocks_table_rows_cells_type" DEFAULT 'text',
  	"value" varchar,
  	"tooltip" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"caption" varchar,
  	"first_col_is_header" boolean DEFAULT true,
  	"sticky_first_column" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_section_variant" DEFAULT 'stack',
  	"gap" "enum__pages_v_blocks_section_gap" DEFAULT 'md',
  	"alignment" "enum__pages_v_blocks_section_alignment" DEFAULT 'start',
  	"background" "enum__pages_v_blocks_section_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "enum__pages_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "enum__pages_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "enum__pages_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__pages_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_parent_id" integer,
  	"version_path" varchar,
  	"version_page_layout" "enum__pages_v_version_page_layout" DEFAULT 'default',
  	"version_schema_type" "enum__pages_v_version_schema_type" DEFAULT 'auto',
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "enum__pages_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "enum__pages_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_additional_schema" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"blogs_id" integer,
  	"news_id" integer,
  	"guides_id" integer,
  	"resources_id" integer,
  	"events_id" integer,
  	"webinars_id" integer,
  	"jobs_id" integer,
  	"authors_id" integer,
  	"categories_id" integer,
  	"news_categories_id" integer,
  	"job_locations_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"redirects_id" integer,
  	"broken_links_id" integer,
  	"audit_log_id" integer,
  	"search_log_id" integer,
  	"preview_audit_id" integer,
  	"webhooks_dead_letter_id" integer,
  	"integrations_id" integer,
  	"analytics_cache_id" integer,
  	"authors_id" integer,
  	"categories_id" integer,
  	"news_categories_id" integer,
  	"knowledge_categories_id" integer,
  	"job_locations_id" integer,
  	"forms_id" integer,
  	"leads_id" integer,
  	"blogs_id" integer,
  	"news_id" integer,
  	"guides_id" integer,
  	"resources_id" integer,
  	"knowledge_base_id" integer,
  	"events_id" integer,
  	"webinars_id" integer,
  	"podcast_episodes_id" integer,
  	"jobs_id" integer,
  	"about_galleries_id" integer,
  	"pages_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'CleanStart' NOT NULL,
  	"base_url" varchar DEFAULT 'https://cleanstart.com' NOT NULL,
  	"default_locale" varchar DEFAULT 'en-US' NOT NULL,
  	"organization_timezone" varchar DEFAULT 'Asia/Kolkata',
  	"listing_page_size" numeric DEFAULT 12,
  	"listing_pagination_indexable_depth" numeric DEFAULT 3,
  	"toc_min_headings" numeric DEFAULT 3,
  	"toc_max_depth" numeric DEFAULT 3,
  	"leads_retention_days" numeric DEFAULT 365,
  	"analytics_gtm_container_id" varchar,
  	"analytics_ga4_measurement_id" varchar,
  	"analytics_consent_mode_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_site_name" varchar DEFAULT 'CleanStart' NOT NULL,
  	"version_base_url" varchar DEFAULT 'https://cleanstart.com' NOT NULL,
  	"version_default_locale" varchar DEFAULT 'en-US' NOT NULL,
  	"version_organization_timezone" varchar DEFAULT 'Asia/Kolkata',
  	"version_listing_page_size" numeric DEFAULT 12,
  	"version_listing_pagination_indexable_depth" numeric DEFAULT 3,
  	"version_toc_min_headings" numeric DEFAULT 3,
  	"version_toc_max_depth" numeric DEFAULT 3,
  	"version_leads_retention_days" numeric DEFAULT 365,
  	"version_analytics_gtm_container_id" varchar,
  	"version_analytics_ga4_measurement_id" varchar,
  	"version_analytics_consent_mode_enabled" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "seo_defaults_organization_json_ld_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "seo_defaults" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"default_title_template" varchar DEFAULT '%s — CleanStart',
  	"default_description" varchar,
  	"default_og_image_id" integer,
  	"twitter_handle" varchar,
  	"brand_icons_favicon32_id" integer,
  	"brand_icons_icon192_id" integer,
  	"brand_icons_icon512_id" integer,
  	"brand_icons_apple_touch_icon_id" integer,
  	"brand_icons_safari_pinned_tab_svg_id" integer,
  	"brand_icons_theme_color" varchar,
  	"verification_google" varchar,
  	"verification_bing" varchar,
  	"verification_pinterest" varchar,
  	"verification_yandex" varchar,
  	"verification_facebook_domain" varchar,
  	"organization_json_ld_name" varchar DEFAULT 'CleanStart, Inc.',
  	"organization_json_ld_legal_name" varchar,
  	"organization_json_ld_url" varchar DEFAULT 'https://cleanstart.com',
  	"organization_json_ld_logo_id" integer,
  	"news_media_organization_enabled" boolean DEFAULT false,
  	"news_media_organization_founding_date" varchar,
  	"news_media_organization_slogan" varchar,
  	"news_media_organization_masthead" varchar,
  	"news_media_organization_ethics_policy" varchar,
  	"news_media_organization_corrections_policy" varchar,
  	"news_media_organization_fact_checking_policy" varchar,
  	"news_media_organization_actionable_feedback_policy" varchar,
  	"news_media_organization_unnamed_sources_policy" varchar,
  	"news_media_organization_diversity_policy" varchar,
  	"news_media_organization_ownership_funding_info" varchar,
  	"news_media_organization_coverage_policy" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_seo_defaults_v_version_organization_json_ld_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_seo_defaults_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_default_title_template" varchar DEFAULT '%s — CleanStart',
  	"version_default_description" varchar,
  	"version_default_og_image_id" integer,
  	"version_twitter_handle" varchar,
  	"version_brand_icons_favicon32_id" integer,
  	"version_brand_icons_icon192_id" integer,
  	"version_brand_icons_icon512_id" integer,
  	"version_brand_icons_apple_touch_icon_id" integer,
  	"version_brand_icons_safari_pinned_tab_svg_id" integer,
  	"version_brand_icons_theme_color" varchar,
  	"version_verification_google" varchar,
  	"version_verification_bing" varchar,
  	"version_verification_pinterest" varchar,
  	"version_verification_yandex" varchar,
  	"version_verification_facebook_domain" varchar,
  	"version_organization_json_ld_name" varchar DEFAULT 'CleanStart, Inc.',
  	"version_organization_json_ld_legal_name" varchar,
  	"version_organization_json_ld_url" varchar DEFAULT 'https://cleanstart.com',
  	"version_organization_json_ld_logo_id" integer,
  	"version_news_media_organization_enabled" boolean DEFAULT false,
  	"version_news_media_organization_founding_date" varchar,
  	"version_news_media_organization_slogan" varchar,
  	"version_news_media_organization_masthead" varchar,
  	"version_news_media_organization_ethics_policy" varchar,
  	"version_news_media_organization_corrections_policy" varchar,
  	"version_news_media_organization_fact_checking_policy" varchar,
  	"version_news_media_organization_actionable_feedback_policy" varchar,
  	"version_news_media_organization_unnamed_sources_policy" varchar,
  	"version_news_media_organization_diversity_policy" varchar,
  	"version_news_media_organization_ownership_funding_info" varchar,
  	"version_news_media_organization_coverage_policy" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "main_nav_items_mega_menu_columns_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_main_nav_items_mega_menu_columns_items_kind" DEFAULT 'internal-doc',
  	"label" varchar,
  	"target_id" integer,
  	"href" varchar,
  	"target_blank" boolean DEFAULT true,
  	"variant" "enum_main_nav_items_mega_menu_columns_items_variant" DEFAULT 'primary',
  	"tracking_id" varchar
  );
  
  CREATE TABLE "main_nav_items_mega_menu_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar
  );
  
  CREATE TABLE "main_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_main_nav_items_kind" DEFAULT 'internal-doc' NOT NULL,
  	"label" varchar NOT NULL,
  	"target_id" integer,
  	"href" varchar,
  	"target_blank" boolean DEFAULT true,
  	"variant" "enum_main_nav_items_variant" DEFAULT 'primary',
  	"tracking_id" varchar,
  	"is_mega_menu" boolean DEFAULT false,
  	"mega_menu_mobile_group_hint" varchar,
  	"mega_menu_featured_card_kind" "enum_main_nav_items_mega_menu_featured_card_kind",
  	"mega_menu_featured_card_target_id" integer,
  	"mega_menu_featured_card_href" varchar,
  	"mega_menu_featured_card_eyebrow" varchar,
  	"mega_menu_featured_card_title" varchar,
  	"mega_menu_featured_card_description" varchar,
  	"mega_menu_featured_card_image_id" integer
  );
  
  CREATE TABLE "main_nav" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_main_nav_v_version_items_mega_menu_columns_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__main_nav_v_version_items_mega_menu_columns_items_kind" DEFAULT 'internal-doc',
  	"label" varchar,
  	"target_id" integer,
  	"href" varchar,
  	"target_blank" boolean DEFAULT true,
  	"variant" "enum__main_nav_v_version_items_mega_menu_columns_items_variant" DEFAULT 'primary',
  	"tracking_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_main_nav_v_version_items_mega_menu_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_main_nav_v_version_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__main_nav_v_version_items_kind" DEFAULT 'internal-doc' NOT NULL,
  	"label" varchar NOT NULL,
  	"target_id" integer,
  	"href" varchar,
  	"target_blank" boolean DEFAULT true,
  	"variant" "enum__main_nav_v_version_items_variant" DEFAULT 'primary',
  	"tracking_id" varchar,
  	"is_mega_menu" boolean DEFAULT false,
  	"mega_menu_mobile_group_hint" varchar,
  	"mega_menu_featured_card_kind" "enum__main_nav_v_version_items_mega_menu_featured_card_kind",
  	"mega_menu_featured_card_target_id" integer,
  	"mega_menu_featured_card_href" varchar,
  	"mega_menu_featured_card_eyebrow" varchar,
  	"mega_menu_featured_card_title" varchar,
  	"mega_menu_featured_card_description" varchar,
  	"mega_menu_featured_card_image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_main_nav_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "footer_nav_columns_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_footer_nav_columns_items_kind" DEFAULT 'internal-doc' NOT NULL,
  	"label" varchar NOT NULL,
  	"target_id" integer,
  	"href" varchar,
  	"target_blank" boolean DEFAULT true,
  	"variant" "enum_footer_nav_columns_items_variant" DEFAULT 'primary',
  	"tracking_id" varchar
  );
  
  CREATE TABLE "footer_nav_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL
  );
  
  CREATE TABLE "footer_nav_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_footer_nav_social_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "footer_nav_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"target_id" integer
  );
  
  CREATE TABLE "footer_nav_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"alt" varchar NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "footer_nav" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"copyright" varchar DEFAULT '© {year} CleanStart, Inc. All rights reserved.',
  	"newsletter_signup_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_footer_nav_v_version_columns_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__footer_nav_v_version_columns_items_kind" DEFAULT 'internal-doc' NOT NULL,
  	"label" varchar NOT NULL,
  	"target_id" integer,
  	"href" varchar,
  	"target_blank" boolean DEFAULT true,
  	"variant" "enum__footer_nav_v_version_columns_items_variant" DEFAULT 'primary',
  	"tracking_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_nav_v_version_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_nav_v_version_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum__footer_nav_v_version_social_platform" NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_nav_v_version_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"target_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_nav_v_version_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"alt" varchar NOT NULL,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_nav_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_copyright" varchar DEFAULT '© {year} CleanStart, Inc. All rights reserved.',
  	"version_newsletter_signup_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "legal" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"policy_version" varchar NOT NULL,
  	"privacy" jsonb,
  	"terms" jsonb,
  	"aup" jsonb,
  	"dpa_contact_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_legal_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_policy_version" varchar NOT NULL,
  	"version_privacy" jsonb,
  	"version_terms" jsonb,
  	"version_aup" jsonb,
  	"version_dpa_contact_email" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"active" boolean DEFAULT false,
  	"message" varchar NOT NULL,
  	"variant" "enum_announcements_variant" DEFAULT 'info',
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"dismissible" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_announcements_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_active" boolean DEFAULT false,
  	"version_message" varchar NOT NULL,
  	"version_variant" "enum__announcements_v_version_variant" DEFAULT 'info',
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_cta_label" varchar,
  	"version_cta_href" varchar,
  	"version_dismissible" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "podcast_page_cta_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL
  );
  
  CREATE TABLE "podcast_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar,
  	"hero_title" varchar DEFAULT 'Leadership Exchange' NOT NULL,
  	"hero_title_highlight" varchar DEFAULT 'Exchange' NOT NULL,
  	"hero_subtitle" varchar,
  	"featured_hero_episode_id" integer,
  	"latest_episodes_title" varchar DEFAULT 'Latest Episodes',
  	"latest_episodes_limit" numeric DEFAULT 6,
  	"featured_section_title" varchar DEFAULT 'Featured Content',
  	"featured_section_highlight" varchar DEFAULT 'Content',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_podcast_page_v_version_cta_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_podcast_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_eyebrow" varchar,
  	"version_hero_title" varchar DEFAULT 'Leadership Exchange' NOT NULL,
  	"version_hero_title_highlight" varchar DEFAULT 'Exchange' NOT NULL,
  	"version_hero_subtitle" varchar,
  	"version_featured_hero_episode_id" integer,
  	"version_latest_episodes_title" varchar DEFAULT 'Latest Episodes',
  	"version_latest_episodes_limit" numeric DEFAULT 6,
  	"version_featured_section_title" varchar DEFAULT 'Featured Content',
  	"version_featured_section_highlight" varchar DEFAULT 'Content',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_id_users_id_fk" FOREIGN KEY ("actor_user_id_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "preview_audit" ADD CONSTRAINT "preview_audit_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "integrations_routing_events" ADD CONSTRAINT "integrations_routing_events_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integrations_routing_collections" ADD CONSTRAINT "integrations_routing_collections_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integrations_teams_config_mentions_trigger_on" ADD CONSTRAINT "integrations_teams_config_mentions_trigger_on_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."integrations_teams_config_mentions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integrations_teams_config_mentions" ADD CONSTRAINT "integrations_teams_config_mentions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integrations_hubspot_config_field_mapping" ADD CONSTRAINT "integrations_hubspot_config_field_mapping_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integrations_texts" ADD CONSTRAINT "integrations_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_topic_areas" ADD CONSTRAINT "authors_topic_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_education" ADD CONSTRAINT "authors_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_experience" ADD CONSTRAINT "authors_experience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_skills" ADD CONSTRAINT "authors_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_awards" ADD CONSTRAINT "authors_awards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_seo_speakable_path" ADD CONSTRAINT "authors_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_authors_v_version_topic_areas" ADD CONSTRAINT "_authors_v_version_topic_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_authors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_authors_v_version_education" ADD CONSTRAINT "_authors_v_version_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_authors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_authors_v_version_experience" ADD CONSTRAINT "_authors_v_version_experience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_authors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_authors_v_version_skills" ADD CONSTRAINT "_authors_v_version_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_authors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_authors_v_version_awards" ADD CONSTRAINT "_authors_v_version_awards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_authors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_authors_v_version_seo_speakable_path" ADD CONSTRAINT "_authors_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_authors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_authors_v" ADD CONSTRAINT "_authors_v_parent_id_authors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_authors_v" ADD CONSTRAINT "_authors_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_authors_v" ADD CONSTRAINT "_authors_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_authors_v" ADD CONSTRAINT "_authors_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_seo_speakable_path" ADD CONSTRAINT "categories_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_categories_v_version_seo_speakable_path" ADD CONSTRAINT "_categories_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_categories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_icon_id_media_id_fk" FOREIGN KEY ("version_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_parent_id_categories_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_categories_seo_speakable_path" ADD CONSTRAINT "news_categories_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_parent_id_news_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_categories_v_version_seo_speakable_path" ADD CONSTRAINT "_news_categories_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_categories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_categories_v" ADD CONSTRAINT "_news_categories_v_parent_id_news_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_categories_v" ADD CONSTRAINT "_news_categories_v_version_icon_id_media_id_fk" FOREIGN KEY ("version_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_categories_v" ADD CONSTRAINT "_news_categories_v_version_parent_id_news_categories_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."news_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_categories_v" ADD CONSTRAINT "_news_categories_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_categories_v" ADD CONSTRAINT "_news_categories_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_categories_seo_speakable_path" ADD CONSTRAINT "knowledge_categories_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_categories" ADD CONSTRAINT "knowledge_categories_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_categories" ADD CONSTRAINT "knowledge_categories_parent_id_knowledge_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_categories" ADD CONSTRAINT "knowledge_categories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_categories" ADD CONSTRAINT "knowledge_categories_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_categories_v_version_seo_speakable_path" ADD CONSTRAINT "_knowledge_categories_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_categories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_categories_v" ADD CONSTRAINT "_knowledge_categories_v_parent_id_knowledge_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_categories_v" ADD CONSTRAINT "_knowledge_categories_v_version_icon_id_media_id_fk" FOREIGN KEY ("version_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_categories_v" ADD CONSTRAINT "_knowledge_categories_v_version_parent_id_knowledge_categories_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_categories_v" ADD CONSTRAINT "_knowledge_categories_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_categories_v" ADD CONSTRAINT "_knowledge_categories_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forms_fields_options" ADD CONSTRAINT "forms_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_fields_conditions_rules" ADD CONSTRAINT "forms_fields_conditions_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_fields" ADD CONSTRAINT "forms_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_crm_handlers" ADD CONSTRAINT "forms_crm_handlers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_notify_to" ADD CONSTRAINT "forms_notify_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v_version_fields_options" ADD CONSTRAINT "_forms_v_version_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_forms_v_version_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v_version_fields_conditions_rules" ADD CONSTRAINT "_forms_v_version_fields_conditions_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_forms_v_version_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v_version_fields" ADD CONSTRAINT "_forms_v_version_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_forms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v_version_crm_handlers" ADD CONSTRAINT "_forms_v_version_crm_handlers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_forms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v_version_notify_to" ADD CONSTRAINT "_forms_v_version_notify_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_forms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v" ADD CONSTRAINT "_forms_v_parent_id_forms_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads_consent_categories" ADD CONSTRAINT "leads_consent_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads_synced_to" ADD CONSTRAINT "leads_synced_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_duplicate_of_id_leads_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs_faqs" ADD CONSTRAINT "blogs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_how_to_steps" ADD CONSTRAINT "blogs_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs_blocks_how_to_steps" ADD CONSTRAINT "blogs_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_how_to" ADD CONSTRAINT "blogs_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_video_object" ADD CONSTRAINT "blogs_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs_blocks_video_object" ADD CONSTRAINT "blogs_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_faq_page_questions" ADD CONSTRAINT "blogs_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_faq_page" ADD CONSTRAINT "blogs_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_review" ADD CONSTRAINT "blogs_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_software_app" ADD CONSTRAINT "blogs_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "blogs_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_blocks_breadcrumb_list" ADD CONSTRAINT "blogs_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_table_of_contents" ADD CONSTRAINT "blogs_table_of_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_seo_speakable_path" ADD CONSTRAINT "blogs_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_reviewed_by_id_authors_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_categories_id_categories_id_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_blogs_fk" FOREIGN KEY ("blogs_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_version_faqs" ADD CONSTRAINT "_blogs_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_how_to_steps" ADD CONSTRAINT "_blogs_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_how_to_steps" ADD CONSTRAINT "_blogs_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_how_to" ADD CONSTRAINT "_blogs_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_video_object" ADD CONSTRAINT "_blogs_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_video_object" ADD CONSTRAINT "_blogs_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_faq_page_questions" ADD CONSTRAINT "_blogs_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_faq_page" ADD CONSTRAINT "_blogs_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_review" ADD CONSTRAINT "_blogs_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_software_app" ADD CONSTRAINT "_blogs_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_blogs_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_blocks_breadcrumb_list" ADD CONSTRAINT "_blogs_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_version_table_of_contents" ADD CONSTRAINT "_blogs_v_version_table_of_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_version_seo_speakable_path" ADD CONSTRAINT "_blogs_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_parent_id_blogs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blogs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_reviewed_by_id_authors_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_categories_id_categories_id_fk" FOREIGN KEY ("version_categories_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v_rels" ADD CONSTRAINT "_blogs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_blogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_rels" ADD CONSTRAINT "_blogs_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_rels" ADD CONSTRAINT "_blogs_v_rels_blogs_fk" FOREIGN KEY ("blogs_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_how_to_steps" ADD CONSTRAINT "news_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_blocks_how_to_steps" ADD CONSTRAINT "news_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_how_to" ADD CONSTRAINT "news_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_video_object" ADD CONSTRAINT "news_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_blocks_video_object" ADD CONSTRAINT "news_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_faq_page_questions" ADD CONSTRAINT "news_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_faq_page" ADD CONSTRAINT "news_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_review" ADD CONSTRAINT "news_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_software_app" ADD CONSTRAINT "news_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "news_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_blocks_breadcrumb_list" ADD CONSTRAINT "news_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_seo_speakable_path" ADD CONSTRAINT "news_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_publisher_logo_id_media_id_fk" FOREIGN KEY ("publisher_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_news_categories_fk" FOREIGN KEY ("news_categories_id") REFERENCES "public"."news_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_how_to_steps" ADD CONSTRAINT "_news_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_how_to_steps" ADD CONSTRAINT "_news_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_how_to" ADD CONSTRAINT "_news_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_video_object" ADD CONSTRAINT "_news_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_video_object" ADD CONSTRAINT "_news_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_faq_page_questions" ADD CONSTRAINT "_news_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_faq_page" ADD CONSTRAINT "_news_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_review" ADD CONSTRAINT "_news_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_software_app" ADD CONSTRAINT "_news_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_news_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_breadcrumb_list" ADD CONSTRAINT "_news_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_version_seo_speakable_path" ADD CONSTRAINT "_news_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_publisher_logo_id_media_id_fk" FOREIGN KEY ("version_publisher_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_news_categories_fk" FOREIGN KEY ("news_categories_id") REFERENCES "public"."news_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_faqs" ADD CONSTRAINT "guides_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_article_sections" ADD CONSTRAINT "guides_article_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_citations" ADD CONSTRAINT "guides_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_keywords" ADD CONSTRAINT "guides_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_how_to_steps" ADD CONSTRAINT "guides_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_how_to_steps" ADD CONSTRAINT "guides_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_how_to" ADD CONSTRAINT "guides_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_video_object" ADD CONSTRAINT "guides_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_video_object" ADD CONSTRAINT "guides_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_faq_page_questions" ADD CONSTRAINT "guides_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_faq_page" ADD CONSTRAINT "guides_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_review" ADD CONSTRAINT "guides_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_software_app" ADD CONSTRAINT "guides_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "guides_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_breadcrumb_list" ADD CONSTRAINT "guides_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_table_of_contents" ADD CONSTRAINT "guides_table_of_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_seo_speakable_path" ADD CONSTRAINT "guides_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_reviewed_by_id_authors_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_version_faqs" ADD CONSTRAINT "_guides_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_version_article_sections" ADD CONSTRAINT "_guides_v_version_article_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_version_citations" ADD CONSTRAINT "_guides_v_version_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_version_keywords" ADD CONSTRAINT "_guides_v_version_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_how_to_steps" ADD CONSTRAINT "_guides_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_how_to_steps" ADD CONSTRAINT "_guides_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_how_to" ADD CONSTRAINT "_guides_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_video_object" ADD CONSTRAINT "_guides_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_video_object" ADD CONSTRAINT "_guides_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_faq_page_questions" ADD CONSTRAINT "_guides_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_faq_page" ADD CONSTRAINT "_guides_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_review" ADD CONSTRAINT "_guides_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_software_app" ADD CONSTRAINT "_guides_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_guides_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_breadcrumb_list" ADD CONSTRAINT "_guides_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_version_table_of_contents" ADD CONSTRAINT "_guides_v_version_table_of_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_version_seo_speakable_path" ADD CONSTRAINT "_guides_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_parent_id_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_reviewed_by_id_authors_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_how_to_steps" ADD CONSTRAINT "resources_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_blocks_how_to_steps" ADD CONSTRAINT "resources_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_how_to" ADD CONSTRAINT "resources_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_video_object" ADD CONSTRAINT "resources_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_blocks_video_object" ADD CONSTRAINT "resources_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_faq_page_questions" ADD CONSTRAINT "resources_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_faq_page" ADD CONSTRAINT "resources_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_review" ADD CONSTRAINT "resources_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_software_app" ADD CONSTRAINT "resources_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "resources_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_breadcrumb_list" ADD CONSTRAINT "resources_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_seo_speakable_path" ADD CONSTRAINT "resources_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources" ADD CONSTRAINT "resources_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources" ADD CONSTRAINT "resources_gate_form_id_forms_id_fk" FOREIGN KEY ("gate_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources" ADD CONSTRAINT "resources_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources" ADD CONSTRAINT "resources_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_how_to_steps" ADD CONSTRAINT "_resources_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_how_to_steps" ADD CONSTRAINT "_resources_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_how_to" ADD CONSTRAINT "_resources_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_video_object" ADD CONSTRAINT "_resources_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_video_object" ADD CONSTRAINT "_resources_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_faq_page_questions" ADD CONSTRAINT "_resources_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_faq_page" ADD CONSTRAINT "_resources_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_review" ADD CONSTRAINT "_resources_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_software_app" ADD CONSTRAINT "_resources_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_resources_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_blocks_breadcrumb_list" ADD CONSTRAINT "_resources_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v_version_seo_speakable_path" ADD CONSTRAINT "_resources_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_resources_v" ADD CONSTRAINT "_resources_v_parent_id_resources_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_resources_v" ADD CONSTRAINT "_resources_v_version_asset_id_media_id_fk" FOREIGN KEY ("version_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_resources_v" ADD CONSTRAINT "_resources_v_version_gate_form_id_forms_id_fk" FOREIGN KEY ("version_gate_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_resources_v" ADD CONSTRAINT "_resources_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_resources_v" ADD CONSTRAINT "_resources_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_base_faqs" ADD CONSTRAINT "knowledge_base_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_how_to_steps" ADD CONSTRAINT "knowledge_base_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_how_to_steps" ADD CONSTRAINT "knowledge_base_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_how_to" ADD CONSTRAINT "knowledge_base_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_video_object" ADD CONSTRAINT "knowledge_base_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_video_object" ADD CONSTRAINT "knowledge_base_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_faq_page_questions" ADD CONSTRAINT "knowledge_base_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_faq_page" ADD CONSTRAINT "knowledge_base_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_review" ADD CONSTRAINT "knowledge_base_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_software_app" ADD CONSTRAINT "knowledge_base_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "knowledge_base_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_blocks_breadcrumb_list" ADD CONSTRAINT "knowledge_base_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_table_of_contents" ADD CONSTRAINT "knowledge_base_table_of_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_seo_speakable_path" ADD CONSTRAINT "knowledge_base_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_category_id_knowledge_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_reviewed_by_id_authors_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_base_rels" ADD CONSTRAINT "knowledge_base_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_base_rels" ADD CONSTRAINT "knowledge_base_rels_knowledge_base_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_version_faqs" ADD CONSTRAINT "_knowledge_base_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_how_to_steps" ADD CONSTRAINT "_knowledge_base_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_how_to_steps" ADD CONSTRAINT "_knowledge_base_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_how_to" ADD CONSTRAINT "_knowledge_base_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_video_object" ADD CONSTRAINT "_knowledge_base_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_video_object" ADD CONSTRAINT "_knowledge_base_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_faq_page_questions" ADD CONSTRAINT "_knowledge_base_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_faq_page" ADD CONSTRAINT "_knowledge_base_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_review" ADD CONSTRAINT "_knowledge_base_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_software_app" ADD CONSTRAINT "_knowledge_base_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_knowledge_base_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_blocks_breadcrumb_list" ADD CONSTRAINT "_knowledge_base_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_version_table_of_contents" ADD CONSTRAINT "_knowledge_base_v_version_table_of_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_version_seo_speakable_path" ADD CONSTRAINT "_knowledge_base_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v" ADD CONSTRAINT "_knowledge_base_v_parent_id_knowledge_base_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_base"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v" ADD CONSTRAINT "_knowledge_base_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v" ADD CONSTRAINT "_knowledge_base_v_version_category_id_knowledge_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v" ADD CONSTRAINT "_knowledge_base_v_version_reviewed_by_id_authors_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v" ADD CONSTRAINT "_knowledge_base_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v" ADD CONSTRAINT "_knowledge_base_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_rels" ADD CONSTRAINT "_knowledge_base_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_knowledge_base_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_base_v_rels" ADD CONSTRAINT "_knowledge_base_v_rels_knowledge_base_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_gallery" ADD CONSTRAINT "events_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_gallery" ADD CONSTRAINT "events_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_how_to_steps" ADD CONSTRAINT "events_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_how_to_steps" ADD CONSTRAINT "events_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_how_to" ADD CONSTRAINT "events_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_video_object" ADD CONSTRAINT "events_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_video_object" ADD CONSTRAINT "events_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_faq_page_questions" ADD CONSTRAINT "events_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_faq_page" ADD CONSTRAINT "events_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_review" ADD CONSTRAINT "events_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_software_app" ADD CONSTRAINT "events_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "events_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_breadcrumb_list" ADD CONSTRAINT "events_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_seo_speakable_path" ADD CONSTRAINT "events_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_registration_form_id_forms_id_fk" FOREIGN KEY ("registration_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_agenda_pdf_id_media_id_fk" FOREIGN KEY ("agenda_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_gallery" ADD CONSTRAINT "_events_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_version_gallery" ADD CONSTRAINT "_events_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_how_to_steps" ADD CONSTRAINT "_events_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_how_to_steps" ADD CONSTRAINT "_events_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_how_to" ADD CONSTRAINT "_events_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_video_object" ADD CONSTRAINT "_events_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_video_object" ADD CONSTRAINT "_events_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_faq_page_questions" ADD CONSTRAINT "_events_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_faq_page" ADD CONSTRAINT "_events_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_review" ADD CONSTRAINT "_events_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_software_app" ADD CONSTRAINT "_events_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_events_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_blocks_breadcrumb_list" ADD CONSTRAINT "_events_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_seo_speakable_path" ADD CONSTRAINT "_events_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_registration_form_id_forms_id_fk" FOREIGN KEY ("version_registration_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_agenda_pdf_id_media_id_fk" FOREIGN KEY ("version_agenda_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_how_to_steps" ADD CONSTRAINT "webinars_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "webinars_blocks_how_to_steps" ADD CONSTRAINT "webinars_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_how_to" ADD CONSTRAINT "webinars_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_video_object" ADD CONSTRAINT "webinars_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "webinars_blocks_video_object" ADD CONSTRAINT "webinars_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_faq_page_questions" ADD CONSTRAINT "webinars_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_faq_page" ADD CONSTRAINT "webinars_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_review" ADD CONSTRAINT "webinars_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_software_app" ADD CONSTRAINT "webinars_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "webinars_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_blocks_breadcrumb_list" ADD CONSTRAINT "webinars_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_seo_speakable_path" ADD CONSTRAINT "webinars_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars" ADD CONSTRAINT "webinars_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "webinars" ADD CONSTRAINT "webinars_registration_form_id_forms_id_fk" FOREIGN KEY ("registration_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "webinars" ADD CONSTRAINT "webinars_pdf_id_media_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "webinars" ADD CONSTRAINT "webinars_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "webinars" ADD CONSTRAINT "webinars_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "webinars_rels" ADD CONSTRAINT "webinars_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "webinars_rels" ADD CONSTRAINT "webinars_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_how_to_steps" ADD CONSTRAINT "_webinars_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_how_to_steps" ADD CONSTRAINT "_webinars_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_how_to" ADD CONSTRAINT "_webinars_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_video_object" ADD CONSTRAINT "_webinars_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_video_object" ADD CONSTRAINT "_webinars_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_faq_page_questions" ADD CONSTRAINT "_webinars_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_faq_page" ADD CONSTRAINT "_webinars_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_review" ADD CONSTRAINT "_webinars_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_software_app" ADD CONSTRAINT "_webinars_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_webinars_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_blocks_breadcrumb_list" ADD CONSTRAINT "_webinars_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_version_seo_speakable_path" ADD CONSTRAINT "_webinars_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_webinars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v" ADD CONSTRAINT "_webinars_v_parent_id_webinars_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."webinars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_webinars_v" ADD CONSTRAINT "_webinars_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_webinars_v" ADD CONSTRAINT "_webinars_v_version_registration_form_id_forms_id_fk" FOREIGN KEY ("version_registration_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_webinars_v" ADD CONSTRAINT "_webinars_v_version_pdf_id_media_id_fk" FOREIGN KEY ("version_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_webinars_v" ADD CONSTRAINT "_webinars_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_webinars_v" ADD CONSTRAINT "_webinars_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_webinars_v_rels" ADD CONSTRAINT "_webinars_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_webinars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_webinars_v_rels" ADD CONSTRAINT "_webinars_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_thumbnail_override_id_media_id_fk" FOREIGN KEY ("thumbnail_override_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v" ADD CONSTRAINT "_podcast_episodes_v_parent_id_podcast_episodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v" ADD CONSTRAINT "_podcast_episodes_v_version_thumbnail_override_id_media_id_fk" FOREIGN KEY ("version_thumbnail_override_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs_blocks_how_to_steps" ADD CONSTRAINT "jobs_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs_blocks_how_to_steps" ADD CONSTRAINT "jobs_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_blocks_how_to" ADD CONSTRAINT "jobs_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_blocks_video_object" ADD CONSTRAINT "jobs_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs_blocks_video_object" ADD CONSTRAINT "jobs_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_blocks_faq_page_questions" ADD CONSTRAINT "jobs_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_blocks_faq_page" ADD CONSTRAINT "jobs_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_blocks_review" ADD CONSTRAINT "jobs_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_blocks_software_app" ADD CONSTRAINT "jobs_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "jobs_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_blocks_breadcrumb_list" ADD CONSTRAINT "jobs_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_seo_speakable_path" ADD CONSTRAINT "jobs_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_description_pdf_id_media_id_fk" FOREIGN KEY ("description_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs_rels" ADD CONSTRAINT "jobs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_rels" ADD CONSTRAINT "jobs_rels_job_locations_fk" FOREIGN KEY ("job_locations_id") REFERENCES "public"."job_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_how_to_steps" ADD CONSTRAINT "_jobs_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_how_to_steps" ADD CONSTRAINT "_jobs_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_how_to" ADD CONSTRAINT "_jobs_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_video_object" ADD CONSTRAINT "_jobs_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_video_object" ADD CONSTRAINT "_jobs_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_faq_page_questions" ADD CONSTRAINT "_jobs_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_faq_page" ADD CONSTRAINT "_jobs_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_review" ADD CONSTRAINT "_jobs_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_software_app" ADD CONSTRAINT "_jobs_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_jobs_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_blocks_breadcrumb_list" ADD CONSTRAINT "_jobs_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_version_seo_speakable_path" ADD CONSTRAINT "_jobs_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_parent_id_jobs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_version_description_pdf_id_media_id_fk" FOREIGN KEY ("version_description_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v_rels" ADD CONSTRAINT "_jobs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_rels" ADD CONSTRAINT "_jobs_v_rels_job_locations_fk" FOREIGN KEY ("job_locations_id") REFERENCES "public"."job_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_galleries" ADD CONSTRAINT "about_galleries_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_galleries_v" ADD CONSTRAINT "_about_galleries_v_parent_id_about_galleries_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."about_galleries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_galleries_v" ADD CONSTRAINT "_about_galleries_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_breadcrumb" ADD CONSTRAINT "pages_breadcrumb_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_primary_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("primary_cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_secondary_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("secondary_cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_primary_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("primary_cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_secondary_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("secondary_cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_block" ADD CONSTRAINT "pages_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_block" ADD CONSTRAINT "pages_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_grid_features" ADD CONSTRAINT "pages_blocks_feature_grid_features_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_grid_features" ADD CONSTRAINT "pages_blocks_feature_grid_features_link_media_target_id_media_id_fk" FOREIGN KEY ("link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_grid_features" ADD CONSTRAINT "pages_blocks_feature_grid_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_grid" ADD CONSTRAINT "pages_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud_logos" ADD CONSTRAINT "pages_blocks_logo_cloud_logos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud_logos" ADD CONSTRAINT "pages_blocks_logo_cloud_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_cloud"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud" ADD CONSTRAINT "pages_blocks_logo_cloud_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_integration_logos_integrations" ADD CONSTRAINT "pages_blocks_integration_logos_integrations_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_integration_logos_integrations" ADD CONSTRAINT "pages_blocks_integration_logos_integrations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_integration_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_integration_logos" ADD CONSTRAINT "pages_blocks_integration_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonial" ADD CONSTRAINT "pages_blocks_testimonial_company_logo_id_media_id_fk" FOREIGN KEY ("company_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonial" ADD CONSTRAINT "pages_blocks_testimonial_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonial" ADD CONSTRAINT "pages_blocks_testimonial_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_metrics" ADD CONSTRAINT "pages_blocks_stats_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_metrics_bar_metrics" ADD CONSTRAINT "pages_blocks_metrics_bar_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_metrics_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_metrics_bar" ADD CONSTRAINT "pages_blocks_metrics_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_images" ADD CONSTRAINT "pages_blocks_gallery_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_images" ADD CONSTRAINT "pages_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_embed" ADD CONSTRAINT "pages_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_code_block" ADD CONSTRAINT "pages_blocks_code_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pricing_tiers_features" ADD CONSTRAINT "pages_blocks_pricing_tiers_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_pricing_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pricing_tiers" ADD CONSTRAINT "pages_blocks_pricing_tiers_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_pricing_tiers" ADD CONSTRAINT "pages_blocks_pricing_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pricing" ADD CONSTRAINT "pages_blocks_pricing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_jobs_list" ADD CONSTRAINT "pages_blocks_jobs_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table_headers" ADD CONSTRAINT "pages_blocks_table_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table_rows_cells" ADD CONSTRAINT "pages_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table_rows" ADD CONSTRAINT "pages_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table" ADD CONSTRAINT "pages_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_section" ADD CONSTRAINT "pages_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_how_to_steps" ADD CONSTRAINT "pages_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_how_to_steps" ADD CONSTRAINT "pages_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_how_to" ADD CONSTRAINT "pages_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_video_object" ADD CONSTRAINT "pages_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_video_object" ADD CONSTRAINT "pages_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_page_questions" ADD CONSTRAINT "pages_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_page" ADD CONSTRAINT "pages_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_review" ADD CONSTRAINT "pages_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_software_app" ADD CONSTRAINT "pages_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "pages_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_breadcrumb_list" ADD CONSTRAINT "pages_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_seo_speakable_path" ADD CONSTRAINT "pages_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_blogs_fk" FOREIGN KEY ("blogs_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_webinars_fk" FOREIGN KEY ("webinars_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_news_categories_fk" FOREIGN KEY ("news_categories_id") REFERENCES "public"."news_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_job_locations_fk" FOREIGN KEY ("job_locations_id") REFERENCES "public"."job_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_breadcrumb" ADD CONSTRAINT "_pages_v_version_breadcrumb_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_primary_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("primary_cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_secondary_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("secondary_cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_primary_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("primary_cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_secondary_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("secondary_cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_block" ADD CONSTRAINT "_pages_v_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_block" ADD CONSTRAINT "_pages_v_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_grid_features" ADD CONSTRAINT "_pages_v_blocks_feature_grid_features_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_grid_features" ADD CONSTRAINT "_pages_v_blocks_feature_grid_features_link_media_target_id_media_id_fk" FOREIGN KEY ("link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_grid_features" ADD CONSTRAINT "_pages_v_blocks_feature_grid_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_grid" ADD CONSTRAINT "_pages_v_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud_logos" ADD CONSTRAINT "_pages_v_blocks_logo_cloud_logos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud_logos" ADD CONSTRAINT "_pages_v_blocks_logo_cloud_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_logo_cloud"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud" ADD CONSTRAINT "_pages_v_blocks_logo_cloud_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_integration_logos_integrations" ADD CONSTRAINT "_pages_v_blocks_integration_logos_integrations_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_integration_logos_integrations" ADD CONSTRAINT "_pages_v_blocks_integration_logos_integrations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_integration_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_integration_logos" ADD CONSTRAINT "_pages_v_blocks_integration_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonial" ADD CONSTRAINT "_pages_v_blocks_testimonial_company_logo_id_media_id_fk" FOREIGN KEY ("company_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonial" ADD CONSTRAINT "_pages_v_blocks_testimonial_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonial" ADD CONSTRAINT "_pages_v_blocks_testimonial_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_metrics" ADD CONSTRAINT "_pages_v_blocks_stats_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats" ADD CONSTRAINT "_pages_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_metrics_bar_metrics" ADD CONSTRAINT "_pages_v_blocks_metrics_bar_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_metrics_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_metrics_bar" ADD CONSTRAINT "_pages_v_blocks_metrics_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_images" ADD CONSTRAINT "_pages_v_blocks_gallery_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_images" ADD CONSTRAINT "_pages_v_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_embed" ADD CONSTRAINT "_pages_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_code_block" ADD CONSTRAINT "_pages_v_blocks_code_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pricing_tiers_features" ADD CONSTRAINT "_pages_v_blocks_pricing_tiers_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_pricing_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pricing_tiers" ADD CONSTRAINT "_pages_v_blocks_pricing_tiers_cta_link_media_target_id_media_id_fk" FOREIGN KEY ("cta_link_media_target_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pricing_tiers" ADD CONSTRAINT "_pages_v_blocks_pricing_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pricing" ADD CONSTRAINT "_pages_v_blocks_pricing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_jobs_list" ADD CONSTRAINT "_pages_v_blocks_jobs_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table_headers" ADD CONSTRAINT "_pages_v_blocks_table_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table_rows_cells" ADD CONSTRAINT "_pages_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table_rows" ADD CONSTRAINT "_pages_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table" ADD CONSTRAINT "_pages_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_section" ADD CONSTRAINT "_pages_v_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_how_to_steps" ADD CONSTRAINT "_pages_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_how_to_steps" ADD CONSTRAINT "_pages_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_how_to" ADD CONSTRAINT "_pages_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_video_object" ADD CONSTRAINT "_pages_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_video_object" ADD CONSTRAINT "_pages_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_page_questions" ADD CONSTRAINT "_pages_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_page" ADD CONSTRAINT "_pages_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_review" ADD CONSTRAINT "_pages_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_software_app" ADD CONSTRAINT "_pages_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_pages_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_breadcrumb_list" ADD CONSTRAINT "_pages_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_seo_speakable_path" ADD CONSTRAINT "_pages_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_parent_id_pages_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_blogs_fk" FOREIGN KEY ("blogs_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_webinars_fk" FOREIGN KEY ("webinars_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_news_categories_fk" FOREIGN KEY ("news_categories_id") REFERENCES "public"."news_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_job_locations_fk" FOREIGN KEY ("job_locations_id") REFERENCES "public"."job_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_broken_links_fk" FOREIGN KEY ("broken_links_id") REFERENCES "public"."broken_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_log_fk" FOREIGN KEY ("search_log_id") REFERENCES "public"."search_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_preview_audit_fk" FOREIGN KEY ("preview_audit_id") REFERENCES "public"."preview_audit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_webhooks_dead_letter_fk" FOREIGN KEY ("webhooks_dead_letter_id") REFERENCES "public"."webhooks_dead_letter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_integrations_fk" FOREIGN KEY ("integrations_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_cache_fk" FOREIGN KEY ("analytics_cache_id") REFERENCES "public"."analytics_cache"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_categories_fk" FOREIGN KEY ("news_categories_id") REFERENCES "public"."news_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_knowledge_categories_fk" FOREIGN KEY ("knowledge_categories_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_job_locations_fk" FOREIGN KEY ("job_locations_id") REFERENCES "public"."job_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blogs_fk" FOREIGN KEY ("blogs_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_knowledge_base_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_webinars_fk" FOREIGN KEY ("webinars_id") REFERENCES "public"."webinars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcast_episodes_fk" FOREIGN KEY ("podcast_episodes_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_about_galleries_fk" FOREIGN KEY ("about_galleries_id") REFERENCES "public"."about_galleries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_defaults_organization_json_ld_same_as" ADD CONSTRAINT "seo_defaults_organization_json_ld_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo_defaults"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_favicon32_id_media_id_fk" FOREIGN KEY ("brand_icons_favicon32_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_icon192_id_media_id_fk" FOREIGN KEY ("brand_icons_icon192_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_icon512_id_media_id_fk" FOREIGN KEY ("brand_icons_icon512_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_apple_touch_icon_id_media_id_fk" FOREIGN KEY ("brand_icons_apple_touch_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_safari_pinned_tab_svg_id_media_id_fk" FOREIGN KEY ("brand_icons_safari_pinned_tab_svg_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_organization_json_ld_logo_id_media_id_fk" FOREIGN KEY ("organization_json_ld_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v_version_organization_json_ld_same_as" ADD CONSTRAINT "_seo_defaults_v_version_organization_json_ld_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_seo_defaults_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_default_og_image_id_media_id_fk" FOREIGN KEY ("version_default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_favicon32_id_media_id_fk" FOREIGN KEY ("version_brand_icons_favicon32_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_icon192_id_media_id_fk" FOREIGN KEY ("version_brand_icons_icon192_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_icon512_id_media_id_fk" FOREIGN KEY ("version_brand_icons_icon512_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_apple_touch_icon_id_media_id_fk" FOREIGN KEY ("version_brand_icons_apple_touch_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_safari_pinned_tab_svg_id_media_id_fk" FOREIGN KEY ("version_brand_icons_safari_pinned_tab_svg_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_organization_json_ld_logo_id_media_id_fk" FOREIGN KEY ("version_organization_json_ld_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_nav_items_mega_menu_columns_items" ADD CONSTRAINT "main_nav_items_mega_menu_columns_items_target_id_pages_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_nav_items_mega_menu_columns_items" ADD CONSTRAINT "main_nav_items_mega_menu_columns_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."main_nav_items_mega_menu_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "main_nav_items_mega_menu_columns" ADD CONSTRAINT "main_nav_items_mega_menu_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."main_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "main_nav_items" ADD CONSTRAINT "main_nav_items_target_id_pages_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_nav_items" ADD CONSTRAINT "main_nav_items_mega_menu_featured_card_target_id_pages_id_fk" FOREIGN KEY ("mega_menu_featured_card_target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_nav_items" ADD CONSTRAINT "main_nav_items_mega_menu_featured_card_image_id_media_id_fk" FOREIGN KEY ("mega_menu_featured_card_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_nav_items" ADD CONSTRAINT "main_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."main_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_main_nav_v_version_items_mega_menu_columns_items" ADD CONSTRAINT "_main_nav_v_version_items_mega_menu_columns_items_target_id_pages_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_nav_v_version_items_mega_menu_columns_items" ADD CONSTRAINT "_main_nav_v_version_items_mega_menu_columns_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_main_nav_v_version_items_mega_menu_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_main_nav_v_version_items_mega_menu_columns" ADD CONSTRAINT "_main_nav_v_version_items_mega_menu_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_main_nav_v_version_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_main_nav_v_version_items" ADD CONSTRAINT "_main_nav_v_version_items_target_id_pages_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_nav_v_version_items" ADD CONSTRAINT "_main_nav_v_version_items_mega_menu_featured_card_target_id_pages_id_fk" FOREIGN KEY ("mega_menu_featured_card_target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_nav_v_version_items" ADD CONSTRAINT "_main_nav_v_version_items_mega_menu_featured_card_image_id_media_id_fk" FOREIGN KEY ("mega_menu_featured_card_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_nav_v_version_items" ADD CONSTRAINT "_main_nav_v_version_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_main_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_columns_items" ADD CONSTRAINT "footer_nav_columns_items_target_id_pages_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "footer_nav_columns_items" ADD CONSTRAINT "footer_nav_columns_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_columns" ADD CONSTRAINT "footer_nav_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_social" ADD CONSTRAINT "footer_nav_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_legal_links" ADD CONSTRAINT "footer_nav_legal_links_target_id_pages_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "footer_nav_legal_links" ADD CONSTRAINT "footer_nav_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_badges" ADD CONSTRAINT "footer_nav_badges_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "footer_nav_badges" ADD CONSTRAINT "footer_nav_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav" ADD CONSTRAINT "footer_nav_newsletter_signup_id_forms_id_fk" FOREIGN KEY ("newsletter_signup_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_columns_items" ADD CONSTRAINT "_footer_nav_v_version_columns_items_target_id_pages_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_columns_items" ADD CONSTRAINT "_footer_nav_v_version_columns_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v_version_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_columns" ADD CONSTRAINT "_footer_nav_v_version_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_social" ADD CONSTRAINT "_footer_nav_v_version_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_legal_links" ADD CONSTRAINT "_footer_nav_v_version_legal_links_target_id_pages_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_legal_links" ADD CONSTRAINT "_footer_nav_v_version_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_badges" ADD CONSTRAINT "_footer_nav_v_version_badges_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_badges" ADD CONSTRAINT "_footer_nav_v_version_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v" ADD CONSTRAINT "_footer_nav_v_version_newsletter_signup_id_forms_id_fk" FOREIGN KEY ("version_newsletter_signup_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_page_cta_cards" ADD CONSTRAINT "podcast_page_cta_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."podcast_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcast_page" ADD CONSTRAINT "podcast_page_featured_hero_episode_id_podcast_episodes_id_fk" FOREIGN KEY ("featured_hero_episode_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_page_v_version_cta_cards" ADD CONSTRAINT "_podcast_page_v_version_cta_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_podcast_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_podcast_page_v" ADD CONSTRAINT "_podcast_page_v_version_featured_hero_episode_id_podcast_episodes_id_fk" FOREIGN KEY ("version_featured_hero_episode_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "broken_links_url_idx" ON "broken_links" USING btree ("url");
  CREATE INDEX "broken_links_status_idx" ON "broken_links" USING btree ("status");
  CREATE INDEX "broken_links_source_collection_idx" ON "broken_links" USING btree ("source_collection");
  CREATE INDEX "broken_links_source_doc_id_idx" ON "broken_links" USING btree ("source_doc_id");
  CREATE INDEX "broken_links_updated_at_idx" ON "broken_links" USING btree ("updated_at");
  CREATE INDEX "broken_links_created_at_idx" ON "broken_links" USING btree ("created_at");
  CREATE INDEX "audit_log_actor_user_id_idx" ON "audit_log" USING btree ("actor_user_id_id");
  CREATE INDEX "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  CREATE INDEX "search_log_updated_at_idx" ON "search_log" USING btree ("updated_at");
  CREATE INDEX "search_log_created_at_idx" ON "search_log" USING btree ("created_at");
  CREATE INDEX "preview_audit_actor_idx" ON "preview_audit" USING btree ("actor_id");
  CREATE INDEX "preview_audit_updated_at_idx" ON "preview_audit" USING btree ("updated_at");
  CREATE INDEX "preview_audit_created_at_idx" ON "preview_audit" USING btree ("created_at");
  CREATE INDEX "webhooks_dead_letter_updated_at_idx" ON "webhooks_dead_letter" USING btree ("updated_at");
  CREATE INDEX "webhooks_dead_letter_created_at_idx" ON "webhooks_dead_letter" USING btree ("created_at");
  CREATE INDEX "integrations_routing_events_order_idx" ON "integrations_routing_events" USING btree ("order");
  CREATE INDEX "integrations_routing_events_parent_idx" ON "integrations_routing_events" USING btree ("parent_id");
  CREATE INDEX "integrations_routing_collections_order_idx" ON "integrations_routing_collections" USING btree ("order");
  CREATE INDEX "integrations_routing_collections_parent_idx" ON "integrations_routing_collections" USING btree ("parent_id");
  CREATE INDEX "integrations_teams_config_mentions_trigger_on_order_idx" ON "integrations_teams_config_mentions_trigger_on" USING btree ("order");
  CREATE INDEX "integrations_teams_config_mentions_trigger_on_parent_idx" ON "integrations_teams_config_mentions_trigger_on" USING btree ("parent_id");
  CREATE INDEX "integrations_teams_config_mentions_order_idx" ON "integrations_teams_config_mentions" USING btree ("_order");
  CREATE INDEX "integrations_teams_config_mentions_parent_id_idx" ON "integrations_teams_config_mentions" USING btree ("_parent_id");
  CREATE INDEX "integrations_hubspot_config_field_mapping_order_idx" ON "integrations_hubspot_config_field_mapping" USING btree ("_order");
  CREATE INDEX "integrations_hubspot_config_field_mapping_parent_id_idx" ON "integrations_hubspot_config_field_mapping" USING btree ("_parent_id");
  CREATE INDEX "integrations_updated_at_idx" ON "integrations" USING btree ("updated_at");
  CREATE INDEX "integrations_created_at_idx" ON "integrations" USING btree ("created_at");
  CREATE INDEX "integrations_texts_order_parent" ON "integrations_texts" USING btree ("order","parent_id");
  CREATE INDEX "analytics_cache_updated_at_idx" ON "analytics_cache" USING btree ("updated_at");
  CREATE INDEX "analytics_cache_created_at_idx" ON "analytics_cache" USING btree ("created_at");
  CREATE INDEX "env_provider_scope_key_idx" ON "analytics_cache" USING btree ("env","provider","scope","key");
  CREATE INDEX "authors_topic_areas_order_idx" ON "authors_topic_areas" USING btree ("_order");
  CREATE INDEX "authors_topic_areas_parent_id_idx" ON "authors_topic_areas" USING btree ("_parent_id");
  CREATE INDEX "authors_education_order_idx" ON "authors_education" USING btree ("_order");
  CREATE INDEX "authors_education_parent_id_idx" ON "authors_education" USING btree ("_parent_id");
  CREATE INDEX "authors_experience_order_idx" ON "authors_experience" USING btree ("_order");
  CREATE INDEX "authors_experience_parent_id_idx" ON "authors_experience" USING btree ("_parent_id");
  CREATE INDEX "authors_skills_order_idx" ON "authors_skills" USING btree ("_order");
  CREATE INDEX "authors_skills_parent_id_idx" ON "authors_skills" USING btree ("_parent_id");
  CREATE INDEX "authors_awards_order_idx" ON "authors_awards" USING btree ("_order");
  CREATE INDEX "authors_awards_parent_id_idx" ON "authors_awards" USING btree ("_parent_id");
  CREATE INDEX "authors_seo_speakable_path_order_idx" ON "authors_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "authors_seo_speakable_path_parent_id_idx" ON "authors_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_photo_idx" ON "authors" USING btree ("photo_id");
  CREATE INDEX "authors_seo_seo_og_image_idx" ON "authors" USING btree ("seo_og_image_id");
  CREATE INDEX "authors_seo_seo_twitter_image_idx" ON "authors" USING btree ("seo_twitter_image_id");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE INDEX "authors__status_idx" ON "authors" USING btree ("_status");
  CREATE INDEX "_authors_v_version_topic_areas_order_idx" ON "_authors_v_version_topic_areas" USING btree ("_order");
  CREATE INDEX "_authors_v_version_topic_areas_parent_id_idx" ON "_authors_v_version_topic_areas" USING btree ("_parent_id");
  CREATE INDEX "_authors_v_version_education_order_idx" ON "_authors_v_version_education" USING btree ("_order");
  CREATE INDEX "_authors_v_version_education_parent_id_idx" ON "_authors_v_version_education" USING btree ("_parent_id");
  CREATE INDEX "_authors_v_version_experience_order_idx" ON "_authors_v_version_experience" USING btree ("_order");
  CREATE INDEX "_authors_v_version_experience_parent_id_idx" ON "_authors_v_version_experience" USING btree ("_parent_id");
  CREATE INDEX "_authors_v_version_skills_order_idx" ON "_authors_v_version_skills" USING btree ("_order");
  CREATE INDEX "_authors_v_version_skills_parent_id_idx" ON "_authors_v_version_skills" USING btree ("_parent_id");
  CREATE INDEX "_authors_v_version_awards_order_idx" ON "_authors_v_version_awards" USING btree ("_order");
  CREATE INDEX "_authors_v_version_awards_parent_id_idx" ON "_authors_v_version_awards" USING btree ("_parent_id");
  CREATE INDEX "_authors_v_version_seo_speakable_path_order_idx" ON "_authors_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_authors_v_version_seo_speakable_path_parent_id_idx" ON "_authors_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_authors_v_parent_idx" ON "_authors_v" USING btree ("parent_id");
  CREATE INDEX "_authors_v_version_version_slug_idx" ON "_authors_v" USING btree ("version_slug");
  CREATE INDEX "_authors_v_version_version_photo_idx" ON "_authors_v" USING btree ("version_photo_id");
  CREATE INDEX "_authors_v_version_seo_version_seo_og_image_idx" ON "_authors_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_authors_v_version_seo_version_seo_twitter_image_idx" ON "_authors_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_authors_v_version_version_updated_at_idx" ON "_authors_v" USING btree ("version_updated_at");
  CREATE INDEX "_authors_v_version_version_created_at_idx" ON "_authors_v" USING btree ("version_created_at");
  CREATE INDEX "_authors_v_version_version__status_idx" ON "_authors_v" USING btree ("version__status");
  CREATE INDEX "_authors_v_created_at_idx" ON "_authors_v" USING btree ("created_at");
  CREATE INDEX "_authors_v_updated_at_idx" ON "_authors_v" USING btree ("updated_at");
  CREATE INDEX "_authors_v_latest_idx" ON "_authors_v" USING btree ("latest");
  CREATE INDEX "categories_seo_speakable_path_order_idx" ON "categories_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "categories_seo_speakable_path_parent_id_idx" ON "categories_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_icon_idx" ON "categories" USING btree ("icon_id");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_seo_seo_og_image_idx" ON "categories" USING btree ("seo_og_image_id");
  CREATE INDEX "categories_seo_seo_twitter_image_idx" ON "categories" USING btree ("seo_twitter_image_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "categories__status_idx" ON "categories" USING btree ("_status");
  CREATE INDEX "_categories_v_version_seo_speakable_path_order_idx" ON "_categories_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_categories_v_version_seo_speakable_path_parent_id_idx" ON "_categories_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_categories_v_parent_idx" ON "_categories_v" USING btree ("parent_id");
  CREATE INDEX "_categories_v_version_version_slug_idx" ON "_categories_v" USING btree ("version_slug");
  CREATE INDEX "_categories_v_version_version_icon_idx" ON "_categories_v" USING btree ("version_icon_id");
  CREATE INDEX "_categories_v_version_version_parent_idx" ON "_categories_v" USING btree ("version_parent_id");
  CREATE INDEX "_categories_v_version_seo_version_seo_og_image_idx" ON "_categories_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_categories_v_version_seo_version_seo_twitter_image_idx" ON "_categories_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_categories_v_version_version_updated_at_idx" ON "_categories_v" USING btree ("version_updated_at");
  CREATE INDEX "_categories_v_version_version_created_at_idx" ON "_categories_v" USING btree ("version_created_at");
  CREATE INDEX "_categories_v_version_version__status_idx" ON "_categories_v" USING btree ("version__status");
  CREATE INDEX "_categories_v_created_at_idx" ON "_categories_v" USING btree ("created_at");
  CREATE INDEX "_categories_v_updated_at_idx" ON "_categories_v" USING btree ("updated_at");
  CREATE INDEX "_categories_v_latest_idx" ON "_categories_v" USING btree ("latest");
  CREATE INDEX "news_categories_seo_speakable_path_order_idx" ON "news_categories_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "news_categories_seo_speakable_path_parent_id_idx" ON "news_categories_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "news_categories_slug_idx" ON "news_categories" USING btree ("slug");
  CREATE INDEX "news_categories_icon_idx" ON "news_categories" USING btree ("icon_id");
  CREATE INDEX "news_categories_parent_idx" ON "news_categories" USING btree ("parent_id");
  CREATE INDEX "news_categories_seo_seo_og_image_idx" ON "news_categories" USING btree ("seo_og_image_id");
  CREATE INDEX "news_categories_seo_seo_twitter_image_idx" ON "news_categories" USING btree ("seo_twitter_image_id");
  CREATE INDEX "news_categories_updated_at_idx" ON "news_categories" USING btree ("updated_at");
  CREATE INDEX "news_categories_created_at_idx" ON "news_categories" USING btree ("created_at");
  CREATE INDEX "news_categories__status_idx" ON "news_categories" USING btree ("_status");
  CREATE INDEX "_news_categories_v_version_seo_speakable_path_order_idx" ON "_news_categories_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_news_categories_v_version_seo_speakable_path_parent_id_idx" ON "_news_categories_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_news_categories_v_parent_idx" ON "_news_categories_v" USING btree ("parent_id");
  CREATE INDEX "_news_categories_v_version_version_slug_idx" ON "_news_categories_v" USING btree ("version_slug");
  CREATE INDEX "_news_categories_v_version_version_icon_idx" ON "_news_categories_v" USING btree ("version_icon_id");
  CREATE INDEX "_news_categories_v_version_version_parent_idx" ON "_news_categories_v" USING btree ("version_parent_id");
  CREATE INDEX "_news_categories_v_version_seo_version_seo_og_image_idx" ON "_news_categories_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_news_categories_v_version_seo_version_seo_twitter_image_idx" ON "_news_categories_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_news_categories_v_version_version_updated_at_idx" ON "_news_categories_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_categories_v_version_version_created_at_idx" ON "_news_categories_v" USING btree ("version_created_at");
  CREATE INDEX "_news_categories_v_version_version__status_idx" ON "_news_categories_v" USING btree ("version__status");
  CREATE INDEX "_news_categories_v_created_at_idx" ON "_news_categories_v" USING btree ("created_at");
  CREATE INDEX "_news_categories_v_updated_at_idx" ON "_news_categories_v" USING btree ("updated_at");
  CREATE INDEX "_news_categories_v_latest_idx" ON "_news_categories_v" USING btree ("latest");
  CREATE INDEX "knowledge_categories_seo_speakable_path_order_idx" ON "knowledge_categories_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "knowledge_categories_seo_speakable_path_parent_id_idx" ON "knowledge_categories_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "knowledge_categories_slug_idx" ON "knowledge_categories" USING btree ("slug");
  CREATE INDEX "knowledge_categories_icon_idx" ON "knowledge_categories" USING btree ("icon_id");
  CREATE INDEX "knowledge_categories_parent_idx" ON "knowledge_categories" USING btree ("parent_id");
  CREATE INDEX "knowledge_categories_seo_seo_og_image_idx" ON "knowledge_categories" USING btree ("seo_og_image_id");
  CREATE INDEX "knowledge_categories_seo_seo_twitter_image_idx" ON "knowledge_categories" USING btree ("seo_twitter_image_id");
  CREATE INDEX "knowledge_categories_updated_at_idx" ON "knowledge_categories" USING btree ("updated_at");
  CREATE INDEX "knowledge_categories_created_at_idx" ON "knowledge_categories" USING btree ("created_at");
  CREATE INDEX "knowledge_categories__status_idx" ON "knowledge_categories" USING btree ("_status");
  CREATE INDEX "_knowledge_categories_v_version_seo_speakable_path_order_idx" ON "_knowledge_categories_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_knowledge_categories_v_version_seo_speakable_path_parent_id_idx" ON "_knowledge_categories_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_categories_v_parent_idx" ON "_knowledge_categories_v" USING btree ("parent_id");
  CREATE INDEX "_knowledge_categories_v_version_version_slug_idx" ON "_knowledge_categories_v" USING btree ("version_slug");
  CREATE INDEX "_knowledge_categories_v_version_version_icon_idx" ON "_knowledge_categories_v" USING btree ("version_icon_id");
  CREATE INDEX "_knowledge_categories_v_version_version_parent_idx" ON "_knowledge_categories_v" USING btree ("version_parent_id");
  CREATE INDEX "_knowledge_categories_v_version_seo_version_seo_og_image_idx" ON "_knowledge_categories_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_knowledge_categories_v_version_seo_version_seo_twitter__idx" ON "_knowledge_categories_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_knowledge_categories_v_version_version_updated_at_idx" ON "_knowledge_categories_v" USING btree ("version_updated_at");
  CREATE INDEX "_knowledge_categories_v_version_version_created_at_idx" ON "_knowledge_categories_v" USING btree ("version_created_at");
  CREATE INDEX "_knowledge_categories_v_version_version__status_idx" ON "_knowledge_categories_v" USING btree ("version__status");
  CREATE INDEX "_knowledge_categories_v_created_at_idx" ON "_knowledge_categories_v" USING btree ("created_at");
  CREATE INDEX "_knowledge_categories_v_updated_at_idx" ON "_knowledge_categories_v" USING btree ("updated_at");
  CREATE INDEX "_knowledge_categories_v_latest_idx" ON "_knowledge_categories_v" USING btree ("latest");
  CREATE UNIQUE INDEX "job_locations_slug_idx" ON "job_locations" USING btree ("slug");
  CREATE INDEX "job_locations_updated_at_idx" ON "job_locations" USING btree ("updated_at");
  CREATE INDEX "job_locations_created_at_idx" ON "job_locations" USING btree ("created_at");
  CREATE INDEX "forms_fields_options_order_idx" ON "forms_fields_options" USING btree ("_order");
  CREATE INDEX "forms_fields_options_parent_id_idx" ON "forms_fields_options" USING btree ("_parent_id");
  CREATE INDEX "forms_fields_conditions_rules_order_idx" ON "forms_fields_conditions_rules" USING btree ("_order");
  CREATE INDEX "forms_fields_conditions_rules_parent_id_idx" ON "forms_fields_conditions_rules" USING btree ("_parent_id");
  CREATE INDEX "forms_fields_order_idx" ON "forms_fields" USING btree ("_order");
  CREATE INDEX "forms_fields_parent_id_idx" ON "forms_fields" USING btree ("_parent_id");
  CREATE INDEX "forms_crm_handlers_order_idx" ON "forms_crm_handlers" USING btree ("order");
  CREATE INDEX "forms_crm_handlers_parent_idx" ON "forms_crm_handlers" USING btree ("parent_id");
  CREATE INDEX "forms_notify_to_order_idx" ON "forms_notify_to" USING btree ("_order");
  CREATE INDEX "forms_notify_to_parent_id_idx" ON "forms_notify_to" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "forms_slug_idx" ON "forms" USING btree ("slug");
  CREATE INDEX "forms_updated_at_idx" ON "forms" USING btree ("updated_at");
  CREATE INDEX "forms_created_at_idx" ON "forms" USING btree ("created_at");
  CREATE INDEX "forms__status_idx" ON "forms" USING btree ("_status");
  CREATE INDEX "_forms_v_version_fields_options_order_idx" ON "_forms_v_version_fields_options" USING btree ("_order");
  CREATE INDEX "_forms_v_version_fields_options_parent_id_idx" ON "_forms_v_version_fields_options" USING btree ("_parent_id");
  CREATE INDEX "_forms_v_version_fields_conditions_rules_order_idx" ON "_forms_v_version_fields_conditions_rules" USING btree ("_order");
  CREATE INDEX "_forms_v_version_fields_conditions_rules_parent_id_idx" ON "_forms_v_version_fields_conditions_rules" USING btree ("_parent_id");
  CREATE INDEX "_forms_v_version_fields_order_idx" ON "_forms_v_version_fields" USING btree ("_order");
  CREATE INDEX "_forms_v_version_fields_parent_id_idx" ON "_forms_v_version_fields" USING btree ("_parent_id");
  CREATE INDEX "_forms_v_version_crm_handlers_order_idx" ON "_forms_v_version_crm_handlers" USING btree ("order");
  CREATE INDEX "_forms_v_version_crm_handlers_parent_idx" ON "_forms_v_version_crm_handlers" USING btree ("parent_id");
  CREATE INDEX "_forms_v_version_notify_to_order_idx" ON "_forms_v_version_notify_to" USING btree ("_order");
  CREATE INDEX "_forms_v_version_notify_to_parent_id_idx" ON "_forms_v_version_notify_to" USING btree ("_parent_id");
  CREATE INDEX "_forms_v_parent_idx" ON "_forms_v" USING btree ("parent_id");
  CREATE INDEX "_forms_v_version_version_slug_idx" ON "_forms_v" USING btree ("version_slug");
  CREATE INDEX "_forms_v_version_version_updated_at_idx" ON "_forms_v" USING btree ("version_updated_at");
  CREATE INDEX "_forms_v_version_version_created_at_idx" ON "_forms_v" USING btree ("version_created_at");
  CREATE INDEX "_forms_v_version_version__status_idx" ON "_forms_v" USING btree ("version__status");
  CREATE INDEX "_forms_v_created_at_idx" ON "_forms_v" USING btree ("created_at");
  CREATE INDEX "_forms_v_updated_at_idx" ON "_forms_v" USING btree ("updated_at");
  CREATE INDEX "_forms_v_latest_idx" ON "_forms_v" USING btree ("latest");
  CREATE INDEX "leads_consent_categories_order_idx" ON "leads_consent_categories" USING btree ("_order");
  CREATE INDEX "leads_consent_categories_parent_id_idx" ON "leads_consent_categories" USING btree ("_parent_id");
  CREATE INDEX "leads_synced_to_order_idx" ON "leads_synced_to" USING btree ("_order");
  CREATE INDEX "leads_synced_to_parent_id_idx" ON "leads_synced_to" USING btree ("_parent_id");
  CREATE INDEX "leads_form_idx" ON "leads" USING btree ("form_id");
  CREATE INDEX "leads_duplicate_of_idx" ON "leads" USING btree ("duplicate_of_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "blogs_faqs_order_idx" ON "blogs_faqs" USING btree ("_order");
  CREATE INDEX "blogs_faqs_parent_id_idx" ON "blogs_faqs" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_how_to_steps_order_idx" ON "blogs_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "blogs_blocks_how_to_steps_parent_id_idx" ON "blogs_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_how_to_steps_image_idx" ON "blogs_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "blogs_blocks_how_to_order_idx" ON "blogs_blocks_how_to" USING btree ("_order");
  CREATE INDEX "blogs_blocks_how_to_parent_id_idx" ON "blogs_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_how_to_path_idx" ON "blogs_blocks_how_to" USING btree ("_path");
  CREATE INDEX "blogs_blocks_video_object_order_idx" ON "blogs_blocks_video_object" USING btree ("_order");
  CREATE INDEX "blogs_blocks_video_object_parent_id_idx" ON "blogs_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_video_object_path_idx" ON "blogs_blocks_video_object" USING btree ("_path");
  CREATE INDEX "blogs_blocks_video_object_thumbnail_idx" ON "blogs_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "blogs_blocks_faq_page_questions_order_idx" ON "blogs_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "blogs_blocks_faq_page_questions_parent_id_idx" ON "blogs_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_faq_page_order_idx" ON "blogs_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "blogs_blocks_faq_page_parent_id_idx" ON "blogs_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_faq_page_path_idx" ON "blogs_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "blogs_blocks_review_order_idx" ON "blogs_blocks_review" USING btree ("_order");
  CREATE INDEX "blogs_blocks_review_parent_id_idx" ON "blogs_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_review_path_idx" ON "blogs_blocks_review" USING btree ("_path");
  CREATE INDEX "blogs_blocks_software_app_order_idx" ON "blogs_blocks_software_app" USING btree ("_order");
  CREATE INDEX "blogs_blocks_software_app_parent_id_idx" ON "blogs_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_software_app_path_idx" ON "blogs_blocks_software_app" USING btree ("_path");
  CREATE INDEX "blogs_blocks_breadcrumb_list_crumbs_order_idx" ON "blogs_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "blogs_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "blogs_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_breadcrumb_list_order_idx" ON "blogs_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "blogs_blocks_breadcrumb_list_parent_id_idx" ON "blogs_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "blogs_blocks_breadcrumb_list_path_idx" ON "blogs_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "blogs_table_of_contents_order_idx" ON "blogs_table_of_contents" USING btree ("_order");
  CREATE INDEX "blogs_table_of_contents_parent_id_idx" ON "blogs_table_of_contents" USING btree ("_parent_id");
  CREATE INDEX "blogs_seo_speakable_path_order_idx" ON "blogs_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "blogs_seo_speakable_path_parent_id_idx" ON "blogs_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "blogs_slug_idx" ON "blogs" USING btree ("slug");
  CREATE INDEX "blogs_hero_image_idx" ON "blogs" USING btree ("hero_image_id");
  CREATE INDEX "blogs_reviewed_by_idx" ON "blogs" USING btree ("reviewed_by_id");
  CREATE INDEX "blogs_categories_idx" ON "blogs" USING btree ("categories_id");
  CREATE INDEX "blogs_display_published_at_idx" ON "blogs" USING btree ("display_published_at");
  CREATE INDEX "blogs_seo_seo_og_image_idx" ON "blogs" USING btree ("seo_og_image_id");
  CREATE INDEX "blogs_seo_seo_twitter_image_idx" ON "blogs" USING btree ("seo_twitter_image_id");
  CREATE INDEX "blogs_updated_at_idx" ON "blogs" USING btree ("updated_at");
  CREATE INDEX "blogs_created_at_idx" ON "blogs" USING btree ("created_at");
  CREATE INDEX "blogs__status_idx" ON "blogs" USING btree ("_status");
  CREATE INDEX "blogs_rels_order_idx" ON "blogs_rels" USING btree ("order");
  CREATE INDEX "blogs_rels_parent_idx" ON "blogs_rels" USING btree ("parent_id");
  CREATE INDEX "blogs_rels_path_idx" ON "blogs_rels" USING btree ("path");
  CREATE INDEX "blogs_rels_authors_id_idx" ON "blogs_rels" USING btree ("authors_id");
  CREATE INDEX "blogs_rels_blogs_id_idx" ON "blogs_rels" USING btree ("blogs_id");
  CREATE INDEX "_blogs_v_version_faqs_order_idx" ON "_blogs_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_blogs_v_version_faqs_parent_id_idx" ON "_blogs_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_how_to_steps_order_idx" ON "_blogs_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_how_to_steps_parent_id_idx" ON "_blogs_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_how_to_steps_image_idx" ON "_blogs_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_blogs_v_blocks_how_to_order_idx" ON "_blogs_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_how_to_parent_id_idx" ON "_blogs_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_how_to_path_idx" ON "_blogs_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_blogs_v_blocks_video_object_order_idx" ON "_blogs_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_video_object_parent_id_idx" ON "_blogs_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_video_object_path_idx" ON "_blogs_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_blogs_v_blocks_video_object_thumbnail_idx" ON "_blogs_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_blogs_v_blocks_faq_page_questions_order_idx" ON "_blogs_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_faq_page_questions_parent_id_idx" ON "_blogs_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_faq_page_order_idx" ON "_blogs_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_faq_page_parent_id_idx" ON "_blogs_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_faq_page_path_idx" ON "_blogs_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_blogs_v_blocks_review_order_idx" ON "_blogs_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_review_parent_id_idx" ON "_blogs_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_review_path_idx" ON "_blogs_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_blogs_v_blocks_software_app_order_idx" ON "_blogs_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_software_app_parent_id_idx" ON "_blogs_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_software_app_path_idx" ON "_blogs_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_blogs_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_blogs_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_blogs_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_breadcrumb_list_order_idx" ON "_blogs_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_blogs_v_blocks_breadcrumb_list_parent_id_idx" ON "_blogs_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_blocks_breadcrumb_list_path_idx" ON "_blogs_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_blogs_v_version_table_of_contents_order_idx" ON "_blogs_v_version_table_of_contents" USING btree ("_order");
  CREATE INDEX "_blogs_v_version_table_of_contents_parent_id_idx" ON "_blogs_v_version_table_of_contents" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_version_seo_speakable_path_order_idx" ON "_blogs_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_blogs_v_version_seo_speakable_path_parent_id_idx" ON "_blogs_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_blogs_v_parent_idx" ON "_blogs_v" USING btree ("parent_id");
  CREATE INDEX "_blogs_v_version_version_slug_idx" ON "_blogs_v" USING btree ("version_slug");
  CREATE INDEX "_blogs_v_version_version_hero_image_idx" ON "_blogs_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_blogs_v_version_version_reviewed_by_idx" ON "_blogs_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_blogs_v_version_version_categories_idx" ON "_blogs_v" USING btree ("version_categories_id");
  CREATE INDEX "_blogs_v_version_version_display_published_at_idx" ON "_blogs_v" USING btree ("version_display_published_at");
  CREATE INDEX "_blogs_v_version_seo_version_seo_og_image_idx" ON "_blogs_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_blogs_v_version_seo_version_seo_twitter_image_idx" ON "_blogs_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_blogs_v_version_version_updated_at_idx" ON "_blogs_v" USING btree ("version_updated_at");
  CREATE INDEX "_blogs_v_version_version_created_at_idx" ON "_blogs_v" USING btree ("version_created_at");
  CREATE INDEX "_blogs_v_version_version__status_idx" ON "_blogs_v" USING btree ("version__status");
  CREATE INDEX "_blogs_v_created_at_idx" ON "_blogs_v" USING btree ("created_at");
  CREATE INDEX "_blogs_v_updated_at_idx" ON "_blogs_v" USING btree ("updated_at");
  CREATE INDEX "_blogs_v_latest_idx" ON "_blogs_v" USING btree ("latest");
  CREATE INDEX "_blogs_v_rels_order_idx" ON "_blogs_v_rels" USING btree ("order");
  CREATE INDEX "_blogs_v_rels_parent_idx" ON "_blogs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_blogs_v_rels_path_idx" ON "_blogs_v_rels" USING btree ("path");
  CREATE INDEX "_blogs_v_rels_authors_id_idx" ON "_blogs_v_rels" USING btree ("authors_id");
  CREATE INDEX "_blogs_v_rels_blogs_id_idx" ON "_blogs_v_rels" USING btree ("blogs_id");
  CREATE INDEX "news_blocks_how_to_steps_order_idx" ON "news_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "news_blocks_how_to_steps_parent_id_idx" ON "news_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_how_to_steps_image_idx" ON "news_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "news_blocks_how_to_order_idx" ON "news_blocks_how_to" USING btree ("_order");
  CREATE INDEX "news_blocks_how_to_parent_id_idx" ON "news_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_how_to_path_idx" ON "news_blocks_how_to" USING btree ("_path");
  CREATE INDEX "news_blocks_video_object_order_idx" ON "news_blocks_video_object" USING btree ("_order");
  CREATE INDEX "news_blocks_video_object_parent_id_idx" ON "news_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_video_object_path_idx" ON "news_blocks_video_object" USING btree ("_path");
  CREATE INDEX "news_blocks_video_object_thumbnail_idx" ON "news_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "news_blocks_faq_page_questions_order_idx" ON "news_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "news_blocks_faq_page_questions_parent_id_idx" ON "news_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_faq_page_order_idx" ON "news_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "news_blocks_faq_page_parent_id_idx" ON "news_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_faq_page_path_idx" ON "news_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "news_blocks_review_order_idx" ON "news_blocks_review" USING btree ("_order");
  CREATE INDEX "news_blocks_review_parent_id_idx" ON "news_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_review_path_idx" ON "news_blocks_review" USING btree ("_path");
  CREATE INDEX "news_blocks_software_app_order_idx" ON "news_blocks_software_app" USING btree ("_order");
  CREATE INDEX "news_blocks_software_app_parent_id_idx" ON "news_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_software_app_path_idx" ON "news_blocks_software_app" USING btree ("_path");
  CREATE INDEX "news_blocks_breadcrumb_list_crumbs_order_idx" ON "news_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "news_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "news_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_breadcrumb_list_order_idx" ON "news_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "news_blocks_breadcrumb_list_parent_id_idx" ON "news_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_breadcrumb_list_path_idx" ON "news_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "news_seo_speakable_path_order_idx" ON "news_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "news_seo_speakable_path_parent_id_idx" ON "news_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");
  CREATE INDEX "news_hero_image_idx" ON "news" USING btree ("hero_image_id");
  CREATE INDEX "news_publisher_logo_idx" ON "news" USING btree ("publisher_logo_id");
  CREATE INDEX "news_seo_seo_og_image_idx" ON "news" USING btree ("seo_og_image_id");
  CREATE INDEX "news_seo_seo_twitter_image_idx" ON "news" USING btree ("seo_twitter_image_id");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "news" USING btree ("_status");
  CREATE INDEX "news_rels_order_idx" ON "news_rels" USING btree ("order");
  CREATE INDEX "news_rels_parent_idx" ON "news_rels" USING btree ("parent_id");
  CREATE INDEX "news_rels_path_idx" ON "news_rels" USING btree ("path");
  CREATE INDEX "news_rels_authors_id_idx" ON "news_rels" USING btree ("authors_id");
  CREATE INDEX "news_rels_news_categories_id_idx" ON "news_rels" USING btree ("news_categories_id");
  CREATE INDEX "news_rels_news_id_idx" ON "news_rels" USING btree ("news_id");
  CREATE INDEX "_news_v_blocks_how_to_steps_order_idx" ON "_news_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_how_to_steps_parent_id_idx" ON "_news_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_how_to_steps_image_idx" ON "_news_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_news_v_blocks_how_to_order_idx" ON "_news_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_how_to_parent_id_idx" ON "_news_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_how_to_path_idx" ON "_news_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_news_v_blocks_video_object_order_idx" ON "_news_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_video_object_parent_id_idx" ON "_news_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_video_object_path_idx" ON "_news_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_news_v_blocks_video_object_thumbnail_idx" ON "_news_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_news_v_blocks_faq_page_questions_order_idx" ON "_news_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_faq_page_questions_parent_id_idx" ON "_news_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_faq_page_order_idx" ON "_news_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_faq_page_parent_id_idx" ON "_news_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_faq_page_path_idx" ON "_news_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_news_v_blocks_review_order_idx" ON "_news_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_review_parent_id_idx" ON "_news_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_review_path_idx" ON "_news_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_news_v_blocks_software_app_order_idx" ON "_news_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_software_app_parent_id_idx" ON "_news_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_software_app_path_idx" ON "_news_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_news_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_news_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_news_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_breadcrumb_list_order_idx" ON "_news_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_breadcrumb_list_parent_id_idx" ON "_news_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_breadcrumb_list_path_idx" ON "_news_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_news_v_version_seo_speakable_path_order_idx" ON "_news_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_news_v_version_seo_speakable_path_parent_id_idx" ON "_news_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v" USING btree ("version_slug");
  CREATE INDEX "_news_v_version_version_hero_image_idx" ON "_news_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_news_v_version_version_publisher_logo_idx" ON "_news_v" USING btree ("version_publisher_logo_id");
  CREATE INDEX "_news_v_version_seo_version_seo_og_image_idx" ON "_news_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_news_v_version_seo_version_seo_twitter_image_idx" ON "_news_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_latest_idx" ON "_news_v" USING btree ("latest");
  CREATE INDEX "_news_v_rels_order_idx" ON "_news_v_rels" USING btree ("order");
  CREATE INDEX "_news_v_rels_parent_idx" ON "_news_v_rels" USING btree ("parent_id");
  CREATE INDEX "_news_v_rels_path_idx" ON "_news_v_rels" USING btree ("path");
  CREATE INDEX "_news_v_rels_authors_id_idx" ON "_news_v_rels" USING btree ("authors_id");
  CREATE INDEX "_news_v_rels_news_categories_id_idx" ON "_news_v_rels" USING btree ("news_categories_id");
  CREATE INDEX "_news_v_rels_news_id_idx" ON "_news_v_rels" USING btree ("news_id");
  CREATE INDEX "guides_faqs_order_idx" ON "guides_faqs" USING btree ("_order");
  CREATE INDEX "guides_faqs_parent_id_idx" ON "guides_faqs" USING btree ("_parent_id");
  CREATE INDEX "guides_article_sections_order_idx" ON "guides_article_sections" USING btree ("_order");
  CREATE INDEX "guides_article_sections_parent_id_idx" ON "guides_article_sections" USING btree ("_parent_id");
  CREATE INDEX "guides_citations_order_idx" ON "guides_citations" USING btree ("_order");
  CREATE INDEX "guides_citations_parent_id_idx" ON "guides_citations" USING btree ("_parent_id");
  CREATE INDEX "guides_keywords_order_idx" ON "guides_keywords" USING btree ("_order");
  CREATE INDEX "guides_keywords_parent_id_idx" ON "guides_keywords" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_how_to_steps_order_idx" ON "guides_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "guides_blocks_how_to_steps_parent_id_idx" ON "guides_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_how_to_steps_image_idx" ON "guides_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "guides_blocks_how_to_order_idx" ON "guides_blocks_how_to" USING btree ("_order");
  CREATE INDEX "guides_blocks_how_to_parent_id_idx" ON "guides_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_how_to_path_idx" ON "guides_blocks_how_to" USING btree ("_path");
  CREATE INDEX "guides_blocks_video_object_order_idx" ON "guides_blocks_video_object" USING btree ("_order");
  CREATE INDEX "guides_blocks_video_object_parent_id_idx" ON "guides_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_video_object_path_idx" ON "guides_blocks_video_object" USING btree ("_path");
  CREATE INDEX "guides_blocks_video_object_thumbnail_idx" ON "guides_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "guides_blocks_faq_page_questions_order_idx" ON "guides_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "guides_blocks_faq_page_questions_parent_id_idx" ON "guides_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_faq_page_order_idx" ON "guides_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "guides_blocks_faq_page_parent_id_idx" ON "guides_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_faq_page_path_idx" ON "guides_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "guides_blocks_review_order_idx" ON "guides_blocks_review" USING btree ("_order");
  CREATE INDEX "guides_blocks_review_parent_id_idx" ON "guides_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_review_path_idx" ON "guides_blocks_review" USING btree ("_path");
  CREATE INDEX "guides_blocks_software_app_order_idx" ON "guides_blocks_software_app" USING btree ("_order");
  CREATE INDEX "guides_blocks_software_app_parent_id_idx" ON "guides_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_software_app_path_idx" ON "guides_blocks_software_app" USING btree ("_path");
  CREATE INDEX "guides_blocks_breadcrumb_list_crumbs_order_idx" ON "guides_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "guides_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "guides_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_breadcrumb_list_order_idx" ON "guides_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "guides_blocks_breadcrumb_list_parent_id_idx" ON "guides_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_breadcrumb_list_path_idx" ON "guides_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "guides_table_of_contents_order_idx" ON "guides_table_of_contents" USING btree ("_order");
  CREATE INDEX "guides_table_of_contents_parent_id_idx" ON "guides_table_of_contents" USING btree ("_parent_id");
  CREATE INDEX "guides_seo_speakable_path_order_idx" ON "guides_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "guides_seo_speakable_path_parent_id_idx" ON "guides_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guides_slug_idx" ON "guides" USING btree ("slug");
  CREATE INDEX "guides_hero_image_idx" ON "guides" USING btree ("hero_image_id");
  CREATE INDEX "guides_reviewed_by_idx" ON "guides" USING btree ("reviewed_by_id");
  CREATE INDEX "guides_display_published_at_idx" ON "guides" USING btree ("display_published_at");
  CREATE INDEX "guides_seo_seo_og_image_idx" ON "guides" USING btree ("seo_og_image_id");
  CREATE INDEX "guides_seo_seo_twitter_image_idx" ON "guides" USING btree ("seo_twitter_image_id");
  CREATE INDEX "guides_updated_at_idx" ON "guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "guides" USING btree ("created_at");
  CREATE INDEX "guides__status_idx" ON "guides" USING btree ("_status");
  CREATE INDEX "guides_rels_order_idx" ON "guides_rels" USING btree ("order");
  CREATE INDEX "guides_rels_parent_idx" ON "guides_rels" USING btree ("parent_id");
  CREATE INDEX "guides_rels_path_idx" ON "guides_rels" USING btree ("path");
  CREATE INDEX "guides_rels_authors_id_idx" ON "guides_rels" USING btree ("authors_id");
  CREATE INDEX "guides_rels_guides_id_idx" ON "guides_rels" USING btree ("guides_id");
  CREATE INDEX "_guides_v_version_faqs_order_idx" ON "_guides_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_guides_v_version_faqs_parent_id_idx" ON "_guides_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_version_article_sections_order_idx" ON "_guides_v_version_article_sections" USING btree ("_order");
  CREATE INDEX "_guides_v_version_article_sections_parent_id_idx" ON "_guides_v_version_article_sections" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_version_citations_order_idx" ON "_guides_v_version_citations" USING btree ("_order");
  CREATE INDEX "_guides_v_version_citations_parent_id_idx" ON "_guides_v_version_citations" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_version_keywords_order_idx" ON "_guides_v_version_keywords" USING btree ("_order");
  CREATE INDEX "_guides_v_version_keywords_parent_id_idx" ON "_guides_v_version_keywords" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_how_to_steps_order_idx" ON "_guides_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_how_to_steps_parent_id_idx" ON "_guides_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_how_to_steps_image_idx" ON "_guides_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_guides_v_blocks_how_to_order_idx" ON "_guides_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_how_to_parent_id_idx" ON "_guides_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_how_to_path_idx" ON "_guides_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_video_object_order_idx" ON "_guides_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_video_object_parent_id_idx" ON "_guides_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_video_object_path_idx" ON "_guides_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_video_object_thumbnail_idx" ON "_guides_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_guides_v_blocks_faq_page_questions_order_idx" ON "_guides_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_faq_page_questions_parent_id_idx" ON "_guides_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_faq_page_order_idx" ON "_guides_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_faq_page_parent_id_idx" ON "_guides_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_faq_page_path_idx" ON "_guides_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_review_order_idx" ON "_guides_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_review_parent_id_idx" ON "_guides_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_review_path_idx" ON "_guides_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_software_app_order_idx" ON "_guides_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_software_app_parent_id_idx" ON "_guides_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_software_app_path_idx" ON "_guides_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_guides_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_guides_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_breadcrumb_list_order_idx" ON "_guides_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_breadcrumb_list_parent_id_idx" ON "_guides_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_breadcrumb_list_path_idx" ON "_guides_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_guides_v_version_table_of_contents_order_idx" ON "_guides_v_version_table_of_contents" USING btree ("_order");
  CREATE INDEX "_guides_v_version_table_of_contents_parent_id_idx" ON "_guides_v_version_table_of_contents" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_version_seo_speakable_path_order_idx" ON "_guides_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_guides_v_version_seo_speakable_path_parent_id_idx" ON "_guides_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_parent_idx" ON "_guides_v" USING btree ("parent_id");
  CREATE INDEX "_guides_v_version_version_slug_idx" ON "_guides_v" USING btree ("version_slug");
  CREATE INDEX "_guides_v_version_version_hero_image_idx" ON "_guides_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_guides_v_version_version_reviewed_by_idx" ON "_guides_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_guides_v_version_version_display_published_at_idx" ON "_guides_v" USING btree ("version_display_published_at");
  CREATE INDEX "_guides_v_version_seo_version_seo_og_image_idx" ON "_guides_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_guides_v_version_seo_version_seo_twitter_image_idx" ON "_guides_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_guides_v_version_version_updated_at_idx" ON "_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_guides_v_version_version_created_at_idx" ON "_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_guides_v_version_version__status_idx" ON "_guides_v" USING btree ("version__status");
  CREATE INDEX "_guides_v_created_at_idx" ON "_guides_v" USING btree ("created_at");
  CREATE INDEX "_guides_v_updated_at_idx" ON "_guides_v" USING btree ("updated_at");
  CREATE INDEX "_guides_v_latest_idx" ON "_guides_v" USING btree ("latest");
  CREATE INDEX "_guides_v_rels_order_idx" ON "_guides_v_rels" USING btree ("order");
  CREATE INDEX "_guides_v_rels_parent_idx" ON "_guides_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guides_v_rels_path_idx" ON "_guides_v_rels" USING btree ("path");
  CREATE INDEX "_guides_v_rels_authors_id_idx" ON "_guides_v_rels" USING btree ("authors_id");
  CREATE INDEX "_guides_v_rels_guides_id_idx" ON "_guides_v_rels" USING btree ("guides_id");
  CREATE INDEX "resources_blocks_how_to_steps_order_idx" ON "resources_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "resources_blocks_how_to_steps_parent_id_idx" ON "resources_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_how_to_steps_image_idx" ON "resources_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "resources_blocks_how_to_order_idx" ON "resources_blocks_how_to" USING btree ("_order");
  CREATE INDEX "resources_blocks_how_to_parent_id_idx" ON "resources_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_how_to_path_idx" ON "resources_blocks_how_to" USING btree ("_path");
  CREATE INDEX "resources_blocks_video_object_order_idx" ON "resources_blocks_video_object" USING btree ("_order");
  CREATE INDEX "resources_blocks_video_object_parent_id_idx" ON "resources_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_video_object_path_idx" ON "resources_blocks_video_object" USING btree ("_path");
  CREATE INDEX "resources_blocks_video_object_thumbnail_idx" ON "resources_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "resources_blocks_faq_page_questions_order_idx" ON "resources_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "resources_blocks_faq_page_questions_parent_id_idx" ON "resources_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_faq_page_order_idx" ON "resources_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "resources_blocks_faq_page_parent_id_idx" ON "resources_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_faq_page_path_idx" ON "resources_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "resources_blocks_review_order_idx" ON "resources_blocks_review" USING btree ("_order");
  CREATE INDEX "resources_blocks_review_parent_id_idx" ON "resources_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_review_path_idx" ON "resources_blocks_review" USING btree ("_path");
  CREATE INDEX "resources_blocks_software_app_order_idx" ON "resources_blocks_software_app" USING btree ("_order");
  CREATE INDEX "resources_blocks_software_app_parent_id_idx" ON "resources_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_software_app_path_idx" ON "resources_blocks_software_app" USING btree ("_path");
  CREATE INDEX "resources_blocks_breadcrumb_list_crumbs_order_idx" ON "resources_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "resources_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "resources_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_breadcrumb_list_order_idx" ON "resources_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "resources_blocks_breadcrumb_list_parent_id_idx" ON "resources_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_breadcrumb_list_path_idx" ON "resources_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "resources_seo_speakable_path_order_idx" ON "resources_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "resources_seo_speakable_path_parent_id_idx" ON "resources_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "resources_slug_idx" ON "resources" USING btree ("slug");
  CREATE INDEX "resources_asset_idx" ON "resources" USING btree ("asset_id");
  CREATE INDEX "resources_gate_form_idx" ON "resources" USING btree ("gate_form_id");
  CREATE INDEX "resources_display_published_at_idx" ON "resources" USING btree ("display_published_at");
  CREATE INDEX "resources_seo_seo_og_image_idx" ON "resources" USING btree ("seo_og_image_id");
  CREATE INDEX "resources_seo_seo_twitter_image_idx" ON "resources" USING btree ("seo_twitter_image_id");
  CREATE INDEX "resources_updated_at_idx" ON "resources" USING btree ("updated_at");
  CREATE INDEX "resources_created_at_idx" ON "resources" USING btree ("created_at");
  CREATE INDEX "resources__status_idx" ON "resources" USING btree ("_status");
  CREATE INDEX "_resources_v_blocks_how_to_steps_order_idx" ON "_resources_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_how_to_steps_parent_id_idx" ON "_resources_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_how_to_steps_image_idx" ON "_resources_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_resources_v_blocks_how_to_order_idx" ON "_resources_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_how_to_parent_id_idx" ON "_resources_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_how_to_path_idx" ON "_resources_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_resources_v_blocks_video_object_order_idx" ON "_resources_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_video_object_parent_id_idx" ON "_resources_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_video_object_path_idx" ON "_resources_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_resources_v_blocks_video_object_thumbnail_idx" ON "_resources_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_resources_v_blocks_faq_page_questions_order_idx" ON "_resources_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_faq_page_questions_parent_id_idx" ON "_resources_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_faq_page_order_idx" ON "_resources_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_faq_page_parent_id_idx" ON "_resources_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_faq_page_path_idx" ON "_resources_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_resources_v_blocks_review_order_idx" ON "_resources_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_review_parent_id_idx" ON "_resources_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_review_path_idx" ON "_resources_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_resources_v_blocks_software_app_order_idx" ON "_resources_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_software_app_parent_id_idx" ON "_resources_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_software_app_path_idx" ON "_resources_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_resources_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_resources_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_resources_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_breadcrumb_list_order_idx" ON "_resources_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_resources_v_blocks_breadcrumb_list_parent_id_idx" ON "_resources_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_blocks_breadcrumb_list_path_idx" ON "_resources_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_resources_v_version_seo_speakable_path_order_idx" ON "_resources_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_resources_v_version_seo_speakable_path_parent_id_idx" ON "_resources_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_resources_v_parent_idx" ON "_resources_v" USING btree ("parent_id");
  CREATE INDEX "_resources_v_version_version_slug_idx" ON "_resources_v" USING btree ("version_slug");
  CREATE INDEX "_resources_v_version_version_asset_idx" ON "_resources_v" USING btree ("version_asset_id");
  CREATE INDEX "_resources_v_version_version_gate_form_idx" ON "_resources_v" USING btree ("version_gate_form_id");
  CREATE INDEX "_resources_v_version_version_display_published_at_idx" ON "_resources_v" USING btree ("version_display_published_at");
  CREATE INDEX "_resources_v_version_seo_version_seo_og_image_idx" ON "_resources_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_resources_v_version_seo_version_seo_twitter_image_idx" ON "_resources_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_resources_v_version_version_updated_at_idx" ON "_resources_v" USING btree ("version_updated_at");
  CREATE INDEX "_resources_v_version_version_created_at_idx" ON "_resources_v" USING btree ("version_created_at");
  CREATE INDEX "_resources_v_version_version__status_idx" ON "_resources_v" USING btree ("version__status");
  CREATE INDEX "_resources_v_created_at_idx" ON "_resources_v" USING btree ("created_at");
  CREATE INDEX "_resources_v_updated_at_idx" ON "_resources_v" USING btree ("updated_at");
  CREATE INDEX "_resources_v_latest_idx" ON "_resources_v" USING btree ("latest");
  CREATE INDEX "knowledge_base_faqs_order_idx" ON "knowledge_base_faqs" USING btree ("_order");
  CREATE INDEX "knowledge_base_faqs_parent_id_idx" ON "knowledge_base_faqs" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_how_to_steps_order_idx" ON "knowledge_base_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_how_to_steps_parent_id_idx" ON "knowledge_base_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_how_to_steps_image_idx" ON "knowledge_base_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "knowledge_base_blocks_how_to_order_idx" ON "knowledge_base_blocks_how_to" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_how_to_parent_id_idx" ON "knowledge_base_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_how_to_path_idx" ON "knowledge_base_blocks_how_to" USING btree ("_path");
  CREATE INDEX "knowledge_base_blocks_video_object_order_idx" ON "knowledge_base_blocks_video_object" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_video_object_parent_id_idx" ON "knowledge_base_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_video_object_path_idx" ON "knowledge_base_blocks_video_object" USING btree ("_path");
  CREATE INDEX "knowledge_base_blocks_video_object_thumbnail_idx" ON "knowledge_base_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "knowledge_base_blocks_faq_page_questions_order_idx" ON "knowledge_base_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_faq_page_questions_parent_id_idx" ON "knowledge_base_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_faq_page_order_idx" ON "knowledge_base_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_faq_page_parent_id_idx" ON "knowledge_base_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_faq_page_path_idx" ON "knowledge_base_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "knowledge_base_blocks_review_order_idx" ON "knowledge_base_blocks_review" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_review_parent_id_idx" ON "knowledge_base_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_review_path_idx" ON "knowledge_base_blocks_review" USING btree ("_path");
  CREATE INDEX "knowledge_base_blocks_software_app_order_idx" ON "knowledge_base_blocks_software_app" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_software_app_parent_id_idx" ON "knowledge_base_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_software_app_path_idx" ON "knowledge_base_blocks_software_app" USING btree ("_path");
  CREATE INDEX "knowledge_base_blocks_breadcrumb_list_crumbs_order_idx" ON "knowledge_base_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "knowledge_base_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_breadcrumb_list_order_idx" ON "knowledge_base_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "knowledge_base_blocks_breadcrumb_list_parent_id_idx" ON "knowledge_base_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_blocks_breadcrumb_list_path_idx" ON "knowledge_base_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "knowledge_base_table_of_contents_order_idx" ON "knowledge_base_table_of_contents" USING btree ("_order");
  CREATE INDEX "knowledge_base_table_of_contents_parent_id_idx" ON "knowledge_base_table_of_contents" USING btree ("_parent_id");
  CREATE INDEX "knowledge_base_seo_speakable_path_order_idx" ON "knowledge_base_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "knowledge_base_seo_speakable_path_parent_id_idx" ON "knowledge_base_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "knowledge_base_slug_idx" ON "knowledge_base" USING btree ("slug");
  CREATE INDEX "knowledge_base_hero_image_idx" ON "knowledge_base" USING btree ("hero_image_id");
  CREATE INDEX "knowledge_base_category_idx" ON "knowledge_base" USING btree ("category_id");
  CREATE INDEX "knowledge_base_reviewed_by_idx" ON "knowledge_base" USING btree ("reviewed_by_id");
  CREATE INDEX "knowledge_base_display_published_at_idx" ON "knowledge_base" USING btree ("display_published_at");
  CREATE INDEX "knowledge_base_seo_seo_og_image_idx" ON "knowledge_base" USING btree ("seo_og_image_id");
  CREATE INDEX "knowledge_base_seo_seo_twitter_image_idx" ON "knowledge_base" USING btree ("seo_twitter_image_id");
  CREATE INDEX "knowledge_base_updated_at_idx" ON "knowledge_base" USING btree ("updated_at");
  CREATE INDEX "knowledge_base_created_at_idx" ON "knowledge_base" USING btree ("created_at");
  CREATE INDEX "knowledge_base__status_idx" ON "knowledge_base" USING btree ("_status");
  CREATE INDEX "knowledge_base_rels_order_idx" ON "knowledge_base_rels" USING btree ("order");
  CREATE INDEX "knowledge_base_rels_parent_idx" ON "knowledge_base_rels" USING btree ("parent_id");
  CREATE INDEX "knowledge_base_rels_path_idx" ON "knowledge_base_rels" USING btree ("path");
  CREATE INDEX "knowledge_base_rels_knowledge_base_id_idx" ON "knowledge_base_rels" USING btree ("knowledge_base_id");
  CREATE INDEX "_knowledge_base_v_version_faqs_order_idx" ON "_knowledge_base_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_version_faqs_parent_id_idx" ON "_knowledge_base_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_how_to_steps_order_idx" ON "_knowledge_base_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_how_to_steps_parent_id_idx" ON "_knowledge_base_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_how_to_steps_image_idx" ON "_knowledge_base_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_knowledge_base_v_blocks_how_to_order_idx" ON "_knowledge_base_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_how_to_parent_id_idx" ON "_knowledge_base_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_how_to_path_idx" ON "_knowledge_base_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_knowledge_base_v_blocks_video_object_order_idx" ON "_knowledge_base_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_video_object_parent_id_idx" ON "_knowledge_base_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_video_object_path_idx" ON "_knowledge_base_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_knowledge_base_v_blocks_video_object_thumbnail_idx" ON "_knowledge_base_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_knowledge_base_v_blocks_faq_page_questions_order_idx" ON "_knowledge_base_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_faq_page_questions_parent_id_idx" ON "_knowledge_base_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_faq_page_order_idx" ON "_knowledge_base_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_faq_page_parent_id_idx" ON "_knowledge_base_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_faq_page_path_idx" ON "_knowledge_base_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_knowledge_base_v_blocks_review_order_idx" ON "_knowledge_base_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_review_parent_id_idx" ON "_knowledge_base_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_review_path_idx" ON "_knowledge_base_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_knowledge_base_v_blocks_software_app_order_idx" ON "_knowledge_base_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_software_app_parent_id_idx" ON "_knowledge_base_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_software_app_path_idx" ON "_knowledge_base_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_knowledge_base_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_knowledge_base_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_knowledge_base_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_breadcrumb_list_order_idx" ON "_knowledge_base_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_blocks_breadcrumb_list_parent_id_idx" ON "_knowledge_base_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_blocks_breadcrumb_list_path_idx" ON "_knowledge_base_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_knowledge_base_v_version_table_of_contents_order_idx" ON "_knowledge_base_v_version_table_of_contents" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_version_table_of_contents_parent_id_idx" ON "_knowledge_base_v_version_table_of_contents" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_version_seo_speakable_path_order_idx" ON "_knowledge_base_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_knowledge_base_v_version_seo_speakable_path_parent_id_idx" ON "_knowledge_base_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_base_v_parent_idx" ON "_knowledge_base_v" USING btree ("parent_id");
  CREATE INDEX "_knowledge_base_v_version_version_slug_idx" ON "_knowledge_base_v" USING btree ("version_slug");
  CREATE INDEX "_knowledge_base_v_version_version_hero_image_idx" ON "_knowledge_base_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_knowledge_base_v_version_version_category_idx" ON "_knowledge_base_v" USING btree ("version_category_id");
  CREATE INDEX "_knowledge_base_v_version_version_reviewed_by_idx" ON "_knowledge_base_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_knowledge_base_v_version_version_display_published_at_idx" ON "_knowledge_base_v" USING btree ("version_display_published_at");
  CREATE INDEX "_knowledge_base_v_version_seo_version_seo_og_image_idx" ON "_knowledge_base_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_knowledge_base_v_version_seo_version_seo_twitter_image_idx" ON "_knowledge_base_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_knowledge_base_v_version_version_updated_at_idx" ON "_knowledge_base_v" USING btree ("version_updated_at");
  CREATE INDEX "_knowledge_base_v_version_version_created_at_idx" ON "_knowledge_base_v" USING btree ("version_created_at");
  CREATE INDEX "_knowledge_base_v_version_version__status_idx" ON "_knowledge_base_v" USING btree ("version__status");
  CREATE INDEX "_knowledge_base_v_created_at_idx" ON "_knowledge_base_v" USING btree ("created_at");
  CREATE INDEX "_knowledge_base_v_updated_at_idx" ON "_knowledge_base_v" USING btree ("updated_at");
  CREATE INDEX "_knowledge_base_v_latest_idx" ON "_knowledge_base_v" USING btree ("latest");
  CREATE INDEX "_knowledge_base_v_rels_order_idx" ON "_knowledge_base_v_rels" USING btree ("order");
  CREATE INDEX "_knowledge_base_v_rels_parent_idx" ON "_knowledge_base_v_rels" USING btree ("parent_id");
  CREATE INDEX "_knowledge_base_v_rels_path_idx" ON "_knowledge_base_v_rels" USING btree ("path");
  CREATE INDEX "_knowledge_base_v_rels_knowledge_base_id_idx" ON "_knowledge_base_v_rels" USING btree ("knowledge_base_id");
  CREATE INDEX "events_gallery_order_idx" ON "events_gallery" USING btree ("_order");
  CREATE INDEX "events_gallery_parent_id_idx" ON "events_gallery" USING btree ("_parent_id");
  CREATE INDEX "events_gallery_image_idx" ON "events_gallery" USING btree ("image_id");
  CREATE INDEX "events_blocks_how_to_steps_order_idx" ON "events_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "events_blocks_how_to_steps_parent_id_idx" ON "events_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_how_to_steps_image_idx" ON "events_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "events_blocks_how_to_order_idx" ON "events_blocks_how_to" USING btree ("_order");
  CREATE INDEX "events_blocks_how_to_parent_id_idx" ON "events_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_how_to_path_idx" ON "events_blocks_how_to" USING btree ("_path");
  CREATE INDEX "events_blocks_video_object_order_idx" ON "events_blocks_video_object" USING btree ("_order");
  CREATE INDEX "events_blocks_video_object_parent_id_idx" ON "events_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_video_object_path_idx" ON "events_blocks_video_object" USING btree ("_path");
  CREATE INDEX "events_blocks_video_object_thumbnail_idx" ON "events_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "events_blocks_faq_page_questions_order_idx" ON "events_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "events_blocks_faq_page_questions_parent_id_idx" ON "events_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_faq_page_order_idx" ON "events_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "events_blocks_faq_page_parent_id_idx" ON "events_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_faq_page_path_idx" ON "events_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "events_blocks_review_order_idx" ON "events_blocks_review" USING btree ("_order");
  CREATE INDEX "events_blocks_review_parent_id_idx" ON "events_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_review_path_idx" ON "events_blocks_review" USING btree ("_path");
  CREATE INDEX "events_blocks_software_app_order_idx" ON "events_blocks_software_app" USING btree ("_order");
  CREATE INDEX "events_blocks_software_app_parent_id_idx" ON "events_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_software_app_path_idx" ON "events_blocks_software_app" USING btree ("_path");
  CREATE INDEX "events_blocks_breadcrumb_list_crumbs_order_idx" ON "events_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "events_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "events_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_breadcrumb_list_order_idx" ON "events_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "events_blocks_breadcrumb_list_parent_id_idx" ON "events_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_breadcrumb_list_path_idx" ON "events_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "events_seo_speakable_path_order_idx" ON "events_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "events_seo_speakable_path_parent_id_idx" ON "events_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_hero_image_idx" ON "events" USING btree ("hero_image_id");
  CREATE INDEX "events_registration_form_idx" ON "events" USING btree ("registration_form_id");
  CREATE INDEX "events_agenda_pdf_idx" ON "events" USING btree ("agenda_pdf_id");
  CREATE INDEX "events_seo_seo_og_image_idx" ON "events" USING btree ("seo_og_image_id");
  CREATE INDEX "events_seo_seo_twitter_image_idx" ON "events" USING btree ("seo_twitter_image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
  CREATE INDEX "events_rels_authors_id_idx" ON "events_rels" USING btree ("authors_id");
  CREATE INDEX "_events_v_version_gallery_order_idx" ON "_events_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_events_v_version_gallery_parent_id_idx" ON "_events_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_gallery_image_idx" ON "_events_v_version_gallery" USING btree ("image_id");
  CREATE INDEX "_events_v_blocks_how_to_steps_order_idx" ON "_events_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_how_to_steps_parent_id_idx" ON "_events_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_how_to_steps_image_idx" ON "_events_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_events_v_blocks_how_to_order_idx" ON "_events_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_how_to_parent_id_idx" ON "_events_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_how_to_path_idx" ON "_events_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_events_v_blocks_video_object_order_idx" ON "_events_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_video_object_parent_id_idx" ON "_events_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_video_object_path_idx" ON "_events_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_events_v_blocks_video_object_thumbnail_idx" ON "_events_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_events_v_blocks_faq_page_questions_order_idx" ON "_events_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_faq_page_questions_parent_id_idx" ON "_events_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_faq_page_order_idx" ON "_events_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_faq_page_parent_id_idx" ON "_events_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_faq_page_path_idx" ON "_events_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_events_v_blocks_review_order_idx" ON "_events_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_review_parent_id_idx" ON "_events_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_review_path_idx" ON "_events_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_events_v_blocks_software_app_order_idx" ON "_events_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_software_app_parent_id_idx" ON "_events_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_software_app_path_idx" ON "_events_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_events_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_events_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_events_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_breadcrumb_list_order_idx" ON "_events_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_events_v_blocks_breadcrumb_list_parent_id_idx" ON "_events_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_events_v_blocks_breadcrumb_list_path_idx" ON "_events_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_events_v_version_seo_speakable_path_order_idx" ON "_events_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_events_v_version_seo_speakable_path_parent_id_idx" ON "_events_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_hero_image_idx" ON "_events_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_events_v_version_version_registration_form_idx" ON "_events_v" USING btree ("version_registration_form_id");
  CREATE INDEX "_events_v_version_version_agenda_pdf_idx" ON "_events_v" USING btree ("version_agenda_pdf_id");
  CREATE INDEX "_events_v_version_seo_version_seo_og_image_idx" ON "_events_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_events_v_version_seo_version_seo_twitter_image_idx" ON "_events_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_rels_order_idx" ON "_events_v_rels" USING btree ("order");
  CREATE INDEX "_events_v_rels_parent_idx" ON "_events_v_rels" USING btree ("parent_id");
  CREATE INDEX "_events_v_rels_path_idx" ON "_events_v_rels" USING btree ("path");
  CREATE INDEX "_events_v_rels_authors_id_idx" ON "_events_v_rels" USING btree ("authors_id");
  CREATE INDEX "webinars_blocks_how_to_steps_order_idx" ON "webinars_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "webinars_blocks_how_to_steps_parent_id_idx" ON "webinars_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_how_to_steps_image_idx" ON "webinars_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "webinars_blocks_how_to_order_idx" ON "webinars_blocks_how_to" USING btree ("_order");
  CREATE INDEX "webinars_blocks_how_to_parent_id_idx" ON "webinars_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_how_to_path_idx" ON "webinars_blocks_how_to" USING btree ("_path");
  CREATE INDEX "webinars_blocks_video_object_order_idx" ON "webinars_blocks_video_object" USING btree ("_order");
  CREATE INDEX "webinars_blocks_video_object_parent_id_idx" ON "webinars_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_video_object_path_idx" ON "webinars_blocks_video_object" USING btree ("_path");
  CREATE INDEX "webinars_blocks_video_object_thumbnail_idx" ON "webinars_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "webinars_blocks_faq_page_questions_order_idx" ON "webinars_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "webinars_blocks_faq_page_questions_parent_id_idx" ON "webinars_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_faq_page_order_idx" ON "webinars_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "webinars_blocks_faq_page_parent_id_idx" ON "webinars_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_faq_page_path_idx" ON "webinars_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "webinars_blocks_review_order_idx" ON "webinars_blocks_review" USING btree ("_order");
  CREATE INDEX "webinars_blocks_review_parent_id_idx" ON "webinars_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_review_path_idx" ON "webinars_blocks_review" USING btree ("_path");
  CREATE INDEX "webinars_blocks_software_app_order_idx" ON "webinars_blocks_software_app" USING btree ("_order");
  CREATE INDEX "webinars_blocks_software_app_parent_id_idx" ON "webinars_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_software_app_path_idx" ON "webinars_blocks_software_app" USING btree ("_path");
  CREATE INDEX "webinars_blocks_breadcrumb_list_crumbs_order_idx" ON "webinars_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "webinars_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "webinars_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_breadcrumb_list_order_idx" ON "webinars_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "webinars_blocks_breadcrumb_list_parent_id_idx" ON "webinars_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "webinars_blocks_breadcrumb_list_path_idx" ON "webinars_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "webinars_seo_speakable_path_order_idx" ON "webinars_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "webinars_seo_speakable_path_parent_id_idx" ON "webinars_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "webinars_slug_idx" ON "webinars" USING btree ("slug");
  CREATE INDEX "webinars_hero_image_idx" ON "webinars" USING btree ("hero_image_id");
  CREATE INDEX "webinars_registration_form_idx" ON "webinars" USING btree ("registration_form_id");
  CREATE INDEX "webinars_pdf_idx" ON "webinars" USING btree ("pdf_id");
  CREATE INDEX "webinars_display_published_at_idx" ON "webinars" USING btree ("display_published_at");
  CREATE INDEX "webinars_seo_seo_og_image_idx" ON "webinars" USING btree ("seo_og_image_id");
  CREATE INDEX "webinars_seo_seo_twitter_image_idx" ON "webinars" USING btree ("seo_twitter_image_id");
  CREATE INDEX "webinars_updated_at_idx" ON "webinars" USING btree ("updated_at");
  CREATE INDEX "webinars_created_at_idx" ON "webinars" USING btree ("created_at");
  CREATE INDEX "webinars__status_idx" ON "webinars" USING btree ("_status");
  CREATE INDEX "webinars_rels_order_idx" ON "webinars_rels" USING btree ("order");
  CREATE INDEX "webinars_rels_parent_idx" ON "webinars_rels" USING btree ("parent_id");
  CREATE INDEX "webinars_rels_path_idx" ON "webinars_rels" USING btree ("path");
  CREATE INDEX "webinars_rels_authors_id_idx" ON "webinars_rels" USING btree ("authors_id");
  CREATE INDEX "_webinars_v_blocks_how_to_steps_order_idx" ON "_webinars_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_how_to_steps_parent_id_idx" ON "_webinars_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_how_to_steps_image_idx" ON "_webinars_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_webinars_v_blocks_how_to_order_idx" ON "_webinars_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_how_to_parent_id_idx" ON "_webinars_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_how_to_path_idx" ON "_webinars_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_webinars_v_blocks_video_object_order_idx" ON "_webinars_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_video_object_parent_id_idx" ON "_webinars_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_video_object_path_idx" ON "_webinars_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_webinars_v_blocks_video_object_thumbnail_idx" ON "_webinars_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_webinars_v_blocks_faq_page_questions_order_idx" ON "_webinars_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_faq_page_questions_parent_id_idx" ON "_webinars_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_faq_page_order_idx" ON "_webinars_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_faq_page_parent_id_idx" ON "_webinars_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_faq_page_path_idx" ON "_webinars_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_webinars_v_blocks_review_order_idx" ON "_webinars_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_review_parent_id_idx" ON "_webinars_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_review_path_idx" ON "_webinars_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_webinars_v_blocks_software_app_order_idx" ON "_webinars_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_software_app_parent_id_idx" ON "_webinars_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_software_app_path_idx" ON "_webinars_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_webinars_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_webinars_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_webinars_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_breadcrumb_list_order_idx" ON "_webinars_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_webinars_v_blocks_breadcrumb_list_parent_id_idx" ON "_webinars_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_blocks_breadcrumb_list_path_idx" ON "_webinars_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_webinars_v_version_seo_speakable_path_order_idx" ON "_webinars_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_webinars_v_version_seo_speakable_path_parent_id_idx" ON "_webinars_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_webinars_v_parent_idx" ON "_webinars_v" USING btree ("parent_id");
  CREATE INDEX "_webinars_v_version_version_slug_idx" ON "_webinars_v" USING btree ("version_slug");
  CREATE INDEX "_webinars_v_version_version_hero_image_idx" ON "_webinars_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_webinars_v_version_version_registration_form_idx" ON "_webinars_v" USING btree ("version_registration_form_id");
  CREATE INDEX "_webinars_v_version_version_pdf_idx" ON "_webinars_v" USING btree ("version_pdf_id");
  CREATE INDEX "_webinars_v_version_version_display_published_at_idx" ON "_webinars_v" USING btree ("version_display_published_at");
  CREATE INDEX "_webinars_v_version_seo_version_seo_og_image_idx" ON "_webinars_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_webinars_v_version_seo_version_seo_twitter_image_idx" ON "_webinars_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_webinars_v_version_version_updated_at_idx" ON "_webinars_v" USING btree ("version_updated_at");
  CREATE INDEX "_webinars_v_version_version_created_at_idx" ON "_webinars_v" USING btree ("version_created_at");
  CREATE INDEX "_webinars_v_version_version__status_idx" ON "_webinars_v" USING btree ("version__status");
  CREATE INDEX "_webinars_v_created_at_idx" ON "_webinars_v" USING btree ("created_at");
  CREATE INDEX "_webinars_v_updated_at_idx" ON "_webinars_v" USING btree ("updated_at");
  CREATE INDEX "_webinars_v_latest_idx" ON "_webinars_v" USING btree ("latest");
  CREATE INDEX "_webinars_v_rels_order_idx" ON "_webinars_v_rels" USING btree ("order");
  CREATE INDEX "_webinars_v_rels_parent_idx" ON "_webinars_v_rels" USING btree ("parent_id");
  CREATE INDEX "_webinars_v_rels_path_idx" ON "_webinars_v_rels" USING btree ("path");
  CREATE INDEX "_webinars_v_rels_authors_id_idx" ON "_webinars_v_rels" USING btree ("authors_id");
  CREATE UNIQUE INDEX "podcast_episodes_slug_idx" ON "podcast_episodes" USING btree ("slug");
  CREATE INDEX "podcast_episodes_thumbnail_override_idx" ON "podcast_episodes" USING btree ("thumbnail_override_id");
  CREATE INDEX "podcast_episodes_display_published_at_idx" ON "podcast_episodes" USING btree ("display_published_at");
  CREATE INDEX "podcast_episodes_updated_at_idx" ON "podcast_episodes" USING btree ("updated_at");
  CREATE INDEX "podcast_episodes_created_at_idx" ON "podcast_episodes" USING btree ("created_at");
  CREATE INDEX "podcast_episodes__status_idx" ON "podcast_episodes" USING btree ("_status");
  CREATE INDEX "_podcast_episodes_v_parent_idx" ON "_podcast_episodes_v" USING btree ("parent_id");
  CREATE INDEX "_podcast_episodes_v_version_version_slug_idx" ON "_podcast_episodes_v" USING btree ("version_slug");
  CREATE INDEX "_podcast_episodes_v_version_version_thumbnail_override_idx" ON "_podcast_episodes_v" USING btree ("version_thumbnail_override_id");
  CREATE INDEX "_podcast_episodes_v_version_version_display_published_at_idx" ON "_podcast_episodes_v" USING btree ("version_display_published_at");
  CREATE INDEX "_podcast_episodes_v_version_version_updated_at_idx" ON "_podcast_episodes_v" USING btree ("version_updated_at");
  CREATE INDEX "_podcast_episodes_v_version_version_created_at_idx" ON "_podcast_episodes_v" USING btree ("version_created_at");
  CREATE INDEX "_podcast_episodes_v_version_version__status_idx" ON "_podcast_episodes_v" USING btree ("version__status");
  CREATE INDEX "_podcast_episodes_v_created_at_idx" ON "_podcast_episodes_v" USING btree ("created_at");
  CREATE INDEX "_podcast_episodes_v_updated_at_idx" ON "_podcast_episodes_v" USING btree ("updated_at");
  CREATE INDEX "_podcast_episodes_v_latest_idx" ON "_podcast_episodes_v" USING btree ("latest");
  CREATE INDEX "jobs_blocks_how_to_steps_order_idx" ON "jobs_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "jobs_blocks_how_to_steps_parent_id_idx" ON "jobs_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_how_to_steps_image_idx" ON "jobs_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "jobs_blocks_how_to_order_idx" ON "jobs_blocks_how_to" USING btree ("_order");
  CREATE INDEX "jobs_blocks_how_to_parent_id_idx" ON "jobs_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_how_to_path_idx" ON "jobs_blocks_how_to" USING btree ("_path");
  CREATE INDEX "jobs_blocks_video_object_order_idx" ON "jobs_blocks_video_object" USING btree ("_order");
  CREATE INDEX "jobs_blocks_video_object_parent_id_idx" ON "jobs_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_video_object_path_idx" ON "jobs_blocks_video_object" USING btree ("_path");
  CREATE INDEX "jobs_blocks_video_object_thumbnail_idx" ON "jobs_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "jobs_blocks_faq_page_questions_order_idx" ON "jobs_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "jobs_blocks_faq_page_questions_parent_id_idx" ON "jobs_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_faq_page_order_idx" ON "jobs_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "jobs_blocks_faq_page_parent_id_idx" ON "jobs_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_faq_page_path_idx" ON "jobs_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "jobs_blocks_review_order_idx" ON "jobs_blocks_review" USING btree ("_order");
  CREATE INDEX "jobs_blocks_review_parent_id_idx" ON "jobs_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_review_path_idx" ON "jobs_blocks_review" USING btree ("_path");
  CREATE INDEX "jobs_blocks_software_app_order_idx" ON "jobs_blocks_software_app" USING btree ("_order");
  CREATE INDEX "jobs_blocks_software_app_parent_id_idx" ON "jobs_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_software_app_path_idx" ON "jobs_blocks_software_app" USING btree ("_path");
  CREATE INDEX "jobs_blocks_breadcrumb_list_crumbs_order_idx" ON "jobs_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "jobs_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "jobs_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_breadcrumb_list_order_idx" ON "jobs_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "jobs_blocks_breadcrumb_list_parent_id_idx" ON "jobs_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "jobs_blocks_breadcrumb_list_path_idx" ON "jobs_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "jobs_seo_speakable_path_order_idx" ON "jobs_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "jobs_seo_speakable_path_parent_id_idx" ON "jobs_seo_speakable_path" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "jobs_slug_idx" ON "jobs" USING btree ("slug");
  CREATE INDEX "jobs_description_pdf_idx" ON "jobs" USING btree ("description_pdf_id");
  CREATE INDEX "jobs_display_published_at_idx" ON "jobs" USING btree ("display_published_at");
  CREATE INDEX "jobs_seo_seo_og_image_idx" ON "jobs" USING btree ("seo_og_image_id");
  CREATE INDEX "jobs_seo_seo_twitter_image_idx" ON "jobs" USING btree ("seo_twitter_image_id");
  CREATE INDEX "jobs_updated_at_idx" ON "jobs" USING btree ("updated_at");
  CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");
  CREATE INDEX "jobs__status_idx" ON "jobs" USING btree ("_status");
  CREATE INDEX "jobs_rels_order_idx" ON "jobs_rels" USING btree ("order");
  CREATE INDEX "jobs_rels_parent_idx" ON "jobs_rels" USING btree ("parent_id");
  CREATE INDEX "jobs_rels_path_idx" ON "jobs_rels" USING btree ("path");
  CREATE INDEX "jobs_rels_job_locations_id_idx" ON "jobs_rels" USING btree ("job_locations_id");
  CREATE INDEX "_jobs_v_blocks_how_to_steps_order_idx" ON "_jobs_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_how_to_steps_parent_id_idx" ON "_jobs_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_how_to_steps_image_idx" ON "_jobs_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_jobs_v_blocks_how_to_order_idx" ON "_jobs_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_how_to_parent_id_idx" ON "_jobs_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_how_to_path_idx" ON "_jobs_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_jobs_v_blocks_video_object_order_idx" ON "_jobs_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_video_object_parent_id_idx" ON "_jobs_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_video_object_path_idx" ON "_jobs_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_jobs_v_blocks_video_object_thumbnail_idx" ON "_jobs_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_jobs_v_blocks_faq_page_questions_order_idx" ON "_jobs_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_faq_page_questions_parent_id_idx" ON "_jobs_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_faq_page_order_idx" ON "_jobs_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_faq_page_parent_id_idx" ON "_jobs_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_faq_page_path_idx" ON "_jobs_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_jobs_v_blocks_review_order_idx" ON "_jobs_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_review_parent_id_idx" ON "_jobs_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_review_path_idx" ON "_jobs_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_jobs_v_blocks_software_app_order_idx" ON "_jobs_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_software_app_parent_id_idx" ON "_jobs_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_software_app_path_idx" ON "_jobs_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_jobs_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_jobs_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_jobs_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_breadcrumb_list_order_idx" ON "_jobs_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_jobs_v_blocks_breadcrumb_list_parent_id_idx" ON "_jobs_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_blocks_breadcrumb_list_path_idx" ON "_jobs_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_jobs_v_version_seo_speakable_path_order_idx" ON "_jobs_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_jobs_v_version_seo_speakable_path_parent_id_idx" ON "_jobs_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_parent_idx" ON "_jobs_v" USING btree ("parent_id");
  CREATE INDEX "_jobs_v_version_version_slug_idx" ON "_jobs_v" USING btree ("version_slug");
  CREATE INDEX "_jobs_v_version_version_description_pdf_idx" ON "_jobs_v" USING btree ("version_description_pdf_id");
  CREATE INDEX "_jobs_v_version_version_display_published_at_idx" ON "_jobs_v" USING btree ("version_display_published_at");
  CREATE INDEX "_jobs_v_version_seo_version_seo_og_image_idx" ON "_jobs_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_jobs_v_version_seo_version_seo_twitter_image_idx" ON "_jobs_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_jobs_v_version_version_updated_at_idx" ON "_jobs_v" USING btree ("version_updated_at");
  CREATE INDEX "_jobs_v_version_version_created_at_idx" ON "_jobs_v" USING btree ("version_created_at");
  CREATE INDEX "_jobs_v_version_version__status_idx" ON "_jobs_v" USING btree ("version__status");
  CREATE INDEX "_jobs_v_created_at_idx" ON "_jobs_v" USING btree ("created_at");
  CREATE INDEX "_jobs_v_updated_at_idx" ON "_jobs_v" USING btree ("updated_at");
  CREATE INDEX "_jobs_v_latest_idx" ON "_jobs_v" USING btree ("latest");
  CREATE INDEX "_jobs_v_rels_order_idx" ON "_jobs_v_rels" USING btree ("order");
  CREATE INDEX "_jobs_v_rels_parent_idx" ON "_jobs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_jobs_v_rels_path_idx" ON "_jobs_v_rels" USING btree ("path");
  CREATE INDEX "_jobs_v_rels_job_locations_id_idx" ON "_jobs_v_rels" USING btree ("job_locations_id");
  CREATE UNIQUE INDEX "about_galleries_slug_idx" ON "about_galleries" USING btree ("slug");
  CREATE INDEX "about_galleries_image_idx" ON "about_galleries" USING btree ("image_id");
  CREATE INDEX "about_galleries_updated_at_idx" ON "about_galleries" USING btree ("updated_at");
  CREATE INDEX "about_galleries_created_at_idx" ON "about_galleries" USING btree ("created_at");
  CREATE INDEX "about_galleries__status_idx" ON "about_galleries" USING btree ("_status");
  CREATE INDEX "_about_galleries_v_parent_idx" ON "_about_galleries_v" USING btree ("parent_id");
  CREATE INDEX "_about_galleries_v_version_version_slug_idx" ON "_about_galleries_v" USING btree ("version_slug");
  CREATE INDEX "_about_galleries_v_version_version_image_idx" ON "_about_galleries_v" USING btree ("version_image_id");
  CREATE INDEX "_about_galleries_v_version_version_updated_at_idx" ON "_about_galleries_v" USING btree ("version_updated_at");
  CREATE INDEX "_about_galleries_v_version_version_created_at_idx" ON "_about_galleries_v" USING btree ("version_created_at");
  CREATE INDEX "_about_galleries_v_version_version__status_idx" ON "_about_galleries_v" USING btree ("version__status");
  CREATE INDEX "_about_galleries_v_created_at_idx" ON "_about_galleries_v" USING btree ("created_at");
  CREATE INDEX "_about_galleries_v_updated_at_idx" ON "_about_galleries_v" USING btree ("updated_at");
  CREATE INDEX "_about_galleries_v_latest_idx" ON "_about_galleries_v" USING btree ("latest");
  CREATE INDEX "pages_breadcrumb_order_idx" ON "pages_breadcrumb" USING btree ("_order");
  CREATE INDEX "pages_breadcrumb_parent_id_idx" ON "pages_breadcrumb" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_primary_cta_link_primary_cta_link_medi_idx" ON "pages_blocks_hero" USING btree ("primary_cta_link_media_target_id");
  CREATE INDEX "pages_blocks_hero_secondary_cta_link_secondary_cta_link__idx" ON "pages_blocks_hero" USING btree ("secondary_cta_link_media_target_id");
  CREATE INDEX "pages_blocks_hero_background_background_media_idx" ON "pages_blocks_hero" USING btree ("background_media_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_primary_cta_link_primary_cta_link_media_idx" ON "pages_blocks_cta" USING btree ("primary_cta_link_media_target_id");
  CREATE INDEX "pages_blocks_cta_secondary_cta_link_secondary_cta_link_m_idx" ON "pages_blocks_cta" USING btree ("secondary_cta_link_media_target_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_block_order_idx" ON "pages_blocks_form_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_block_parent_id_idx" ON "pages_blocks_form_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_block_path_idx" ON "pages_blocks_form_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_block_form_idx" ON "pages_blocks_form_block" USING btree ("form_id");
  CREATE INDEX "pages_blocks_feature_grid_features_order_idx" ON "pages_blocks_feature_grid_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_grid_features_parent_id_idx" ON "pages_blocks_feature_grid_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_grid_features_icon_idx" ON "pages_blocks_feature_grid_features" USING btree ("icon_id");
  CREATE INDEX "pages_blocks_feature_grid_features_link_link_media_targe_idx" ON "pages_blocks_feature_grid_features" USING btree ("link_media_target_id");
  CREATE INDEX "pages_blocks_feature_grid_order_idx" ON "pages_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_grid_parent_id_idx" ON "pages_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_grid_path_idx" ON "pages_blocks_feature_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_logo_cloud_logos_order_idx" ON "pages_blocks_logo_cloud_logos" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_cloud_logos_parent_id_idx" ON "pages_blocks_logo_cloud_logos" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_cloud_logos_image_idx" ON "pages_blocks_logo_cloud_logos" USING btree ("image_id");
  CREATE INDEX "pages_blocks_logo_cloud_order_idx" ON "pages_blocks_logo_cloud" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_cloud_parent_id_idx" ON "pages_blocks_logo_cloud" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_cloud_path_idx" ON "pages_blocks_logo_cloud" USING btree ("_path");
  CREATE INDEX "pages_blocks_integration_logos_integrations_order_idx" ON "pages_blocks_integration_logos_integrations" USING btree ("_order");
  CREATE INDEX "pages_blocks_integration_logos_integrations_parent_id_idx" ON "pages_blocks_integration_logos_integrations" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_integration_logos_integrations_logo_idx" ON "pages_blocks_integration_logos_integrations" USING btree ("logo_id");
  CREATE INDEX "pages_blocks_integration_logos_order_idx" ON "pages_blocks_integration_logos" USING btree ("_order");
  CREATE INDEX "pages_blocks_integration_logos_parent_id_idx" ON "pages_blocks_integration_logos" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_integration_logos_path_idx" ON "pages_blocks_integration_logos" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonial_order_idx" ON "pages_blocks_testimonial" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonial_parent_id_idx" ON "pages_blocks_testimonial" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonial_path_idx" ON "pages_blocks_testimonial" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonial_company_logo_idx" ON "pages_blocks_testimonial" USING btree ("company_logo_id");
  CREATE INDEX "pages_blocks_testimonial_avatar_idx" ON "pages_blocks_testimonial" USING btree ("avatar_id");
  CREATE INDEX "pages_blocks_stats_metrics_order_idx" ON "pages_blocks_stats_metrics" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_metrics_parent_id_idx" ON "pages_blocks_stats_metrics" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "pages_blocks_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_metrics_bar_metrics_order_idx" ON "pages_blocks_metrics_bar_metrics" USING btree ("_order");
  CREATE INDEX "pages_blocks_metrics_bar_metrics_parent_id_idx" ON "pages_blocks_metrics_bar_metrics" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_metrics_bar_order_idx" ON "pages_blocks_metrics_bar" USING btree ("_order");
  CREATE INDEX "pages_blocks_metrics_bar_parent_id_idx" ON "pages_blocks_metrics_bar" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_metrics_bar_path_idx" ON "pages_blocks_metrics_bar" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_gallery_images_order_idx" ON "pages_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_images_parent_id_idx" ON "pages_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_images_media_idx" ON "pages_blocks_gallery_images" USING btree ("media_id");
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");
  CREATE INDEX "pages_blocks_embed_order_idx" ON "pages_blocks_embed" USING btree ("_order");
  CREATE INDEX "pages_blocks_embed_parent_id_idx" ON "pages_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_embed_path_idx" ON "pages_blocks_embed" USING btree ("_path");
  CREATE INDEX "pages_blocks_code_block_order_idx" ON "pages_blocks_code_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_code_block_parent_id_idx" ON "pages_blocks_code_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_code_block_path_idx" ON "pages_blocks_code_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_pricing_tiers_features_order_idx" ON "pages_blocks_pricing_tiers_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_pricing_tiers_features_parent_id_idx" ON "pages_blocks_pricing_tiers_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pricing_tiers_order_idx" ON "pages_blocks_pricing_tiers" USING btree ("_order");
  CREATE INDEX "pages_blocks_pricing_tiers_parent_id_idx" ON "pages_blocks_pricing_tiers" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pricing_tiers_cta_link_cta_link_media_targe_idx" ON "pages_blocks_pricing_tiers" USING btree ("cta_link_media_target_id");
  CREATE INDEX "pages_blocks_pricing_order_idx" ON "pages_blocks_pricing" USING btree ("_order");
  CREATE INDEX "pages_blocks_pricing_parent_id_idx" ON "pages_blocks_pricing" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pricing_path_idx" ON "pages_blocks_pricing" USING btree ("_path");
  CREATE INDEX "pages_blocks_jobs_list_order_idx" ON "pages_blocks_jobs_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_jobs_list_parent_id_idx" ON "pages_blocks_jobs_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_jobs_list_path_idx" ON "pages_blocks_jobs_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_table_headers_order_idx" ON "pages_blocks_table_headers" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_headers_parent_id_idx" ON "pages_blocks_table_headers" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_rows_cells_order_idx" ON "pages_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_rows_cells_parent_id_idx" ON "pages_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_rows_order_idx" ON "pages_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_rows_parent_id_idx" ON "pages_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_order_idx" ON "pages_blocks_table" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_parent_id_idx" ON "pages_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_path_idx" ON "pages_blocks_table" USING btree ("_path");
  CREATE INDEX "pages_blocks_section_order_idx" ON "pages_blocks_section" USING btree ("_order");
  CREATE INDEX "pages_blocks_section_parent_id_idx" ON "pages_blocks_section" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_section_path_idx" ON "pages_blocks_section" USING btree ("_path");
  CREATE INDEX "pages_blocks_how_to_steps_order_idx" ON "pages_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_how_to_steps_parent_id_idx" ON "pages_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_how_to_steps_image_idx" ON "pages_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "pages_blocks_how_to_order_idx" ON "pages_blocks_how_to" USING btree ("_order");
  CREATE INDEX "pages_blocks_how_to_parent_id_idx" ON "pages_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_how_to_path_idx" ON "pages_blocks_how_to" USING btree ("_path");
  CREATE INDEX "pages_blocks_video_object_order_idx" ON "pages_blocks_video_object" USING btree ("_order");
  CREATE INDEX "pages_blocks_video_object_parent_id_idx" ON "pages_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_video_object_path_idx" ON "pages_blocks_video_object" USING btree ("_path");
  CREATE INDEX "pages_blocks_video_object_thumbnail_idx" ON "pages_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "pages_blocks_faq_page_questions_order_idx" ON "pages_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_page_questions_parent_id_idx" ON "pages_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_page_order_idx" ON "pages_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_page_parent_id_idx" ON "pages_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_page_path_idx" ON "pages_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "pages_blocks_review_order_idx" ON "pages_blocks_review" USING btree ("_order");
  CREATE INDEX "pages_blocks_review_parent_id_idx" ON "pages_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_review_path_idx" ON "pages_blocks_review" USING btree ("_path");
  CREATE INDEX "pages_blocks_software_app_order_idx" ON "pages_blocks_software_app" USING btree ("_order");
  CREATE INDEX "pages_blocks_software_app_parent_id_idx" ON "pages_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_software_app_path_idx" ON "pages_blocks_software_app" USING btree ("_path");
  CREATE INDEX "pages_blocks_breadcrumb_list_crumbs_order_idx" ON "pages_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "pages_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "pages_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_breadcrumb_list_order_idx" ON "pages_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_breadcrumb_list_parent_id_idx" ON "pages_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_breadcrumb_list_path_idx" ON "pages_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "pages_seo_speakable_path_order_idx" ON "pages_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "pages_seo_speakable_path_parent_id_idx" ON "pages_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_parent_idx" ON "pages" USING btree ("parent_id");
  CREATE INDEX "pages_path_idx" ON "pages" USING btree ("path");
  CREATE INDEX "pages_display_published_at_idx" ON "pages" USING btree ("display_published_at");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_seo_seo_twitter_image_idx" ON "pages" USING btree ("seo_twitter_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "slug_parent_idx" ON "pages" USING btree ("slug","parent_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id");
  CREATE INDEX "pages_rels_blogs_id_idx" ON "pages_rels" USING btree ("blogs_id");
  CREATE INDEX "pages_rels_news_id_idx" ON "pages_rels" USING btree ("news_id");
  CREATE INDEX "pages_rels_guides_id_idx" ON "pages_rels" USING btree ("guides_id");
  CREATE INDEX "pages_rels_resources_id_idx" ON "pages_rels" USING btree ("resources_id");
  CREATE INDEX "pages_rels_events_id_idx" ON "pages_rels" USING btree ("events_id");
  CREATE INDEX "pages_rels_webinars_id_idx" ON "pages_rels" USING btree ("webinars_id");
  CREATE INDEX "pages_rels_jobs_id_idx" ON "pages_rels" USING btree ("jobs_id");
  CREATE INDEX "pages_rels_authors_id_idx" ON "pages_rels" USING btree ("authors_id");
  CREATE INDEX "pages_rels_categories_id_idx" ON "pages_rels" USING btree ("categories_id");
  CREATE INDEX "pages_rels_news_categories_id_idx" ON "pages_rels" USING btree ("news_categories_id");
  CREATE INDEX "pages_rels_job_locations_id_idx" ON "pages_rels" USING btree ("job_locations_id");
  CREATE INDEX "_pages_v_version_breadcrumb_order_idx" ON "_pages_v_version_breadcrumb" USING btree ("_order");
  CREATE INDEX "_pages_v_version_breadcrumb_parent_id_idx" ON "_pages_v_version_breadcrumb" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_primary_cta_link_primary_cta_link_m_idx" ON "_pages_v_blocks_hero" USING btree ("primary_cta_link_media_target_id");
  CREATE INDEX "_pages_v_blocks_hero_secondary_cta_link_secondary_cta_li_idx" ON "_pages_v_blocks_hero" USING btree ("secondary_cta_link_media_target_id");
  CREATE INDEX "_pages_v_blocks_hero_background_background_media_idx" ON "_pages_v_blocks_hero" USING btree ("background_media_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_primary_cta_link_primary_cta_link_me_idx" ON "_pages_v_blocks_cta" USING btree ("primary_cta_link_media_target_id");
  CREATE INDEX "_pages_v_blocks_cta_secondary_cta_link_secondary_cta_lin_idx" ON "_pages_v_blocks_cta" USING btree ("secondary_cta_link_media_target_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_block_order_idx" ON "_pages_v_blocks_form_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_block_parent_id_idx" ON "_pages_v_blocks_form_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_block_path_idx" ON "_pages_v_blocks_form_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_block_form_idx" ON "_pages_v_blocks_form_block" USING btree ("form_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_features_order_idx" ON "_pages_v_blocks_feature_grid_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_grid_features_parent_id_idx" ON "_pages_v_blocks_feature_grid_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_features_icon_idx" ON "_pages_v_blocks_feature_grid_features" USING btree ("icon_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_features_link_link_media_ta_idx" ON "_pages_v_blocks_feature_grid_features" USING btree ("link_media_target_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_order_idx" ON "_pages_v_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_grid_parent_id_idx" ON "_pages_v_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_path_idx" ON "_pages_v_blocks_feature_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_logo_cloud_logos_order_idx" ON "_pages_v_blocks_logo_cloud_logos" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_cloud_logos_parent_id_idx" ON "_pages_v_blocks_logo_cloud_logos" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud_logos_image_idx" ON "_pages_v_blocks_logo_cloud_logos" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud_order_idx" ON "_pages_v_blocks_logo_cloud" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_cloud_parent_id_idx" ON "_pages_v_blocks_logo_cloud" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud_path_idx" ON "_pages_v_blocks_logo_cloud" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_integration_logos_integrations_order_idx" ON "_pages_v_blocks_integration_logos_integrations" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_integration_logos_integrations_parent_id_idx" ON "_pages_v_blocks_integration_logos_integrations" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_integration_logos_integrations_logo_idx" ON "_pages_v_blocks_integration_logos_integrations" USING btree ("logo_id");
  CREATE INDEX "_pages_v_blocks_integration_logos_order_idx" ON "_pages_v_blocks_integration_logos" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_integration_logos_parent_id_idx" ON "_pages_v_blocks_integration_logos" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_integration_logos_path_idx" ON "_pages_v_blocks_integration_logos" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_testimonial_order_idx" ON "_pages_v_blocks_testimonial" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonial_parent_id_idx" ON "_pages_v_blocks_testimonial" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonial_path_idx" ON "_pages_v_blocks_testimonial" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_testimonial_company_logo_idx" ON "_pages_v_blocks_testimonial" USING btree ("company_logo_id");
  CREATE INDEX "_pages_v_blocks_testimonial_avatar_idx" ON "_pages_v_blocks_testimonial" USING btree ("avatar_id");
  CREATE INDEX "_pages_v_blocks_stats_metrics_order_idx" ON "_pages_v_blocks_stats_metrics" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_metrics_parent_id_idx" ON "_pages_v_blocks_stats_metrics" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_order_idx" ON "_pages_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_parent_id_idx" ON "_pages_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_path_idx" ON "_pages_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_metrics_bar_metrics_order_idx" ON "_pages_v_blocks_metrics_bar_metrics" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_metrics_bar_metrics_parent_id_idx" ON "_pages_v_blocks_metrics_bar_metrics" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_metrics_bar_order_idx" ON "_pages_v_blocks_metrics_bar" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_metrics_bar_parent_id_idx" ON "_pages_v_blocks_metrics_bar" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_metrics_bar_path_idx" ON "_pages_v_blocks_metrics_bar" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_gallery_images_order_idx" ON "_pages_v_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_images_parent_id_idx" ON "_pages_v_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_images_media_idx" ON "_pages_v_blocks_gallery_images" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "_pages_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_embed_order_idx" ON "_pages_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_embed_parent_id_idx" ON "_pages_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_embed_path_idx" ON "_pages_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_code_block_order_idx" ON "_pages_v_blocks_code_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_code_block_parent_id_idx" ON "_pages_v_blocks_code_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_code_block_path_idx" ON "_pages_v_blocks_code_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_pricing_tiers_features_order_idx" ON "_pages_v_blocks_pricing_tiers_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pricing_tiers_features_parent_id_idx" ON "_pages_v_blocks_pricing_tiers_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pricing_tiers_order_idx" ON "_pages_v_blocks_pricing_tiers" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pricing_tiers_parent_id_idx" ON "_pages_v_blocks_pricing_tiers" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pricing_tiers_cta_link_cta_link_media_ta_idx" ON "_pages_v_blocks_pricing_tiers" USING btree ("cta_link_media_target_id");
  CREATE INDEX "_pages_v_blocks_pricing_order_idx" ON "_pages_v_blocks_pricing" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pricing_parent_id_idx" ON "_pages_v_blocks_pricing" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pricing_path_idx" ON "_pages_v_blocks_pricing" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_jobs_list_order_idx" ON "_pages_v_blocks_jobs_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_jobs_list_parent_id_idx" ON "_pages_v_blocks_jobs_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_jobs_list_path_idx" ON "_pages_v_blocks_jobs_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_table_headers_order_idx" ON "_pages_v_blocks_table_headers" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_headers_parent_id_idx" ON "_pages_v_blocks_table_headers" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_rows_cells_order_idx" ON "_pages_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_rows_cells_parent_id_idx" ON "_pages_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_rows_order_idx" ON "_pages_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_rows_parent_id_idx" ON "_pages_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_order_idx" ON "_pages_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_parent_id_idx" ON "_pages_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_path_idx" ON "_pages_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_section_order_idx" ON "_pages_v_blocks_section" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_section_parent_id_idx" ON "_pages_v_blocks_section" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_section_path_idx" ON "_pages_v_blocks_section" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_how_to_steps_order_idx" ON "_pages_v_blocks_how_to_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_how_to_steps_parent_id_idx" ON "_pages_v_blocks_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_how_to_steps_image_idx" ON "_pages_v_blocks_how_to_steps" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_how_to_order_idx" ON "_pages_v_blocks_how_to" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_how_to_parent_id_idx" ON "_pages_v_blocks_how_to" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_how_to_path_idx" ON "_pages_v_blocks_how_to" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_video_object_order_idx" ON "_pages_v_blocks_video_object" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_video_object_parent_id_idx" ON "_pages_v_blocks_video_object" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_video_object_path_idx" ON "_pages_v_blocks_video_object" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_video_object_thumbnail_idx" ON "_pages_v_blocks_video_object" USING btree ("thumbnail_id");
  CREATE INDEX "_pages_v_blocks_faq_page_questions_order_idx" ON "_pages_v_blocks_faq_page_questions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_page_questions_parent_id_idx" ON "_pages_v_blocks_faq_page_questions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_page_order_idx" ON "_pages_v_blocks_faq_page" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_page_parent_id_idx" ON "_pages_v_blocks_faq_page" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_page_path_idx" ON "_pages_v_blocks_faq_page" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_review_order_idx" ON "_pages_v_blocks_review" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_review_parent_id_idx" ON "_pages_v_blocks_review" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_review_path_idx" ON "_pages_v_blocks_review" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_software_app_order_idx" ON "_pages_v_blocks_software_app" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_software_app_parent_id_idx" ON "_pages_v_blocks_software_app" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_software_app_path_idx" ON "_pages_v_blocks_software_app" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_pages_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_pages_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_breadcrumb_list_order_idx" ON "_pages_v_blocks_breadcrumb_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_breadcrumb_list_parent_id_idx" ON "_pages_v_blocks_breadcrumb_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_breadcrumb_list_path_idx" ON "_pages_v_blocks_breadcrumb_list" USING btree ("_path");
  CREATE INDEX "_pages_v_version_seo_speakable_path_order_idx" ON "_pages_v_version_seo_speakable_path" USING btree ("_order");
  CREATE INDEX "_pages_v_version_seo_speakable_path_parent_id_idx" ON "_pages_v_version_seo_speakable_path" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_parent_idx" ON "_pages_v" USING btree ("version_parent_id");
  CREATE INDEX "_pages_v_version_version_path_idx" ON "_pages_v" USING btree ("version_path");
  CREATE INDEX "_pages_v_version_version_display_published_at_idx" ON "_pages_v" USING btree ("version_display_published_at");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_seo_version_seo_twitter_image_idx" ON "_pages_v" USING btree ("version_seo_twitter_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "version_slug_version_parent_idx" ON "_pages_v" USING btree ("version_slug","version_parent_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX "_pages_v_rels_blogs_id_idx" ON "_pages_v_rels" USING btree ("blogs_id");
  CREATE INDEX "_pages_v_rels_news_id_idx" ON "_pages_v_rels" USING btree ("news_id");
  CREATE INDEX "_pages_v_rels_guides_id_idx" ON "_pages_v_rels" USING btree ("guides_id");
  CREATE INDEX "_pages_v_rels_resources_id_idx" ON "_pages_v_rels" USING btree ("resources_id");
  CREATE INDEX "_pages_v_rels_events_id_idx" ON "_pages_v_rels" USING btree ("events_id");
  CREATE INDEX "_pages_v_rels_webinars_id_idx" ON "_pages_v_rels" USING btree ("webinars_id");
  CREATE INDEX "_pages_v_rels_jobs_id_idx" ON "_pages_v_rels" USING btree ("jobs_id");
  CREATE INDEX "_pages_v_rels_authors_id_idx" ON "_pages_v_rels" USING btree ("authors_id");
  CREATE INDEX "_pages_v_rels_categories_id_idx" ON "_pages_v_rels" USING btree ("categories_id");
  CREATE INDEX "_pages_v_rels_news_categories_id_idx" ON "_pages_v_rels" USING btree ("news_categories_id");
  CREATE INDEX "_pages_v_rels_job_locations_id_idx" ON "_pages_v_rels" USING btree ("job_locations_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_broken_links_id_idx" ON "payload_locked_documents_rels" USING btree ("broken_links_id");
  CREATE INDEX "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");
  CREATE INDEX "payload_locked_documents_rels_search_log_id_idx" ON "payload_locked_documents_rels" USING btree ("search_log_id");
  CREATE INDEX "payload_locked_documents_rels_preview_audit_id_idx" ON "payload_locked_documents_rels" USING btree ("preview_audit_id");
  CREATE INDEX "payload_locked_documents_rels_webhooks_dead_letter_id_idx" ON "payload_locked_documents_rels" USING btree ("webhooks_dead_letter_id");
  CREATE INDEX "payload_locked_documents_rels_integrations_id_idx" ON "payload_locked_documents_rels" USING btree ("integrations_id");
  CREATE INDEX "payload_locked_documents_rels_analytics_cache_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_cache_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_news_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("news_categories_id");
  CREATE INDEX "payload_locked_documents_rels_knowledge_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("knowledge_categories_id");
  CREATE INDEX "payload_locked_documents_rels_job_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("job_locations_id");
  CREATE INDEX "payload_locked_documents_rels_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("forms_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_blogs_id_idx" ON "payload_locked_documents_rels" USING btree ("blogs_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("guides_id");
  CREATE INDEX "payload_locked_documents_rels_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("resources_id");
  CREATE INDEX "payload_locked_documents_rels_knowledge_base_id_idx" ON "payload_locked_documents_rels" USING btree ("knowledge_base_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_webinars_id_idx" ON "payload_locked_documents_rels" USING btree ("webinars_id");
  CREATE INDEX "payload_locked_documents_rels_podcast_episodes_id_idx" ON "payload_locked_documents_rels" USING btree ("podcast_episodes_id");
  CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("jobs_id");
  CREATE INDEX "payload_locked_documents_rels_about_galleries_id_idx" ON "payload_locked_documents_rels" USING btree ("about_galleries_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "seo_defaults_organization_json_ld_same_as_order_idx" ON "seo_defaults_organization_json_ld_same_as" USING btree ("_order");
  CREATE INDEX "seo_defaults_organization_json_ld_same_as_parent_id_idx" ON "seo_defaults_organization_json_ld_same_as" USING btree ("_parent_id");
  CREATE INDEX "seo_defaults_default_og_image_idx" ON "seo_defaults" USING btree ("default_og_image_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_favicon32_idx" ON "seo_defaults" USING btree ("brand_icons_favicon32_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_icon192_idx" ON "seo_defaults" USING btree ("brand_icons_icon192_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_icon512_idx" ON "seo_defaults" USING btree ("brand_icons_icon512_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_apple_touch_icon_idx" ON "seo_defaults" USING btree ("brand_icons_apple_touch_icon_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_safari_pinned_tab_s_idx" ON "seo_defaults" USING btree ("brand_icons_safari_pinned_tab_svg_id");
  CREATE INDEX "seo_defaults_organization_json_ld_organization_json_ld_l_idx" ON "seo_defaults" USING btree ("organization_json_ld_logo_id");
  CREATE INDEX "_seo_defaults_v_version_organization_json_ld_same_as_order_idx" ON "_seo_defaults_v_version_organization_json_ld_same_as" USING btree ("_order");
  CREATE INDEX "_seo_defaults_v_version_organization_json_ld_same_as_parent_id_idx" ON "_seo_defaults_v_version_organization_json_ld_same_as" USING btree ("_parent_id");
  CREATE INDEX "_seo_defaults_v_version_version_default_og_image_idx" ON "_seo_defaults_v" USING btree ("version_default_og_image_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icons__idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_favicon32_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icon_1_idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_icon192_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icon_2_idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_icon512_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icon_3_idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_apple_touch_icon_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icon_4_idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_safari_pinned_tab_svg_id");
  CREATE INDEX "_seo_defaults_v_version_organization_json_ld_version_org_idx" ON "_seo_defaults_v" USING btree ("version_organization_json_ld_logo_id");
  CREATE INDEX "_seo_defaults_v_created_at_idx" ON "_seo_defaults_v" USING btree ("created_at");
  CREATE INDEX "_seo_defaults_v_updated_at_idx" ON "_seo_defaults_v" USING btree ("updated_at");
  CREATE INDEX "main_nav_items_mega_menu_columns_items_order_idx" ON "main_nav_items_mega_menu_columns_items" USING btree ("_order");
  CREATE INDEX "main_nav_items_mega_menu_columns_items_parent_id_idx" ON "main_nav_items_mega_menu_columns_items" USING btree ("_parent_id");
  CREATE INDEX "main_nav_items_mega_menu_columns_items_target_idx" ON "main_nav_items_mega_menu_columns_items" USING btree ("target_id");
  CREATE INDEX "main_nav_items_mega_menu_columns_order_idx" ON "main_nav_items_mega_menu_columns" USING btree ("_order");
  CREATE INDEX "main_nav_items_mega_menu_columns_parent_id_idx" ON "main_nav_items_mega_menu_columns" USING btree ("_parent_id");
  CREATE INDEX "main_nav_items_order_idx" ON "main_nav_items" USING btree ("_order");
  CREATE INDEX "main_nav_items_parent_id_idx" ON "main_nav_items" USING btree ("_parent_id");
  CREATE INDEX "main_nav_items_target_idx" ON "main_nav_items" USING btree ("target_id");
  CREATE INDEX "main_nav_items_mega_menu_featured_card_mega_menu_feature_idx" ON "main_nav_items" USING btree ("mega_menu_featured_card_target_id");
  CREATE INDEX "main_nav_items_mega_menu_featured_card_mega_menu_featu_1_idx" ON "main_nav_items" USING btree ("mega_menu_featured_card_image_id");
  CREATE INDEX "_main_nav_v_version_items_mega_menu_columns_items_order_idx" ON "_main_nav_v_version_items_mega_menu_columns_items" USING btree ("_order");
  CREATE INDEX "_main_nav_v_version_items_mega_menu_columns_items_parent_id_idx" ON "_main_nav_v_version_items_mega_menu_columns_items" USING btree ("_parent_id");
  CREATE INDEX "_main_nav_v_version_items_mega_menu_columns_items_target_idx" ON "_main_nav_v_version_items_mega_menu_columns_items" USING btree ("target_id");
  CREATE INDEX "_main_nav_v_version_items_mega_menu_columns_order_idx" ON "_main_nav_v_version_items_mega_menu_columns" USING btree ("_order");
  CREATE INDEX "_main_nav_v_version_items_mega_menu_columns_parent_id_idx" ON "_main_nav_v_version_items_mega_menu_columns" USING btree ("_parent_id");
  CREATE INDEX "_main_nav_v_version_items_order_idx" ON "_main_nav_v_version_items" USING btree ("_order");
  CREATE INDEX "_main_nav_v_version_items_parent_id_idx" ON "_main_nav_v_version_items" USING btree ("_parent_id");
  CREATE INDEX "_main_nav_v_version_items_target_idx" ON "_main_nav_v_version_items" USING btree ("target_id");
  CREATE INDEX "_main_nav_v_version_items_mega_menu_featured_card_mega_m_idx" ON "_main_nav_v_version_items" USING btree ("mega_menu_featured_card_target_id");
  CREATE INDEX "_main_nav_v_version_items_mega_menu_featured_card_mega_1_idx" ON "_main_nav_v_version_items" USING btree ("mega_menu_featured_card_image_id");
  CREATE INDEX "_main_nav_v_created_at_idx" ON "_main_nav_v" USING btree ("created_at");
  CREATE INDEX "_main_nav_v_updated_at_idx" ON "_main_nav_v" USING btree ("updated_at");
  CREATE INDEX "footer_nav_columns_items_order_idx" ON "footer_nav_columns_items" USING btree ("_order");
  CREATE INDEX "footer_nav_columns_items_parent_id_idx" ON "footer_nav_columns_items" USING btree ("_parent_id");
  CREATE INDEX "footer_nav_columns_items_target_idx" ON "footer_nav_columns_items" USING btree ("target_id");
  CREATE INDEX "footer_nav_columns_order_idx" ON "footer_nav_columns" USING btree ("_order");
  CREATE INDEX "footer_nav_columns_parent_id_idx" ON "footer_nav_columns" USING btree ("_parent_id");
  CREATE INDEX "footer_nav_social_order_idx" ON "footer_nav_social" USING btree ("_order");
  CREATE INDEX "footer_nav_social_parent_id_idx" ON "footer_nav_social" USING btree ("_parent_id");
  CREATE INDEX "footer_nav_legal_links_order_idx" ON "footer_nav_legal_links" USING btree ("_order");
  CREATE INDEX "footer_nav_legal_links_parent_id_idx" ON "footer_nav_legal_links" USING btree ("_parent_id");
  CREATE INDEX "footer_nav_legal_links_target_idx" ON "footer_nav_legal_links" USING btree ("target_id");
  CREATE INDEX "footer_nav_badges_order_idx" ON "footer_nav_badges" USING btree ("_order");
  CREATE INDEX "footer_nav_badges_parent_id_idx" ON "footer_nav_badges" USING btree ("_parent_id");
  CREATE INDEX "footer_nav_badges_image_idx" ON "footer_nav_badges" USING btree ("image_id");
  CREATE INDEX "footer_nav_newsletter_signup_idx" ON "footer_nav" USING btree ("newsletter_signup_id");
  CREATE INDEX "_footer_nav_v_version_columns_items_order_idx" ON "_footer_nav_v_version_columns_items" USING btree ("_order");
  CREATE INDEX "_footer_nav_v_version_columns_items_parent_id_idx" ON "_footer_nav_v_version_columns_items" USING btree ("_parent_id");
  CREATE INDEX "_footer_nav_v_version_columns_items_target_idx" ON "_footer_nav_v_version_columns_items" USING btree ("target_id");
  CREATE INDEX "_footer_nav_v_version_columns_order_idx" ON "_footer_nav_v_version_columns" USING btree ("_order");
  CREATE INDEX "_footer_nav_v_version_columns_parent_id_idx" ON "_footer_nav_v_version_columns" USING btree ("_parent_id");
  CREATE INDEX "_footer_nav_v_version_social_order_idx" ON "_footer_nav_v_version_social" USING btree ("_order");
  CREATE INDEX "_footer_nav_v_version_social_parent_id_idx" ON "_footer_nav_v_version_social" USING btree ("_parent_id");
  CREATE INDEX "_footer_nav_v_version_legal_links_order_idx" ON "_footer_nav_v_version_legal_links" USING btree ("_order");
  CREATE INDEX "_footer_nav_v_version_legal_links_parent_id_idx" ON "_footer_nav_v_version_legal_links" USING btree ("_parent_id");
  CREATE INDEX "_footer_nav_v_version_legal_links_target_idx" ON "_footer_nav_v_version_legal_links" USING btree ("target_id");
  CREATE INDEX "_footer_nav_v_version_badges_order_idx" ON "_footer_nav_v_version_badges" USING btree ("_order");
  CREATE INDEX "_footer_nav_v_version_badges_parent_id_idx" ON "_footer_nav_v_version_badges" USING btree ("_parent_id");
  CREATE INDEX "_footer_nav_v_version_badges_image_idx" ON "_footer_nav_v_version_badges" USING btree ("image_id");
  CREATE INDEX "_footer_nav_v_version_version_newsletter_signup_idx" ON "_footer_nav_v" USING btree ("version_newsletter_signup_id");
  CREATE INDEX "_footer_nav_v_created_at_idx" ON "_footer_nav_v" USING btree ("created_at");
  CREATE INDEX "_footer_nav_v_updated_at_idx" ON "_footer_nav_v" USING btree ("updated_at");
  CREATE INDEX "_legal_v_created_at_idx" ON "_legal_v" USING btree ("created_at");
  CREATE INDEX "_legal_v_updated_at_idx" ON "_legal_v" USING btree ("updated_at");
  CREATE INDEX "_announcements_v_created_at_idx" ON "_announcements_v" USING btree ("created_at");
  CREATE INDEX "_announcements_v_updated_at_idx" ON "_announcements_v" USING btree ("updated_at");
  CREATE INDEX "podcast_page_cta_cards_order_idx" ON "podcast_page_cta_cards" USING btree ("_order");
  CREATE INDEX "podcast_page_cta_cards_parent_id_idx" ON "podcast_page_cta_cards" USING btree ("_parent_id");
  CREATE INDEX "podcast_page_featured_hero_episode_idx" ON "podcast_page" USING btree ("featured_hero_episode_id");
  CREATE INDEX "_podcast_page_v_version_cta_cards_order_idx" ON "_podcast_page_v_version_cta_cards" USING btree ("_order");
  CREATE INDEX "_podcast_page_v_version_cta_cards_parent_id_idx" ON "_podcast_page_v_version_cta_cards" USING btree ("_parent_id");
  CREATE INDEX "_podcast_page_v_version_version_featured_hero_episode_idx" ON "_podcast_page_v" USING btree ("version_featured_hero_episode_id");
  CREATE INDEX "_podcast_page_v_created_at_idx" ON "_podcast_page_v" USING btree ("created_at");
  CREATE INDEX "_podcast_page_v_updated_at_idx" ON "_podcast_page_v" USING btree ("updated_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "broken_links" CASCADE;
  DROP TABLE "audit_log" CASCADE;
  DROP TABLE "search_log" CASCADE;
  DROP TABLE "preview_audit" CASCADE;
  DROP TABLE "webhooks_dead_letter" CASCADE;
  DROP TABLE "integrations_routing_events" CASCADE;
  DROP TABLE "integrations_routing_collections" CASCADE;
  DROP TABLE "integrations_teams_config_mentions_trigger_on" CASCADE;
  DROP TABLE "integrations_teams_config_mentions" CASCADE;
  DROP TABLE "integrations_hubspot_config_field_mapping" CASCADE;
  DROP TABLE "integrations" CASCADE;
  DROP TABLE "integrations_texts" CASCADE;
  DROP TABLE "analytics_cache" CASCADE;
  DROP TABLE "authors_topic_areas" CASCADE;
  DROP TABLE "authors_education" CASCADE;
  DROP TABLE "authors_experience" CASCADE;
  DROP TABLE "authors_skills" CASCADE;
  DROP TABLE "authors_awards" CASCADE;
  DROP TABLE "authors_seo_speakable_path" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "_authors_v_version_topic_areas" CASCADE;
  DROP TABLE "_authors_v_version_education" CASCADE;
  DROP TABLE "_authors_v_version_experience" CASCADE;
  DROP TABLE "_authors_v_version_skills" CASCADE;
  DROP TABLE "_authors_v_version_awards" CASCADE;
  DROP TABLE "_authors_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_authors_v" CASCADE;
  DROP TABLE "categories_seo_speakable_path" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "_categories_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_categories_v" CASCADE;
  DROP TABLE "news_categories_seo_speakable_path" CASCADE;
  DROP TABLE "news_categories" CASCADE;
  DROP TABLE "_news_categories_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_news_categories_v" CASCADE;
  DROP TABLE "knowledge_categories_seo_speakable_path" CASCADE;
  DROP TABLE "knowledge_categories" CASCADE;
  DROP TABLE "_knowledge_categories_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_knowledge_categories_v" CASCADE;
  DROP TABLE "job_locations" CASCADE;
  DROP TABLE "forms_fields_options" CASCADE;
  DROP TABLE "forms_fields_conditions_rules" CASCADE;
  DROP TABLE "forms_fields" CASCADE;
  DROP TABLE "forms_crm_handlers" CASCADE;
  DROP TABLE "forms_notify_to" CASCADE;
  DROP TABLE "forms" CASCADE;
  DROP TABLE "_forms_v_version_fields_options" CASCADE;
  DROP TABLE "_forms_v_version_fields_conditions_rules" CASCADE;
  DROP TABLE "_forms_v_version_fields" CASCADE;
  DROP TABLE "_forms_v_version_crm_handlers" CASCADE;
  DROP TABLE "_forms_v_version_notify_to" CASCADE;
  DROP TABLE "_forms_v" CASCADE;
  DROP TABLE "leads_consent_categories" CASCADE;
  DROP TABLE "leads_synced_to" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "blogs_faqs" CASCADE;
  DROP TABLE "blogs_blocks_how_to_steps" CASCADE;
  DROP TABLE "blogs_blocks_how_to" CASCADE;
  DROP TABLE "blogs_blocks_video_object" CASCADE;
  DROP TABLE "blogs_blocks_faq_page_questions" CASCADE;
  DROP TABLE "blogs_blocks_faq_page" CASCADE;
  DROP TABLE "blogs_blocks_review" CASCADE;
  DROP TABLE "blogs_blocks_software_app" CASCADE;
  DROP TABLE "blogs_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "blogs_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "blogs_table_of_contents" CASCADE;
  DROP TABLE "blogs_seo_speakable_path" CASCADE;
  DROP TABLE "blogs" CASCADE;
  DROP TABLE "blogs_rels" CASCADE;
  DROP TABLE "_blogs_v_version_faqs" CASCADE;
  DROP TABLE "_blogs_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_blogs_v_blocks_how_to" CASCADE;
  DROP TABLE "_blogs_v_blocks_video_object" CASCADE;
  DROP TABLE "_blogs_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_blogs_v_blocks_faq_page" CASCADE;
  DROP TABLE "_blogs_v_blocks_review" CASCADE;
  DROP TABLE "_blogs_v_blocks_software_app" CASCADE;
  DROP TABLE "_blogs_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_blogs_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_blogs_v_version_table_of_contents" CASCADE;
  DROP TABLE "_blogs_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_blogs_v" CASCADE;
  DROP TABLE "_blogs_v_rels" CASCADE;
  DROP TABLE "news_blocks_how_to_steps" CASCADE;
  DROP TABLE "news_blocks_how_to" CASCADE;
  DROP TABLE "news_blocks_video_object" CASCADE;
  DROP TABLE "news_blocks_faq_page_questions" CASCADE;
  DROP TABLE "news_blocks_faq_page" CASCADE;
  DROP TABLE "news_blocks_review" CASCADE;
  DROP TABLE "news_blocks_software_app" CASCADE;
  DROP TABLE "news_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "news_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "news_seo_speakable_path" CASCADE;
  DROP TABLE "news" CASCADE;
  DROP TABLE "news_rels" CASCADE;
  DROP TABLE "_news_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_news_v_blocks_how_to" CASCADE;
  DROP TABLE "_news_v_blocks_video_object" CASCADE;
  DROP TABLE "_news_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_news_v_blocks_faq_page" CASCADE;
  DROP TABLE "_news_v_blocks_review" CASCADE;
  DROP TABLE "_news_v_blocks_software_app" CASCADE;
  DROP TABLE "_news_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_news_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_news_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_news_v" CASCADE;
  DROP TABLE "_news_v_rels" CASCADE;
  DROP TABLE "guides_faqs" CASCADE;
  DROP TABLE "guides_article_sections" CASCADE;
  DROP TABLE "guides_citations" CASCADE;
  DROP TABLE "guides_keywords" CASCADE;
  DROP TABLE "guides_blocks_how_to_steps" CASCADE;
  DROP TABLE "guides_blocks_how_to" CASCADE;
  DROP TABLE "guides_blocks_video_object" CASCADE;
  DROP TABLE "guides_blocks_faq_page_questions" CASCADE;
  DROP TABLE "guides_blocks_faq_page" CASCADE;
  DROP TABLE "guides_blocks_review" CASCADE;
  DROP TABLE "guides_blocks_software_app" CASCADE;
  DROP TABLE "guides_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "guides_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "guides_table_of_contents" CASCADE;
  DROP TABLE "guides_seo_speakable_path" CASCADE;
  DROP TABLE "guides" CASCADE;
  DROP TABLE "guides_rels" CASCADE;
  DROP TABLE "_guides_v_version_faqs" CASCADE;
  DROP TABLE "_guides_v_version_article_sections" CASCADE;
  DROP TABLE "_guides_v_version_citations" CASCADE;
  DROP TABLE "_guides_v_version_keywords" CASCADE;
  DROP TABLE "_guides_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_guides_v_blocks_how_to" CASCADE;
  DROP TABLE "_guides_v_blocks_video_object" CASCADE;
  DROP TABLE "_guides_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_guides_v_blocks_faq_page" CASCADE;
  DROP TABLE "_guides_v_blocks_review" CASCADE;
  DROP TABLE "_guides_v_blocks_software_app" CASCADE;
  DROP TABLE "_guides_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_guides_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_guides_v_version_table_of_contents" CASCADE;
  DROP TABLE "_guides_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_guides_v" CASCADE;
  DROP TABLE "_guides_v_rels" CASCADE;
  DROP TABLE "resources_blocks_how_to_steps" CASCADE;
  DROP TABLE "resources_blocks_how_to" CASCADE;
  DROP TABLE "resources_blocks_video_object" CASCADE;
  DROP TABLE "resources_blocks_faq_page_questions" CASCADE;
  DROP TABLE "resources_blocks_faq_page" CASCADE;
  DROP TABLE "resources_blocks_review" CASCADE;
  DROP TABLE "resources_blocks_software_app" CASCADE;
  DROP TABLE "resources_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "resources_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "resources_seo_speakable_path" CASCADE;
  DROP TABLE "resources" CASCADE;
  DROP TABLE "_resources_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_resources_v_blocks_how_to" CASCADE;
  DROP TABLE "_resources_v_blocks_video_object" CASCADE;
  DROP TABLE "_resources_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_resources_v_blocks_faq_page" CASCADE;
  DROP TABLE "_resources_v_blocks_review" CASCADE;
  DROP TABLE "_resources_v_blocks_software_app" CASCADE;
  DROP TABLE "_resources_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_resources_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_resources_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_resources_v" CASCADE;
  DROP TABLE "knowledge_base_faqs" CASCADE;
  DROP TABLE "knowledge_base_blocks_how_to_steps" CASCADE;
  DROP TABLE "knowledge_base_blocks_how_to" CASCADE;
  DROP TABLE "knowledge_base_blocks_video_object" CASCADE;
  DROP TABLE "knowledge_base_blocks_faq_page_questions" CASCADE;
  DROP TABLE "knowledge_base_blocks_faq_page" CASCADE;
  DROP TABLE "knowledge_base_blocks_review" CASCADE;
  DROP TABLE "knowledge_base_blocks_software_app" CASCADE;
  DROP TABLE "knowledge_base_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "knowledge_base_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "knowledge_base_table_of_contents" CASCADE;
  DROP TABLE "knowledge_base_seo_speakable_path" CASCADE;
  DROP TABLE "knowledge_base" CASCADE;
  DROP TABLE "knowledge_base_rels" CASCADE;
  DROP TABLE "_knowledge_base_v_version_faqs" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_how_to" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_video_object" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_faq_page" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_review" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_software_app" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_knowledge_base_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_knowledge_base_v_version_table_of_contents" CASCADE;
  DROP TABLE "_knowledge_base_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_knowledge_base_v" CASCADE;
  DROP TABLE "_knowledge_base_v_rels" CASCADE;
  DROP TABLE "events_gallery" CASCADE;
  DROP TABLE "events_blocks_how_to_steps" CASCADE;
  DROP TABLE "events_blocks_how_to" CASCADE;
  DROP TABLE "events_blocks_video_object" CASCADE;
  DROP TABLE "events_blocks_faq_page_questions" CASCADE;
  DROP TABLE "events_blocks_faq_page" CASCADE;
  DROP TABLE "events_blocks_review" CASCADE;
  DROP TABLE "events_blocks_software_app" CASCADE;
  DROP TABLE "events_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "events_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "events_seo_speakable_path" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_rels" CASCADE;
  DROP TABLE "_events_v_version_gallery" CASCADE;
  DROP TABLE "_events_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_events_v_blocks_how_to" CASCADE;
  DROP TABLE "_events_v_blocks_video_object" CASCADE;
  DROP TABLE "_events_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_events_v_blocks_faq_page" CASCADE;
  DROP TABLE "_events_v_blocks_review" CASCADE;
  DROP TABLE "_events_v_blocks_software_app" CASCADE;
  DROP TABLE "_events_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_events_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_events_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_rels" CASCADE;
  DROP TABLE "webinars_blocks_how_to_steps" CASCADE;
  DROP TABLE "webinars_blocks_how_to" CASCADE;
  DROP TABLE "webinars_blocks_video_object" CASCADE;
  DROP TABLE "webinars_blocks_faq_page_questions" CASCADE;
  DROP TABLE "webinars_blocks_faq_page" CASCADE;
  DROP TABLE "webinars_blocks_review" CASCADE;
  DROP TABLE "webinars_blocks_software_app" CASCADE;
  DROP TABLE "webinars_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "webinars_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "webinars_seo_speakable_path" CASCADE;
  DROP TABLE "webinars" CASCADE;
  DROP TABLE "webinars_rels" CASCADE;
  DROP TABLE "_webinars_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_webinars_v_blocks_how_to" CASCADE;
  DROP TABLE "_webinars_v_blocks_video_object" CASCADE;
  DROP TABLE "_webinars_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_webinars_v_blocks_faq_page" CASCADE;
  DROP TABLE "_webinars_v_blocks_review" CASCADE;
  DROP TABLE "_webinars_v_blocks_software_app" CASCADE;
  DROP TABLE "_webinars_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_webinars_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_webinars_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_webinars_v" CASCADE;
  DROP TABLE "_webinars_v_rels" CASCADE;
  DROP TABLE "podcast_episodes" CASCADE;
  DROP TABLE "_podcast_episodes_v" CASCADE;
  DROP TABLE "jobs_blocks_how_to_steps" CASCADE;
  DROP TABLE "jobs_blocks_how_to" CASCADE;
  DROP TABLE "jobs_blocks_video_object" CASCADE;
  DROP TABLE "jobs_blocks_faq_page_questions" CASCADE;
  DROP TABLE "jobs_blocks_faq_page" CASCADE;
  DROP TABLE "jobs_blocks_review" CASCADE;
  DROP TABLE "jobs_blocks_software_app" CASCADE;
  DROP TABLE "jobs_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "jobs_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "jobs_seo_speakable_path" CASCADE;
  DROP TABLE "jobs" CASCADE;
  DROP TABLE "jobs_rels" CASCADE;
  DROP TABLE "_jobs_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_jobs_v_blocks_how_to" CASCADE;
  DROP TABLE "_jobs_v_blocks_video_object" CASCADE;
  DROP TABLE "_jobs_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_jobs_v_blocks_faq_page" CASCADE;
  DROP TABLE "_jobs_v_blocks_review" CASCADE;
  DROP TABLE "_jobs_v_blocks_software_app" CASCADE;
  DROP TABLE "_jobs_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_jobs_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_jobs_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_jobs_v" CASCADE;
  DROP TABLE "_jobs_v_rels" CASCADE;
  DROP TABLE "about_galleries" CASCADE;
  DROP TABLE "_about_galleries_v" CASCADE;
  DROP TABLE "pages_breadcrumb" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_form_block" CASCADE;
  DROP TABLE "pages_blocks_feature_grid_features" CASCADE;
  DROP TABLE "pages_blocks_feature_grid" CASCADE;
  DROP TABLE "pages_blocks_logo_cloud_logos" CASCADE;
  DROP TABLE "pages_blocks_logo_cloud" CASCADE;
  DROP TABLE "pages_blocks_integration_logos_integrations" CASCADE;
  DROP TABLE "pages_blocks_integration_logos" CASCADE;
  DROP TABLE "pages_blocks_testimonial" CASCADE;
  DROP TABLE "pages_blocks_stats_metrics" CASCADE;
  DROP TABLE "pages_blocks_stats" CASCADE;
  DROP TABLE "pages_blocks_metrics_bar_metrics" CASCADE;
  DROP TABLE "pages_blocks_metrics_bar" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_gallery_images" CASCADE;
  DROP TABLE "pages_blocks_gallery" CASCADE;
  DROP TABLE "pages_blocks_embed" CASCADE;
  DROP TABLE "pages_blocks_code_block" CASCADE;
  DROP TABLE "pages_blocks_pricing_tiers_features" CASCADE;
  DROP TABLE "pages_blocks_pricing_tiers" CASCADE;
  DROP TABLE "pages_blocks_pricing" CASCADE;
  DROP TABLE "pages_blocks_jobs_list" CASCADE;
  DROP TABLE "pages_blocks_table_headers" CASCADE;
  DROP TABLE "pages_blocks_table_rows_cells" CASCADE;
  DROP TABLE "pages_blocks_table_rows" CASCADE;
  DROP TABLE "pages_blocks_table" CASCADE;
  DROP TABLE "pages_blocks_section" CASCADE;
  DROP TABLE "pages_blocks_how_to_steps" CASCADE;
  DROP TABLE "pages_blocks_how_to" CASCADE;
  DROP TABLE "pages_blocks_video_object" CASCADE;
  DROP TABLE "pages_blocks_faq_page_questions" CASCADE;
  DROP TABLE "pages_blocks_faq_page" CASCADE;
  DROP TABLE "pages_blocks_review" CASCADE;
  DROP TABLE "pages_blocks_software_app" CASCADE;
  DROP TABLE "pages_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "pages_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "pages_seo_speakable_path" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_version_breadcrumb" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_form_block" CASCADE;
  DROP TABLE "_pages_v_blocks_feature_grid_features" CASCADE;
  DROP TABLE "_pages_v_blocks_feature_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_cloud_logos" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_cloud" CASCADE;
  DROP TABLE "_pages_v_blocks_integration_logos_integrations" CASCADE;
  DROP TABLE "_pages_v_blocks_integration_logos" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonial" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_metrics" CASCADE;
  DROP TABLE "_pages_v_blocks_stats" CASCADE;
  DROP TABLE "_pages_v_blocks_metrics_bar_metrics" CASCADE;
  DROP TABLE "_pages_v_blocks_metrics_bar" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_images" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_embed" CASCADE;
  DROP TABLE "_pages_v_blocks_code_block" CASCADE;
  DROP TABLE "_pages_v_blocks_pricing_tiers_features" CASCADE;
  DROP TABLE "_pages_v_blocks_pricing_tiers" CASCADE;
  DROP TABLE "_pages_v_blocks_pricing" CASCADE;
  DROP TABLE "_pages_v_blocks_jobs_list" CASCADE;
  DROP TABLE "_pages_v_blocks_table_headers" CASCADE;
  DROP TABLE "_pages_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_pages_v_blocks_table_rows" CASCADE;
  DROP TABLE "_pages_v_blocks_table" CASCADE;
  DROP TABLE "_pages_v_blocks_section" CASCADE;
  DROP TABLE "_pages_v_blocks_how_to_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_how_to" CASCADE;
  DROP TABLE "_pages_v_blocks_video_object" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_page_questions" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_page" CASCADE;
  DROP TABLE "_pages_v_blocks_review" CASCADE;
  DROP TABLE "_pages_v_blocks_software_app" CASCADE;
  DROP TABLE "_pages_v_blocks_breadcrumb_list_crumbs" CASCADE;
  DROP TABLE "_pages_v_blocks_breadcrumb_list" CASCADE;
  DROP TABLE "_pages_v_version_seo_speakable_path" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "seo_defaults_organization_json_ld_same_as" CASCADE;
  DROP TABLE "seo_defaults" CASCADE;
  DROP TABLE "_seo_defaults_v_version_organization_json_ld_same_as" CASCADE;
  DROP TABLE "_seo_defaults_v" CASCADE;
  DROP TABLE "main_nav_items_mega_menu_columns_items" CASCADE;
  DROP TABLE "main_nav_items_mega_menu_columns" CASCADE;
  DROP TABLE "main_nav_items" CASCADE;
  DROP TABLE "main_nav" CASCADE;
  DROP TABLE "_main_nav_v_version_items_mega_menu_columns_items" CASCADE;
  DROP TABLE "_main_nav_v_version_items_mega_menu_columns" CASCADE;
  DROP TABLE "_main_nav_v_version_items" CASCADE;
  DROP TABLE "_main_nav_v" CASCADE;
  DROP TABLE "footer_nav_columns_items" CASCADE;
  DROP TABLE "footer_nav_columns" CASCADE;
  DROP TABLE "footer_nav_social" CASCADE;
  DROP TABLE "footer_nav_legal_links" CASCADE;
  DROP TABLE "footer_nav_badges" CASCADE;
  DROP TABLE "footer_nav" CASCADE;
  DROP TABLE "_footer_nav_v_version_columns_items" CASCADE;
  DROP TABLE "_footer_nav_v_version_columns" CASCADE;
  DROP TABLE "_footer_nav_v_version_social" CASCADE;
  DROP TABLE "_footer_nav_v_version_legal_links" CASCADE;
  DROP TABLE "_footer_nav_v_version_badges" CASCADE;
  DROP TABLE "_footer_nav_v" CASCADE;
  DROP TABLE "legal" CASCADE;
  DROP TABLE "_legal_v" CASCADE;
  DROP TABLE "announcements" CASCADE;
  DROP TABLE "_announcements_v" CASCADE;
  DROP TABLE "podcast_page_cta_cards" CASCADE;
  DROP TABLE "podcast_page" CASCADE;
  DROP TABLE "_podcast_page_v_version_cta_cards" CASCADE;
  DROP TABLE "_podcast_page_v" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_media_folder";
  DROP TYPE "public"."enum_redirects_status";
  DROP TYPE "public"."enum_redirects_source";
  DROP TYPE "public"."enum_broken_links_status";
  DROP TYPE "public"."enum_audit_log_action";
  DROP TYPE "public"."enum_webhooks_dead_letter_event";
  DROP TYPE "public"."enum_webhooks_dead_letter_destination_kind";
  DROP TYPE "public"."enum_integrations_routing_events";
  DROP TYPE "public"."enum_integrations_routing_collections";
  DROP TYPE "public"."enum_integrations_teams_config_mentions_trigger_on";
  DROP TYPE "public"."enum_integrations_kind";
  DROP TYPE "public"."enum_integrations_hubspot_config_write_mode";
  DROP TYPE "public"."enum_integrations_hubspot_config_default_lifecycle_stage";
  DROP TYPE "public"."enum_integrations_hubspot_config_default_lead_status";
  DROP TYPE "public"."enum_integrations_source";
  DROP TYPE "public"."enum_analytics_cache_env";
  DROP TYPE "public"."enum_analytics_cache_provider";
  DROP TYPE "public"."enum_analytics_cache_scope";
  DROP TYPE "public"."enum_authors_seo_indexable";
  DROP TYPE "public"."enum_authors_seo_twitter_card";
  DROP TYPE "public"."enum_seo_max_image_preview";
  DROP TYPE "public"."enum_authors_status";
  DROP TYPE "public"."enum__authors_v_version_seo_indexable";
  DROP TYPE "public"."enum__authors_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__authors_v_version_status";
  DROP TYPE "public"."enum_categories_seo_indexable";
  DROP TYPE "public"."enum_categories_seo_twitter_card";
  DROP TYPE "public"."enum_categories_status";
  DROP TYPE "public"."enum__categories_v_version_seo_indexable";
  DROP TYPE "public"."enum__categories_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__categories_v_version_status";
  DROP TYPE "public"."enum_news_categories_seo_indexable";
  DROP TYPE "public"."enum_news_categories_seo_twitter_card";
  DROP TYPE "public"."enum_news_categories_status";
  DROP TYPE "public"."enum__news_categories_v_version_seo_indexable";
  DROP TYPE "public"."enum__news_categories_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__news_categories_v_version_status";
  DROP TYPE "public"."enum_knowledge_categories_seo_indexable";
  DROP TYPE "public"."enum_knowledge_categories_seo_twitter_card";
  DROP TYPE "public"."enum_knowledge_categories_status";
  DROP TYPE "public"."enum__knowledge_categories_v_version_seo_indexable";
  DROP TYPE "public"."enum__knowledge_categories_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__knowledge_categories_v_version_status";
  DROP TYPE "public"."enum_job_locations_type";
  DROP TYPE "public"."enum_forms_fields_conditions_rules_operator";
  DROP TYPE "public"."enum_forms_fields_type";
  DROP TYPE "public"."enum_forms_fields_conditions_mode";
  DROP TYPE "public"."enum_forms_crm_handlers";
  DROP TYPE "public"."enum_forms_post_submit_kind";
  DROP TYPE "public"."enum_forms_status";
  DROP TYPE "public"."enum__forms_v_version_fields_conditions_rules_operator";
  DROP TYPE "public"."enum__forms_v_version_fields_type";
  DROP TYPE "public"."enum__forms_v_version_fields_conditions_mode";
  DROP TYPE "public"."enum__forms_v_version_crm_handlers";
  DROP TYPE "public"."enum__forms_v_version_post_submit_kind";
  DROP TYPE "public"."enum__forms_v_version_status";
  DROP TYPE "public"."enum_leads_synced_to_status";
  DROP TYPE "public"."enum_leads_email_health";
  DROP TYPE "public"."enum_blogs_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_blogs_blocks_software_app_category";
  DROP TYPE "public"."enum_blogs_blocks_software_app_currency";
  DROP TYPE "public"."enum_blogs_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_blogs_toc_depth";
  DROP TYPE "public"."enum_blogs_seo_indexable";
  DROP TYPE "public"."enum_blogs_seo_twitter_card";
  DROP TYPE "public"."enum_blogs_status";
  DROP TYPE "public"."enum__blogs_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__blogs_v_blocks_software_app_category";
  DROP TYPE "public"."enum__blogs_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__blogs_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__blogs_v_version_toc_depth";
  DROP TYPE "public"."enum__blogs_v_version_seo_indexable";
  DROP TYPE "public"."enum__blogs_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__blogs_v_version_status";
  DROP TYPE "public"."enum_news_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_news_blocks_software_app_category";
  DROP TYPE "public"."enum_news_blocks_software_app_currency";
  DROP TYPE "public"."enum_news_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_news_press_type";
  DROP TYPE "public"."enum_news_seo_indexable";
  DROP TYPE "public"."enum_news_seo_twitter_card";
  DROP TYPE "public"."enum_news_status";
  DROP TYPE "public"."enum__news_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__news_v_blocks_software_app_category";
  DROP TYPE "public"."enum__news_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__news_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__news_v_version_press_type";
  DROP TYPE "public"."enum__news_v_version_seo_indexable";
  DROP TYPE "public"."enum__news_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__news_v_version_status";
  DROP TYPE "public"."enum_guides_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_guides_blocks_software_app_category";
  DROP TYPE "public"."enum_guides_blocks_software_app_currency";
  DROP TYPE "public"."enum_guides_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_guides_seo_indexable";
  DROP TYPE "public"."enum_guides_seo_twitter_card";
  DROP TYPE "public"."enum_guides_status";
  DROP TYPE "public"."enum__guides_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__guides_v_blocks_software_app_category";
  DROP TYPE "public"."enum__guides_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__guides_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__guides_v_version_seo_indexable";
  DROP TYPE "public"."enum__guides_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__guides_v_version_status";
  DROP TYPE "public"."enum_resources_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_resources_blocks_software_app_category";
  DROP TYPE "public"."enum_resources_blocks_software_app_currency";
  DROP TYPE "public"."enum_resources_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_resources_type";
  DROP TYPE "public"."enum_resources_access_level";
  DROP TYPE "public"."enum_resources_seo_indexable";
  DROP TYPE "public"."enum_resources_seo_twitter_card";
  DROP TYPE "public"."enum_resources_status";
  DROP TYPE "public"."enum__resources_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__resources_v_blocks_software_app_category";
  DROP TYPE "public"."enum__resources_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__resources_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__resources_v_version_type";
  DROP TYPE "public"."enum__resources_v_version_access_level";
  DROP TYPE "public"."enum__resources_v_version_seo_indexable";
  DROP TYPE "public"."enum__resources_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__resources_v_version_status";
  DROP TYPE "public"."enum_knowledge_base_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_knowledge_base_blocks_software_app_category";
  DROP TYPE "public"."enum_knowledge_base_blocks_software_app_currency";
  DROP TYPE "public"."enum_knowledge_base_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_knowledge_base_seo_indexable";
  DROP TYPE "public"."enum_knowledge_base_seo_twitter_card";
  DROP TYPE "public"."enum_knowledge_base_status";
  DROP TYPE "public"."enum__knowledge_base_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__knowledge_base_v_blocks_software_app_category";
  DROP TYPE "public"."enum__knowledge_base_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__knowledge_base_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__knowledge_base_v_version_seo_indexable";
  DROP TYPE "public"."enum__knowledge_base_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__knowledge_base_v_version_status";
  DROP TYPE "public"."enum_events_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_events_blocks_software_app_category";
  DROP TYPE "public"."enum_events_blocks_software_app_currency";
  DROP TYPE "public"."enum_events_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_events_registration_mode";
  DROP TYPE "public"."enum_events_event_status";
  DROP TYPE "public"."enum_events_seo_indexable";
  DROP TYPE "public"."enum_events_seo_twitter_card";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__events_v_blocks_software_app_category";
  DROP TYPE "public"."enum__events_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__events_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__events_v_version_registration_mode";
  DROP TYPE "public"."enum__events_v_version_event_status";
  DROP TYPE "public"."enum__events_v_version_seo_indexable";
  DROP TYPE "public"."enum__events_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum_webinars_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_webinars_blocks_software_app_category";
  DROP TYPE "public"."enum_webinars_blocks_software_app_currency";
  DROP TYPE "public"."enum_webinars_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_webinars_webinar_type";
  DROP TYPE "public"."enum_webinars_region";
  DROP TYPE "public"."enum_webinars_registration_mode";
  DROP TYPE "public"."enum_webinars_event_status";
  DROP TYPE "public"."enum_webinars_seo_indexable";
  DROP TYPE "public"."enum_webinars_seo_twitter_card";
  DROP TYPE "public"."enum_webinars_status";
  DROP TYPE "public"."enum__webinars_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__webinars_v_blocks_software_app_category";
  DROP TYPE "public"."enum__webinars_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__webinars_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__webinars_v_version_webinar_type";
  DROP TYPE "public"."enum__webinars_v_version_region";
  DROP TYPE "public"."enum__webinars_v_version_registration_mode";
  DROP TYPE "public"."enum__webinars_v_version_event_status";
  DROP TYPE "public"."enum__webinars_v_version_seo_indexable";
  DROP TYPE "public"."enum__webinars_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__webinars_v_version_status";
  DROP TYPE "public"."enum_podcast_episodes_status";
  DROP TYPE "public"."enum__podcast_episodes_v_version_status";
  DROP TYPE "public"."enum_jobs_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_jobs_blocks_software_app_category";
  DROP TYPE "public"."enum_jobs_blocks_software_app_currency";
  DROP TYPE "public"."enum_jobs_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_jobs_source";
  DROP TYPE "public"."enum_jobs_department";
  DROP TYPE "public"."enum_jobs_employment_type";
  DROP TYPE "public"."enum_jobs_experience_level";
  DROP TYPE "public"."enum_jobs_salary_range_currency";
  DROP TYPE "public"."enum_jobs_hiring_status";
  DROP TYPE "public"."enum_jobs_seo_indexable";
  DROP TYPE "public"."enum_jobs_seo_twitter_card";
  DROP TYPE "public"."enum_jobs_status";
  DROP TYPE "public"."enum__jobs_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__jobs_v_blocks_software_app_category";
  DROP TYPE "public"."enum__jobs_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__jobs_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__jobs_v_version_source";
  DROP TYPE "public"."enum__jobs_v_version_department";
  DROP TYPE "public"."enum__jobs_v_version_employment_type";
  DROP TYPE "public"."enum__jobs_v_version_experience_level";
  DROP TYPE "public"."enum__jobs_v_version_salary_range_currency";
  DROP TYPE "public"."enum__jobs_v_version_hiring_status";
  DROP TYPE "public"."enum__jobs_v_version_seo_indexable";
  DROP TYPE "public"."enum__jobs_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__jobs_v_version_status";
  DROP TYPE "public"."enum_about_galleries_status";
  DROP TYPE "public"."enum__about_galleries_v_version_status";
  DROP TYPE "public"."enum_pages_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_hero_primary_cta_link_kind";
  DROP TYPE "public"."enum_pages_blocks_hero_secondary_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_hero_secondary_cta_link_kind";
  DROP TYPE "public"."enum_pages_blocks_hero_background_kind";
  DROP TYPE "public"."enum_pages_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_primary_cta_link_kind";
  DROP TYPE "public"."enum_pages_blocks_cta_secondary_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_secondary_cta_link_kind";
  DROP TYPE "public"."enum_pages_blocks_cta_background";
  DROP TYPE "public"."enum_pages_blocks_rich_text_max_width";
  DROP TYPE "public"."enum_pages_blocks_form_block_post_submit_kind";
  DROP TYPE "public"."enum_pages_blocks_form_block_layout";
  DROP TYPE "public"."enum_pages_blocks_feature_grid_features_link_kind";
  DROP TYPE "public"."enum_pages_blocks_feature_grid_columns";
  DROP TYPE "public"."enum_pages_blocks_integration_logos_integrations_category";
  DROP TYPE "public"."enum_pages_blocks_testimonial_variant";
  DROP TYPE "public"."enum_pages_blocks_metrics_bar_background";
  DROP TYPE "public"."enum_pages_blocks_gallery_layout";
  DROP TYPE "public"."enum_pages_blocks_embed_provider";
  DROP TYPE "public"."enum_pages_blocks_embed_aspect_ratio";
  DROP TYPE "public"."enum_pages_blocks_code_block_language";
  DROP TYPE "public"."enum_pages_blocks_pricing_tiers_price_currency";
  DROP TYPE "public"."enum_pages_blocks_pricing_tiers_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_pricing_tiers_cta_link_kind";
  DROP TYPE "public"."enum_pages_blocks_jobs_list_filters_department";
  DROP TYPE "public"."enum_pages_blocks_table_rows_cells_type";
  DROP TYPE "public"."enum_pages_blocks_section_variant";
  DROP TYPE "public"."enum_pages_blocks_section_gap";
  DROP TYPE "public"."enum_pages_blocks_section_alignment";
  DROP TYPE "public"."enum_pages_blocks_section_background";
  DROP TYPE "public"."enum_pages_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum_pages_blocks_software_app_category";
  DROP TYPE "public"."enum_pages_blocks_software_app_currency";
  DROP TYPE "public"."enum_pages_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum_pages_page_layout";
  DROP TYPE "public"."enum_pages_schema_type";
  DROP TYPE "public"."enum_pages_seo_indexable";
  DROP TYPE "public"."enum_pages_seo_twitter_card";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_cta_link_kind";
  DROP TYPE "public"."enum__pages_v_blocks_hero_secondary_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_hero_secondary_cta_link_kind";
  DROP TYPE "public"."enum__pages_v_blocks_hero_background_kind";
  DROP TYPE "public"."enum__pages_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_cta_primary_cta_link_kind";
  DROP TYPE "public"."enum__pages_v_blocks_cta_secondary_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_cta_secondary_cta_link_kind";
  DROP TYPE "public"."enum__pages_v_blocks_cta_background";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_max_width";
  DROP TYPE "public"."enum__pages_v_blocks_form_block_post_submit_kind";
  DROP TYPE "public"."enum__pages_v_blocks_form_block_layout";
  DROP TYPE "public"."enum__pages_v_blocks_feature_grid_features_link_kind";
  DROP TYPE "public"."enum__pages_v_blocks_feature_grid_columns";
  DROP TYPE "public"."enum__pages_v_blocks_integration_logos_integrations_category";
  DROP TYPE "public"."enum__pages_v_blocks_testimonial_variant";
  DROP TYPE "public"."enum__pages_v_blocks_metrics_bar_background";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__pages_v_blocks_embed_provider";
  DROP TYPE "public"."enum__pages_v_blocks_embed_aspect_ratio";
  DROP TYPE "public"."enum__pages_v_blocks_code_block_language";
  DROP TYPE "public"."enum__pages_v_blocks_pricing_tiers_price_currency";
  DROP TYPE "public"."enum__pages_v_blocks_pricing_tiers_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_pricing_tiers_cta_link_kind";
  DROP TYPE "public"."enum__pages_v_blocks_jobs_list_filters_department";
  DROP TYPE "public"."enum__pages_v_blocks_table_rows_cells_type";
  DROP TYPE "public"."enum__pages_v_blocks_section_variant";
  DROP TYPE "public"."enum__pages_v_blocks_section_gap";
  DROP TYPE "public"."enum__pages_v_blocks_section_alignment";
  DROP TYPE "public"."enum__pages_v_blocks_section_background";
  DROP TYPE "public"."enum__pages_v_blocks_review_item_reviewed_type";
  DROP TYPE "public"."enum__pages_v_blocks_software_app_category";
  DROP TYPE "public"."enum__pages_v_blocks_software_app_currency";
  DROP TYPE "public"."enum__pages_v_blocks_breadcrumb_list_mode";
  DROP TYPE "public"."enum__pages_v_version_page_layout";
  DROP TYPE "public"."enum__pages_v_version_schema_type";
  DROP TYPE "public"."enum__pages_v_version_seo_indexable";
  DROP TYPE "public"."enum__pages_v_version_seo_twitter_card";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_main_nav_items_mega_menu_columns_items_kind";
  DROP TYPE "public"."enum_main_nav_items_mega_menu_columns_items_variant";
  DROP TYPE "public"."enum_main_nav_items_kind";
  DROP TYPE "public"."enum_main_nav_items_variant";
  DROP TYPE "public"."enum_main_nav_items_mega_menu_featured_card_kind";
  DROP TYPE "public"."enum__main_nav_v_version_items_mega_menu_columns_items_kind";
  DROP TYPE "public"."enum__main_nav_v_version_items_mega_menu_columns_items_variant";
  DROP TYPE "public"."enum__main_nav_v_version_items_kind";
  DROP TYPE "public"."enum__main_nav_v_version_items_variant";
  DROP TYPE "public"."enum__main_nav_v_version_items_mega_menu_featured_card_kind";
  DROP TYPE "public"."enum_footer_nav_columns_items_kind";
  DROP TYPE "public"."enum_footer_nav_columns_items_variant";
  DROP TYPE "public"."enum_footer_nav_social_platform";
  DROP TYPE "public"."enum__footer_nav_v_version_columns_items_kind";
  DROP TYPE "public"."enum__footer_nav_v_version_columns_items_variant";
  DROP TYPE "public"."enum__footer_nav_v_version_social_platform";
  DROP TYPE "public"."enum_announcements_variant";
  DROP TYPE "public"."enum__announcements_v_version_variant";`)
}
