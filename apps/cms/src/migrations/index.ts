import * as migration_20260512_120000_baseline from './20260512_120000_baseline';
import * as migration_20260513_130527 from './20260513_130527';
import * as migration_20260514_075832 from './20260514_075832';

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
    name: '20260514_075832'
  },
];
