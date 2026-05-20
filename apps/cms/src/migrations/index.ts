import * as migration_20260520_061605_baseline from './20260520_061605_baseline';

export const migrations = [
  {
    up: migration_20260520_061605_baseline.up,
    down: migration_20260520_061605_baseline.down,
    name: '20260520_061605_baseline'
  },
];
