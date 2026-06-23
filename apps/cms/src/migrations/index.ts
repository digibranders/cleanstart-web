import * as migration_20260602_050520_initial_baseline from './20260602_050520_initial_baseline';
import * as migration_20260602_095540_remove_brevo from './20260602_095540_remove_brevo';
import * as migration_20260602_115320_add_hubspot_form_guid from './20260602_115320_add_hubspot_form_guid';
import * as migration_20260603_081714_add_careers_collections from './20260603_081714_add_careers_collections';
import * as migration_20260603_092035_add_job_location_snapshot from './20260603_092035_add_job_location_snapshot';
import * as migration_20260603_095034_add_case_studies from './20260603_095034_add_case_studies';
import * as migration_20260603_100302_consent_log from './20260603_100302_consent_log';
import * as migration_20260603_120148_add_partner_applications from './20260603_120148_add_partner_applications';
import * as migration_20260604_045219_add_guide_journey_nav from './20260604_045219_add_guide_journey_nav';
import * as migration_20260604_052913_add_job_experience_range from './20260604_052913_add_job_experience_range';
import * as migration_20260604_063039_add_application_extra_fields from './20260604_063039_add_application_extra_fields';
import * as migration_20260605_094837_add_legal_documents from './20260605_094837_add_legal_documents';
import * as migration_20260608_114736_add_news_featured from './20260608_114736_add_news_featured';
import * as migration_20260608_121245_add_event_country from './20260608_121245_add_event_country';
import * as migration_20260608_140513_add_news_region from './20260608_140513_add_news_region';
import * as migration_20260608_144837_add_kb_category_display_order from './20260608_144837_add_kb_category_display_order';
import * as migration_20260608_153417_add_kb_video_url from './20260608_153417_add_kb_video_url';
import * as migration_20260610_085422_add_users_api_key from './20260610_085422_add_users_api_key';
import * as migration_20260611_061406_add_seo_keywords from './20260611_061406_add_seo_keywords';
import * as migration_20260619_120000_fix_kb_internal_links from './20260619_120000_fix_kb_internal_links';
import * as migration_20260619_130000_unlink_broken_blog_guide_links from './20260619_130000_unlink_broken_blog_guide_links';
import * as migration_20260619_140000_unlink_broken_kb_links from './20260619_140000_unlink_broken_kb_links';
import * as migration_20260619_150000_add_impact_stats_global from './20260619_150000_add_impact_stats_global';
import * as migration_20260622_065936_add_page_registry from './20260622_065936_add_page_registry';
import * as migration_20260622_071500_add_seo_role from './20260622_071500_add_seo_role';
import * as migration_20260622_130000_change_news_region_values from './20260622_130000_change_news_region_values';
import * as migration_20260622_170000_add_page_registry_order from './20260622_170000_add_page_registry_order';
import * as migration_20260622_180000_add_page_registry_schema_history from './20260622_180000_add_page_registry_schema_history';
import * as migration_20260622_190000_add_page_registry_web_page_type from './20260622_190000_add_page_registry_web_page_type';
import * as migration_20260622_200000_add_seo_schema_history from './20260622_200000_add_seo_schema_history';
import * as migration_20260622_210000_add_seo_defaults_additional_schema from './20260622_210000_add_seo_defaults_additional_schema';
import * as migration_20260622_220000_remove_podcast_page_global from './20260622_220000_remove_podcast_page_global';

import * as migration_20260622_230000_add_seo_defaults_organization_fields from './20260622_230000_add_seo_defaults_organization_fields';

import * as migration_20260622_240000_retire_dead_globals_and_fields from './20260622_240000_retire_dead_globals_and_fields';

import * as migration_20260622_250000_merge_spotlights from './20260622_250000_merge_spotlights';

import * as migration_20260622_260000_drop_seo_defaults_brand_icons from './20260622_260000_drop_seo_defaults_brand_icons';

