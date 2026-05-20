import * as migration_20260512_120000_baseline from './20260512_120000_baseline';
import * as migration_20260513_130527 from './20260513_130527';
import * as migration_20260514_075832 from './20260514_075832';
import * as migration_20260514_081531 from './20260514_081531';
import * as migration_20260514_135203_remove_resources_hero_image from './20260514_135203_remove_resources_hero_image';
import * as migration_20260515_100240_rename_webinars_region from './20260515_100240_rename_webinars_region';
import * as migration_20260515_180000_redirect_prefix_realignment from './20260515_180000_redirect_prefix_realignment';
import * as migration_20260515_200000_rename_resources_types from './20260515_200000_rename_resources_types';
import * as migration_20260519_120000_strip_html_from_text_fields from './20260519_120000_strip_html_from_text_fields';
import * as migration_20260519_140010_catchup_schema_drift from './20260519_140010_catchup_schema_drift';
import * as migration_20260520_044917_display_published_at from './20260520_044917_display_published_at';

export const migrations = [
  {
    up: migration_20260512_120000_baseline.up,
    down: migration_20260512_120000_baseline.down,
    name: '20260512_120000_baseline',
  },
  {
    up: migration_20260513_130527.up,
    down: migration_20260513_130527.down,
    name: '20260513_130527',
  },
  {
    up: migration_20260514_075832.up,
    down: migration_20260514_075832.down,
    name: '20260514_075832',
  },
  {
    up: migration_20260514_081531.up,
    down: migration_20260514_081531.down,
    name: '20260514_081531',
  },
  {
    up: migration_20260514_135203_remove_resources_hero_image.up,
    down: migration_20260514_135203_remove_resources_hero_image.down,
    name: '20260514_135203_remove_resources_hero_image',
  },
  {
    up: migration_20260515_100240_rename_webinars_region.up,
    down: migration_20260515_100240_rename_webinars_region.down,
    name: '20260515_100240_rename_webinars_region',
  },
  {
    up: migration_20260515_180000_redirect_prefix_realignment.up,
    down: migration_20260515_180000_redirect_prefix_realignment.down,
    name: '20260515_180000_redirect_prefix_realignment',
  },
  {
    up: migration_20260515_200000_rename_resources_types.up,
    down: migration_20260515_200000_rename_resources_types.down,
    name: '20260515_200000_rename_resources_types',
  },
  {
    up: migration_20260519_120000_strip_html_from_text_fields.up,
    down: migration_20260519_120000_strip_html_from_text_fields.down,
    name: '20260519_120000_strip_html_from_text_fields',
  },
  {
    up: migration_20260519_140010_catchup_schema_drift.up,
    down: migration_20260519_140010_catchup_schema_drift.down,
    name: '20260519_140010_catchup_schema_drift',
  },
  {
    up: migration_20260520_044917_display_published_at.up,
    down: migration_20260520_044917_display_published_at.down,
    name: '20260520_044917_display_published_at'
  },
];
