export const defaultCard = {
  institution: '',
  exam: '',
  year: '',
  address: '',
  city: '',
  date: '',
  signer: '',
  nip: '',
  width: 86,
  height: 54,
  fontSize: 7,
  align: 'left' as 'left' | 'center' | 'right',
  monochrome: false,
  photo: true,
  qr: false,
  schedule: '',
  showSchedule: true,
};
export type CardSettings = typeof defaultCard;
export type AssetName = 'logoLeft' | 'logoRight' | 'signature';
export type InstitutionAssets = Partial<Record<AssetName, Blob>>;
