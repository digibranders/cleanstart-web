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
    name: '20260608_153417_add_kb_video_url'
  },
];
