/**
 * Minimal XLSX workbook writer built on `exceljs`. Mirrors `toCsv`'s
 * signature (headers + row objects in, serialized bytes out) so the
 * export endpoint can call either with the same call shape.
 *
 * Every non-numeric, non-boolean cell is forced to exceljs's explicit
 * string type so a value like `=SUM(A1:A9)` lands in the sheet as
 * literal text, never a live formula (same intent as `lib/csv.ts`'s
 * formula-injection guard, enforced here at the cell-type level instead
 * of a leading single-quote since XLSX has a real string cell type).
 */
import ExcelJS from 'exceljs';

export const toXlsx = async (
  headers: readonly string[],
  rows: readonly Record<string, unknown>[],
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');

  sheet.addRow([...headers]);

  for (const row of rows) {
    const values = headers.map((h) => row[h]);
    const addedRow = sheet.addRow(values);

    headers.forEach((h, index) => {
      const value = row[h];
      if (value == null || typeof value === 'number' || typeof value === 'boolean') return;
      const cell = addedRow.getCell(index + 1);
      cell.value = String(value);
      cell.numFmt = '@';
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};
