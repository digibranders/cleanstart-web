import * as migration_20260512_add_integrations from './20260512_add_integrations';

export const migrations = [
  {
    up: migration_20260512_add_integrations.up,
    down: migration_20260512_add_integrations.down,
    name: '20260512_add_integrations'
  },
];
