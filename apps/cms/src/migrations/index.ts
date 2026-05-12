import * as migration_20260512_133421_baseline from './20260512_133421_baseline';

export const migrations = [
  {
    up: migration_20260512_133421_baseline.up,
    down: migration_20260512_133421_baseline.down,
    name: '20260512_133421_baseline'
  },
];
