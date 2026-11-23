import type { DocumentType } from '@/lib/domain';
import { ALLOWED_DOCUMENT_TYPES, DOCUMENT_MAX_BYTES } from '@/server/files/rules';

/** Most files one drop or one pick may add. A longer list is cut and the form says so. */
export const MAX_FILES_PER_BATCH = 20;

const extensionOf = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.');
  return dot < 0 ? '' : fileName.slice(dot + 1).toLowerCase();
};

/** "Q4_pricing-guide.v2.pdf" becomes "Q4 pricing guide v2": the starting title for a dropped file. */
export function titleFromFileName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  return stem.replace(/[_.-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
}

export const defaultTypeFor = (fileName: string): DocumentType => (extensionOf(fileName) === 'mp4' ? 'video' : 'datasheet');

/** Why a file cannot join the batch, or null when it can. */
export function fileProblem(file: { name: string; size: number }): string | null {
  if (!ALLOWED_DOCUMENT_TYPES.some((type) => type.ext === extensionOf(file.name))) return `${file.name} is not a PDF, PPTX, DOCX, XLSX, MP4 or ZIP.`;
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > DOCUMENT_MAX_BYTES) return `${file.name} is over 100 MB.`;
  return null;
}

/** Splits a batch into the files that fit and the reasons for the rest (including files beyond `room`). */
export function sortBatch<T extends { name: string; size: number }>(files: readonly T[], room: number): { accepted: T[]; problems: string[] } {
  const accepted: T[] = [];
  const problems: string[] = [];
  for (const file of files) {
    const problem = fileProblem(file);
    if (problem) problems.push(problem);
    else if (accepted.length >= room) problems.push(`${file.name} was left out: at most ${MAX_FILES_PER_BATCH} files at a time.`);
    else accepted.push(file);
  }
  return { accepted, problems };
}
