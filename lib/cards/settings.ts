import { defaultPaper } from './print-layout.ts';

export type ScheduleTable = { columns: string[]; rowCount: number; rows: string[][] };

export const kopFields = ['institution', 'exam', 'year', 'address'] as const;
export type KopField = (typeof kopFields)[number];
export const kopSizes = [6, 6.5, 7, 7.5, 8, 9, 10, 11, 12, 14] as const;

export const defaultCard = {
  institution: '',
  exam: '',
  year: '',
  address: '',
  city: '',
  date: '',
  signer: '',
  nip: '',
  kopStyles: {
    institution: { size: 10, bold: true, italic: false },
    exam: { size: 7.5, bold: true, italic: false },
    year: { size: 6.5, bold: false, italic: false },
    address: { size: 6.5, bold: false, italic: false },
  },
  signatureSize: 0.8,
  signatureOverlap: false,
  paper: defaultPaper,
  width: 86,
  height: 54,
  fontSize: 7,
  align: 'left' as 'left' | 'center' | 'right',
  monochrome: false,
  photo: true,
  qr: false,
  schedule: '',
  scheduleTable: null as ScheduleTable | null,
  showSchedule: true,
};
export type CardSettings = typeof defaultCard;
export type AssetName = 'logoLeft' | 'logoRight' | 'signature';
export type InstitutionAssets = Partial<Record<AssetName, Blob>>;

export function validCardLayout({ width, height, fontSize }: CardSettings) {
  return width >= 60 && width <= 180 && height >= 40 && height <= 150 && fontSize >= 6 && fontSize <= 12;
}
