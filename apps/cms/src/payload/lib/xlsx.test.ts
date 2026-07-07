import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import { toXlsx } from './xlsx';

describe('toXlsx', () => {
  it('writes a header row plus one row per record, readable back via exceljs', async () => {
    const buffer = await toXlsx(['id', 'title'], [
      { id: 1, title: 'First' },
      { id: 2, title: 'Second' },
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const [sheet] = workbook.worksheets;
    if (!sheet) throw new Error('expected worksheet to exist');

    expect(sheet.getRow(1).getCell(1).value).toBe('id');
    expect(sheet.getRow(1).getCell(2).value).toBe('title');
    expect(sheet.getRow(2).getCell(1).value).toBe(1);
    expect(sheet.getRow(2).getCell(2).value).toBe('First');
    expect(sheet.getRow(3).getCell(2).value).toBe('Second');
  });

  it('writes a missing key as an empty cell', async () => {
    const buffer = await toXlsx(['id', 'title'], [{ id: 1 }]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const [sheet] = workbook.worksheets;
    if (!sheet) throw new Error('expected worksheet to exist');
    expect(sheet.getRow(2).getCell(2).value).toBeNull();
  });

  it('writes a formula-injection payload as a literal string, not a formula', async () => {
    const buffer = await toXlsx(['note'], [{ note: '=cmd|"/c calc"!A1' }]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const [sheet] = workbook.worksheets;
    if (!sheet) throw new Error('expected worksheet to exist');
    const cell = sheet.getRow(2).getCell(1);
    expect(cell.type).not.toBe(ExcelJS.ValueType.Formula);
    expect(String(cell.value)).toContain('=cmd');
  });
});
