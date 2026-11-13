export type OrderedExcelRow = { id: string; excel: string };

export function findDuplicateExcelColumns(rows: readonly OrderedExcelRow[]): Map<string, number[]> {
  const uses = new Map<string, number[]>();
  rows.forEach((row, index) => {
    const header = row.excel.trim().toLocaleLowerCase('id');
    if (header) uses.set(header, [...(uses.get(header) ?? []), index + 1]);
  });
  const duplicateRows = new Map<string, number[]>();
  rows.forEach((row) => {
    const matches = uses.get(row.excel.trim().toLocaleLowerCase('id'));
    if (matches && matches.length > 1) duplicateRows.set(row.id, matches);
  });
  return duplicateRows;
}
