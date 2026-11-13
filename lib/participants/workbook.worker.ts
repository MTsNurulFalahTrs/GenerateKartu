import type { Field } from './model';
import { createTemplate, inspectWorkbook, readSheet } from './workbook';

export type WorkbookRequest =
  | { action: 'inspect'; file: File }
  | { action: 'read'; sheet: string }
  | { action: 'template'; format: number; custom: readonly Field[]; excelHeaders?: Partial<Record<Field, string>> };

let bytes: ArrayBuffer | undefined;
let names: string[] = [];
self.onmessage = async ({ data }: MessageEvent<WorkbookRequest>) => {
  try {
    if (data.action === 'template') {
      const template = createTemplate(data.format, data.custom, data.excelHeaders);
      self.postMessage({ action: 'template', template }, { transfer: [template] });
    } else if (data.action === 'inspect') {
      const candidate = await data.file.arrayBuffer();
      names = await inspectWorkbook(candidate, data.file.name);
      bytes = candidate;
      self.postMessage({ action: 'inspect', names });
    } else {
      if (!bytes || !names.includes(data.sheet)) throw new Error('Pilih sheet yang tersedia.');
      self.postMessage({ action: 'read', input: readSheet(bytes, data.sheet) });
    }
  } catch (error) {
    self.postMessage({ action: 'error', message: error instanceof Error ? error.message : 'Workbook gagal diproses.' });
  }
};
