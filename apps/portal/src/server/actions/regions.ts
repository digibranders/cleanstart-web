'use server';

import { z } from 'zod';
import { ROUTES } from '@/lib/routes';
import type { RegionDto } from '@/lib/regions';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { addRegion, listRegions, moveRegion, renameRegion, setRegionActive } from '@/server/repo/regions';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const keySchema = z.string().trim().min(2).max(32);
const addSchema = z.object({ name: z.string().max(200) });
const renameSchema = z.object({ key: keySchema, name: z.string().max(200) });
const moveSchema = z.object({ key: keySchema, direction: z.enum(['up', 'down']) });
const activeSchema = z.object({ key: keySchema, active: z.boolean() });

export async function addRegionAction(raw: unknown): Promise<ActionResult<RegionDto>> {
  return runViewerAction({ name: 'region.add', schema: addSchema }, raw, async (ctx, input): Promise<RegionDto> => {
    assertCan(ctx.viewer, 'region.manage');
    const added = await withViewer(ctx.viewer, async (tx) => {
      const region = await addRegion(tx, ctx.viewer, input);
      await recordAudit(tx, ctx.viewer, { event: 'region.added', target: region.name, note: `Key ${region.key}.` });
      return region;
    });
    ctx.revalidate(ROUTES.admin.regions);
    return added;
  });
}

export async function renameRegionAction(raw: unknown): Promise<ActionResult<RegionDto>> {
  return runViewerAction({ name: 'region.rename', schema: renameSchema }, raw, async (ctx, input): Promise<RegionDto> => {
    assertCan(ctx.viewer, 'region.manage');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const { before, after } = await renameRegion(tx, ctx.viewer, input);
      if (before.name !== after.name) await recordAudit(tx, ctx.viewer, { event: 'region.renamed', target: after.name, note: `${before.name} to ${after.name}.` });
      return after;
    });
    ctx.revalidate(ROUTES.admin.regions);
    return done;
  });
}

export async function moveRegionAction(raw: unknown): Promise<ActionResult<RegionDto[]>> {
  return runViewerAction({ name: 'region.move', schema: moveSchema }, raw, async (ctx, input): Promise<RegionDto[]> => {
    assertCan(ctx.viewer, 'region.manage');
    const list = await withViewer(ctx.viewer, async (tx) => {
      const before = (await listRegions(tx)).map((r) => r.key);
      const after = await moveRegion(tx, ctx.viewer, input);
      if (before.join() !== after.map((r) => r.key).join()) {
        const name = after.find((r) => r.key === input.key)?.name ?? input.key;
        await recordAudit(tx, ctx.viewer, { event: 'region.reordered', target: name, note: `Moved ${input.direction}.` });
      }
      return after;
    });
    ctx.revalidate(ROUTES.admin.regions);
    return list;
  });
}

export async function setRegionActiveAction(raw: unknown): Promise<ActionResult<RegionDto>> {
  return runViewerAction({ name: 'region.set_active', schema: activeSchema }, raw, async (ctx, input): Promise<RegionDto> => {
    assertCan(ctx.viewer, 'region.manage');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const region = await setRegionActive(tx, ctx.viewer, input);
      await recordAudit(tx, ctx.viewer, { event: input.active ? 'region.reactivated' : 'region.deactivated', target: region.name });
      return region;
    });
    ctx.revalidate(ROUTES.admin.regions);
    return done;
  });
}