import * as migration_20260622_270000_drop_site_settings_timezone from './20260622_270000_drop_site_settings_timezone';
import * as migration_20260623_120000_add_deal_registrations from './20260623_120000_add_deal_registrations';
import * as migration_20260623_140000_add_forms_hubspot_subscription_type_id from './20260623_140000_add_forms_hubspot_subscription_type_id';

export const migrations = [
  {
    up: migration_20260602_050520_initial_baseline.up,
    down: migration_20260602_050520_initial_baseline.down,
    name: '20260602_050520_initial_baseline',
  },
  {
    up: migration_20260602_095540_remove_brevo.up,
    down: migration_20260602_095540_remove_brevo.down,
    name: '20260602_095540_remove_brevo',
  },
  {
    up: migration_20260602_115320_add_hubspot_form_guid.up,
    down: migration_20260602_115320_add_hubspot_form_guid.down,
    name: '20260602_115320_add_hubspot_form_guid',
  },
  {
    up: migration_20260603_081714_add_careers_collections.up,
    down: migration_20260603_081714_add_careers_collections.down,
    name: '20260603_081714_add_careers_collections',
  },
  {
    up: migration_20260603_092035_add_job_location_snapshot.up,
    down: migration_20260603_092035_add_job_location_snapshot.down,
    name: '20260603_092035_add_job_location_snapshot',
  },
  {
    up: migration_20260603_095034_add_case_studies.up,
    down: migration_20260603_095034_add_case_studies.down,
    name: '20260603_095034_add_case_studies',
  },
  {
    up: migration_20260603_100302_consent_log.up,
    down: migration_20260603_100302_consent_log.down,
    name: '20260603_100302_consent_log',
  },
  {
    up: migration_20260603_120148_add_partner_applications.up,
    down: migration_20260603_120148_add_partner_applications.down,
    name: '20260603_120148_add_partner_applications',
  },
  {
    up: migration_20260604_045219_add_guide_journey_nav.up,
    down: migration_20260604_045219_add_guide_journey_nav.down,
    name: '20260604_045219_add_guide_journey_nav',
  },
  {
    up: migration_20260604_052913_add_job_experience_range.up,
    down: migration_20260604_052913_add_job_experience_range.down,
    name: '20260604_052913_add_job_experience_range',
  },
  {
    up: migration_20260604_063039_add_application_extra_fields.up,
    down: migration_20260604_063039_add_application_extra_fields.down,
    name: '20260604_063039_add_application_extra_fields',
  },
  {
    up: migration_20260605_094837_add_legal_documents.up,
    down: migration_20260605_094837_add_legal_documents.down,
    name: '20260605_094837_add_legal_documents',
  },
  {
    up: migration_20260608_114736_add_news_featured.up,
    down: migration_20260608_114736_add_news_featured.down,
    name: '20260608_114736_add_news_featured',
  },
  {
    up: migration_20260608_121245_add_event_country.up,
    down: migration_20260608_121245_add_event_country.down,
    name: '20260608_121245_add_event_country',
  },
  {
    up: migration_20260608_140513_add_news_region.up,
    down: migration_20260608_140513_add_news_region.down,
    name: '20260608_140513_add_news_region',
  },
  {
    up: migration_20260608_144837_add_kb_category_display_order.up,
    down: migration_20260608_144837_add_kb_category_display_order.down,
    name: '20260608_144837_add_kb_category_display_order',
  },
  {
    up: migration_20260608_153417_add_kb_video_url.up,
    down: migration_20260608_153417_add_kb_video_url.down,
    name: '20260608_153417_add_kb_video_url',
  },
  {
    up: migration_20260610_085422_add_users_api_key.up,
    down: migration_20260610_085422_add_users_api_key.down,
    name: '20260610_085422_add_users_api_key',
  },
  {
    up: migration_20260611_061406_add_seo_keywords.up,
    down: migration_20260611_061406_add_seo_keywords.down,
    name: '20260611_061406_add_seo_keywords',
  },
  {
    up: migration_20260619_120000_fix_kb_internal_links.up,
    down: migration_20260619_120000_fix_kb_internal_links.down,
    name: '20260619_120000_fix_kb_internal_links',
  },
  {
    up: migration_20260619_130000_unlink_broken_blog_guide_links.up,
    down: migration_20260619_130000_unlink_broken_blog_guide_links.down,
    name: '20260619_130000_unlink_broken_blog_guide_links',
  },
  {
    up: migration_20260619_140000_unlink_broken_kb_links.up,
    down: migration_20260619_140000_unlink_broken_kb_links.down,
    name: '20260619_140000_unlink_broken_kb_links',
  },
  {
    up: migration_20260619_150000_add_impact_stats_global.up,
    down: migration_20260619_150000_add_impact_stats_global.down,
    name: '20260619_150000_add_impact_stats_global',
  },
  {
    up: migration_20260622_065936_add_page_registry.up,
    down: migration_20260622_065936_add_page_registry.down,
    name: '20260622_065936_add_page_registry'
  },
  {
    up: migration_20260622_071500_add_seo_role.up,
    down: migration_20260622_071500_add_seo_role.down,
    name: '20260622_071500_add_seo_role',
  },
  {
    up: migration_20260622_130000_change_news_region_values.up,
    down: migration_20260622_130000_change_news_region_values.down,
    name: '20260622_130000_change_news_region_values',
  },
  {
    up: migration_20260622_170000_add_page_registry_order.up,
    down: migration_20260622_170000_add_page_registry_order.down,
    name: '20260622_170000_add_page_registry_order',
  },
  {
    up: migration_20260622_180000_add_page_registry_schema_history.up,
    down: migration_20260622_180000_add_page_registry_schema_history.down,
    name: '20260622_180000_add_page_registry_schema_history',
  },
  {
    up: migration_20260622_190000_add_page_registry_web_page_type.up,
    down: migration_20260622_190000_add_page_registry_web_page_type.down,
    name: '20260622_190000_add_page_registry_web_page_type',
  },
  {
    up: migration_20260622_200000_add_seo_schema_history.up,
    down: migration_20260622_200000_add_seo_schema_history.down,
    name: '20260622_200000_add_seo_schema_history',
  },
  {
    up: migration_20260622_210000_add_seo_defaults_additional_schema.up,
    down: migration_20260622_210000_add_seo_defaults_additional_schema.down,
    name: '20260622_210000_add_seo_defaults_additional_schema',
  },
  {
    up: migration_20260622_220000_remove_podcast_page_global.up,
    down: migration_20260622_220000_remove_podcast_page_global.down,
    name: '20260622_220000_remove_podcast_page_global',
  },
  {
    up: migration_20260622_230000_add_seo_defaults_organization_fields.up,
    down: migration_20260622_230000_add_seo_defaults_organization_fields.down,
    name: '20260622_230000_add_seo_defaults_organization_fields',
  },
  {
    up: migration_20260622_240000_retire_dead_globals_and_fields.up,
    down: migration_20260622_240000_retire_dead_globals_and_fields.down,
    name: '20260622_240000_retire_dead_globals_and_fields',
  },
  {
    up: migration_20260622_250000_merge_spotlights.up,
    down: migration_20260622_250000_merge_spotlights.down,
    name: '20260622_250000_merge_spotlights',
  },
  {
    up: migration_20260622_260000_drop_seo_defaults_brand_icons.up,
    down: migration_20260622_260000_drop_seo_defaults_brand_icons.down,
    name: '20260622_260000_drop_seo_defaults_brand_icons',
  },
  {
    up: migration_20260622_270000_drop_site_settings_timezone.up,
    down: migration_20260622_270000_drop_site_settings_timezone.down,
    name: '20260622_270000_drop_site_settings_timezone',
  },
  {
    up: migration_20260623_120000_add_deal_registrations.up,
    down: migration_20260623_120000_add_deal_registrations.down,
    name: '20260623_120000_add_deal_registrations',
  },
  {
    up: migration_20260623_140000_add_forms_hubspot_subscription_type_id.up,
    down: migration_20260623_140000_add_forms_hubspot_subscription_type_id.down,
    name: '20260623_140000_add_forms_hubspot_subscription_type_id',
  },
];
