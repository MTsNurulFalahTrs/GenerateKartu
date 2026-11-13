import QRCode from 'qrcode-terminal/vendor/QRCode/index.js';

export function newCardReference() {
  return `GK1:${crypto.randomUUID().replaceAll('-', '')}`;
}

export function qrPath(reference: string) {
  if (!/^GK1:[0-9a-f]{32}$/.test(reference)) throw new Error('Referensi kartu tidak valid.');
  const qr = new QRCode(3, 0);
  qr.addData(reference);
  qr.make();
  const size = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      if (qr.isDark(row, column)) path += `M${column + 4},${row + 4}h1v1h-1z`;
    }
  }
  return { size: size + 8, path };
}
