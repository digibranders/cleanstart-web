import * as migration_20260602_050520_initial_baseline from './20260602_050520_initial_baseline';
import * as migration_20260602_095540_remove_brevo from './20260602_095540_remove_brevo';
import * as migration_20260602_115320_add_hubspot_form_guid from './20260602_115320_add_hubspot_form_guid';
import * as migration_20260603_081714_add_careers_collections from './20260603_081714_add_careers_collections';
import * as migration_20260603_092035_add_job_location_snapshot from './20260603_092035_add_job_location_snapshot';
import * as migration_20260603_095034_add_case_studies from './20260603_095034_add_case_studies';
import * as migration_20260603_100302_consent_log from './20260603_100302_consent_log';

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
    name: '20260603_100302_consent_log'
  },
];
