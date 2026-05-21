import * as migration_20260520_061605_baseline from './20260520_061605_baseline';
import * as migration_20260521_050509_add_blog_journey_fields from './20260521_050509_add_blog_journey_fields';

export const migrations = [
  {
    up: migration_20260520_061605_baseline.up,
    down: migration_20260520_061605_baseline.down,
    name: '20260520_061605_baseline',
  },
  {
    up: migration_20260521_050509_add_blog_journey_fields.up,
    down: migration_20260521_050509_add_blog_journey_fields.down,
    name: '20260521_050509_add_blog_journey_fields'
  },
];
