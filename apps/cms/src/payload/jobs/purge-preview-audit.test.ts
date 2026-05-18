import { describe, expect, it, vi } from 'vitest';

import * as lib from '../lib/retention/purge-preview-audit';
import { purgePreviewAuditTask } from './purge-preview-audit';

const handler = purgePreviewAuditTask.handler as (args: unknown) => Promise<unknown>;

describe('purgePreviewAuditTask', () => {
  it('is configured with daily 03:30 UTC schedule', () => {
    expect(purgePreviewAuditTask.slug).toBe('purgePreviewAudit');
    expect(purgePreviewAuditTask.retries).toBe(0);
    expect(purgePreviewAuditTask.schedule?.[0]).toEqual(
      expect.objectContaining({ cron: '30 3 * * *', queue: 'previewAuditPurge' }),
    );
  });

  it('delegates to purgePreviewAudit and wraps result in `output`', async () => {
    const spy = vi
      .spyOn(lib, 'purgePreviewAudit')
      .mockResolvedValueOnce({ scanned: 5, deleted: 5, errors: 0 } as never);
    const fakePayload = {};
    const result = await handler({ req: { payload: fakePayload } } as never);
    expect(spy).toHaveBeenCalledWith(fakePayload);
    expect(result).toEqual({ output: { scanned: 5, deleted: 5, errors: 0 } });
    spy.mockRestore();
  });
});
