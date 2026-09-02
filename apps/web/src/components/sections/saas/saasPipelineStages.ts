/*
 * Shared between the server-rendered section (accessible ordered list) and the
 * client-rendered scene. Kept out of the 'use client' module: exports crossing
 * that boundary become client references, not values.
 */

export type StageId = 'code' | 'build' | 'test' | 'deploy' | 'review' | 'release';

export interface PipelineStage {
  readonly id: StageId;
  readonly label: string;
}

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  { id: 'code', label: 'Code' },
  { id: 'build', label: 'Build' },
  { id: 'test', label: 'Test' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'review', label: 'Security Review' },
  { id: 'release', label: 'Trusted Release' },
];

export const SOURCE_LABEL = 'Verified Components';
