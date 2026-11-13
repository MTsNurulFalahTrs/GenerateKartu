import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { utils, write } from 'xlsx';
import { PDFDocument, PDFName as pdfName } from 'pdf-lib';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import axe from 'axe-core';
import { execFileSync } from 'node:child_process';

const origin = process.env.SMOKE_ORIGIN ?? 'http://127.0.0.1:3000';
const output = process.env.SMOKE_SCREENSHOTS;

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if ((await fetch(origin)).ok) return;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Server did not become ready');
}

await waitForServer();
if (output) await mkdir(output, { recursive: true });
const fixtureDir = await mkdtemp(join(tmpdir(), 'generate-kartu-excel-'));
async function fixture(name, ids) {
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.aoa_to_sheet([['Petunjuk']]), 'Petunjuk');
  utils.book_append_sheet(book, utils.aoa_to_sheet([
    ['NoPeserta', 'NISN', 'NamaMurid', 'Kelas', 'Ruang'],
    ...ids.map((id, index) => [id, '0000000123', 'Peserta Uji ' + index, index < 10 ? 'IX-A' : 'IX-B', index < 60 ? 'Ruang 60' : index < 192 ? 'Ruang 132' : 'Ruang 3']),
  ]), 'Peserta');
  const file = join(fixtureDir, name);
  await writeFile(file, write(book, { type: 'buffer', bookType: 'xlsx', compression: true }));
  return file;
}
const valid = await fixture('valid.xlsx', Array.from({ length: 500 }, (_, index) => String(index + 1).padStart(4, '0')));
const duplicate = await fixture('duplikat.xlsx', ['0001', '0001']);
const photo = join(fixtureDir, '0001.png');
await writeFile(photo, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGNkYPjPQApgIkn1qIZRDUNKAwA+MAEfWiW9ygAAAABJRU5ErkJggg==', 'base64'));
const archive = join(fixtureDir, 'foto.zip');
const photoNames = Array.from({ length: 20 }, (_, index) => String(index + 1).padStart(4, '0') + '.png');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGNkYPjPQApgIkn1qIZRDUNKAwA+MAEfWiW9ygAAAABJRU5ErkJggg==', 'base64');
await Promise.all(photoNames.map((name) => writeFile(join(fixtureDir, name), png)));
execFileSync('zip', ['-q', archive, ...photoNames], { cwd: fixtureDir });
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: chromium.args,
  headless: 'shell',
});

try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    const errors = [];
    const externalRequests = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (['http:', 'https:'].includes(url.protocol) &&
        (url.origin !== new URL(origin).origin || request.method() !== 'GET' || /Peserta(?:%20|\+)Uji|Madrasah(?:%20|\+)Uji/i.test(url.href))) {
        externalRequests.push({ origin: url.origin, method: request.method() });
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (entry) => {
      if (entry.type() === 'error') errors.push(entry.text());
    });
    try {
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: name === 'mobile', hasTouch: name === 'mobile' });
      const home = await page.goto(origin, { waitUntil: 'networkidle0' });
      assert.equal(home?.status(), 200);
      const headers = home.headers();
      assert.equal(headers['x-content-type-options'], 'nosniff');
      assert.equal(headers['x-frame-options'], 'DENY');
      assert.equal(headers['referrer-policy'], 'no-referrer');
      assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
      assert.equal(await page.locator('h1').map((el) => el.textContent).wait(), 'Pilih Format Kartu');
      assert.equal(await page.$$eval('.format-grid article', (cards) => cards.length), 8);
      await page.waitForSelector('#pick-format-1[aria-pressed="true"]');
      if (output) await page.screenshot({ path: `${output}/format-awal-${name}.png` });
      const searchFormats = 'input[aria-label="Cari format"]';
      await page.locator(searchFormats).fill('Lengkap');
      await page.waitForFunction(() => document.querySelectorAll('.format-grid article').length === 1);
      await page.focus(searchFormats);
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.waitForFunction(() => document.querySelectorAll('.format-grid article').length === 8);
      const trigger = 'button[aria-label="Preview Format 2"]';
      await page.locator(trigger).click();
      await page.waitForSelector('.format-dialog[open] .exam-card');
      assert.equal(await page.$eval('#format-preview-title', (el) => el.textContent), 'Preview: Format 2');
      assert.match(await page.$eval('.format-dialog dl', (el) => el.textContent), /NISN/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      if (output) await page.screenshot({ path: `${output}/format-preview-${name}.png` });
      await page.keyboard.press('Escape');
      await page.waitForFunction((selector) => document.activeElement?.matches(selector), {}, trigger);
      assert.equal(await page.$eval('#pick-format-1', (el) => el.getAttribute('aria-pressed')), 'true');
      await page.locator(trigger).click();
      await page.locator('.format-close').click();
      await page.waitForFunction(() => !document.querySelector('.format-dialog[open]'));
      await page.locator('#pick-format-2').click();
      await page.waitForSelector('#pick-format-2[aria-pressed="true"]');
      await page.focus('#step-0');
      await page.keyboard.press('ArrowRight');
      await page.waitForSelector('#step-1[aria-selected="true"]');
      await page.waitForSelector('#panel-1 .data-locked', { visible: true });
      assert.equal(await page.$('#panel-1 input[accept=".zip"]'), null);
      assert.match(await page.$eval('#panel-1 .data-preview', (panel) => panel.textContent), /0 Murid.*Status Foto.*Data belum tersedia/s);
      if (output) await page.screenshot({ path: `${output}/data-murid-awal-${name}.png`, fullPage: true });
      const fileInput = await page.$('input[type="file"]');
      assert.ok(fileInput);
      for (const file of [valid, duplicate]) {
        await fileInput.uploadFile(file);
        await page.waitForFunction(() => {
          const sheet = document.querySelector('#participant-sheet');
          return sheet && !sheet.disabled && sheet.value === 'Petunjuk';
        });
        await page.select('#participant-sheet', 'Peserta');
        await page.waitForFunction((count) => document.querySelector('#panel-1')?.textContent.includes('Pratinjau impor · ' + count + ' baris'), {}, file === valid ? 500 : 2);
        if (file === valid) {
          await page.waitForSelector('#apply-participant-import:enabled');
          await page.focus('#apply-participant-import');
          await page.keyboard.press('Space');
          await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('500 terpilih'));
          await page.locator('input[placeholder="Nama atau ID"]').fill('0002');
          await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('1 cocok'));
        } else {
          await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('Gunakan ID unik'));
          assert.equal(await page.$eval('#apply-participant-import', (button) => button.disabled), true);
          assert.match(await page.$eval('#panel-1', (panel) => panel.textContent), /500 peserta/);
        }
      }
      const photoInput = await page.$('#panel-1 input[accept="image/png,image/jpeg"]');
      assert.ok(photoInput);
      await photoInput.uploadFile(photo);
      await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('1 foto diterapkan'));
      if (name === 'desktop') {
        const zipInput = await page.$('#panel-1 input[accept=".zip"]');
        assert.ok(zipInput);
        const zipStart = performance.now();
        await zipInput.uploadFile(archive);
        await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('20 foto diterapkan'));
        await page.waitForFunction(() => document.querySelector('.data-preview tbody')?.textContent.includes('Tersedia'));
        const heap = (await page.metrics()).JSHeapUsedSize / 1048576;
        console.log(`Impor ZIP 20 foto: ${Math.round(performance.now() - zipStart)} ms; heap JS ${heap.toFixed(1)} MiB`);
      }
      await page.$eval('#step-2', (button) => button.click());
      await page.waitForSelector('#panel-2', { visible: true });
      await page.locator('#kop-institution').fill('Madrasah Uji Fase 7');
      await page.waitForFunction(() => document.querySelector('.kop-live')?.textContent.includes('Madrasah Uji Fase 7'));
      await page.select('select[aria-label="Ukuran teks Nama Lembaga"]', '12');
      await page.locator('button[aria-label="Miring Nama Lembaga"]').click();
      const signatureInput = await page.$('input[aria-label="Upload Tanda Tangan"]');
      assert.ok(signatureInput);
      await signatureInput.uploadFile(photo);
      await page.waitForSelector('.kop-asset-image img[alt="Tanda Tangan Digital (opsional)"]');
      await page.locator('.kop-signature button:nth-child(3)').click();
      await page.locator('.kop-signature input[role="switch"]').click();
      await page.locator('.kop-save').click();
      await page.waitForFunction(() => document.querySelector('.kop-page-meta [role=status]')?.textContent === 'Disimpan');
      const savedAppearance = await page.evaluate(() => JSON.parse(localStorage.getItem('generate-kartu:preferences:v1')).settings);
      assert.deepEqual(savedAppearance.kopStyles.institution, { size: 12, bold: true, italic: true });
      assert.equal(savedAppearance.signatureSize, 1.2);
      assert.equal(savedAppearance.signatureOverlap, true);
      await page.$eval('#card-settings-1', (button) => button.click());
      await page.waitForSelector('#card-settings-1[aria-pressed=true]');
      assert.equal(await page.$eval('#layout-card-size', (el) => el.value), '86x54');
      assert.equal(await page.$eval('#layout-printer-mode', (el) => el.value), 'color');
      await page.select('#layout-card-size', 'custom');
      await page.waitForSelector('.layout-custom-dimensions input');
      assert.equal(await page.$eval('#layout-card-size', (el) => el.value), 'custom');
      await page.select('#layout-card-size', '86x54');
      await page.select('#layout-printer-mode', 'mono');
      assert.equal(await page.$eval('#layout-printer-mode', (el) => el.value), 'mono');
      await page.select('#layout-printer-mode', 'color');
      assert.equal(await page.$eval('#layout-printer-mode', (el) => el.value), 'color');
      assert.equal(await page.$eval('#layout-showSchedule', (el) => el.getAttribute('role')), 'switch');
      assert.ok(await page.$eval('.layout-print-tips', (el) => el.textContent.includes('100%')));
      await page.waitForSelector('#panel-2 img[alt="Foto peserta"]');
      await page.evaluate(() => {
        const input = [...document.querySelectorAll('#panel-2 input[type=checkbox]')].find((element) => element.labels?.[0]?.textContent.includes('Tampilkan QR'));
        if (!input) throw new Error('Toggle QR hilang');
        input.click();
      });
      await page.waitForSelector('#panel-2 svg[aria-label="QR referensi kartu"]');
      await page.$eval('#card-settings-2', (button) => button.click());
      await page.waitForSelector('#card-settings-2[aria-pressed=true]');
      await page.$eval('#step-3', (button) => button.click());
      await page.waitForSelector('#panel-3', { visible: true });
      assert.match(await page.locator('#panel-3').map((el) => el.textContent).wait(), /Lengkap Ruang/);
      assert.equal(await page.$$eval('#panel-3 .exam-card', (cards) => cards.length), 9);
      assert.match(await page.$eval('#panel-3 [role=status]', (status) => status.textContent), /500 dari 500/);
      assert.equal(await page.$eval('#panel-3 .exam-card-head > div:nth-child(2) > div', (line) => getComputedStyle(line).fontStyle), 'italic');
      assert.equal(await page.$eval('#panel-3 .exam-card-signature', (signature) => signature.style.height), '1.2cm');
      assert.equal(await page.$eval('#panel-3 .exam-card-signature', (signature) => getComputedStyle(signature).position), 'absolute');
      const qr = await page.$eval('#panel-3 .card-qr path', (path) => path.getAttribute('d'));
      await page.$eval('#panel-3 nav button:last-child', (button) => button.click());
      await page.waitForFunction(() => document.querySelector('#panel-3 [role=status]')?.textContent.includes('Halaman 2/56'));
      await page.$eval('#panel-3 nav button:first-child', (button) => button.click());
      await page.waitForFunction(() => document.querySelector('#panel-3 [role=status]')?.textContent.includes('Halaman 1/56'));
      assert.equal(await page.$eval('#panel-3 .card-qr path', (path) => path.getAttribute('d')), qr);
      await page.locator('#panel-3 input[placeholder="Nama atau ID peserta"]').fill('0002');
      await page.waitForFunction(() => document.querySelector('#panel-3 [role=status]')?.textContent.includes('1 dari 500'));
      assert.equal(await page.$$eval('#panel-3 .exam-card', (cards) => cards.length), 1);
      await page.locator('#panel-3 input[placeholder="Nama atau ID peserta"]').fill('tidak ditemukan');
      await page.waitForFunction(() => document.querySelector('#panel-3 [role=status]')?.textContent.includes('0 dari 500'));
      assert.equal(await page.$$eval('#panel-3 .exam-card', (cards) => cards.length), 0);
      await page.$eval('#panel-3 input', (input) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForFunction(() => document.querySelector('#panel-3 [role=status]')?.textContent.includes('500 dari 500'));
      if (name === 'desktop') {
        for (const [w, h] of [[320, 700], [844, 390], [768, 1024], [1440, 1000]]) {
          await page.setViewport({ width: w, height: h });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${w}x${h}`);
        }
        await page.evaluate(axe.source);
        for (const index of [0, 1, 2, 3]) {
          await page.$eval(`#step-${index}`, (button) => button.click());
          await page.waitForSelector(`#panel-${index}`, { visible: true });
          const violations = await page.evaluate(async () => (await window.axe.run({
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          })).violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })));
          assert.deepEqual(violations, [], `Axe panel ${index}`);
        }
        await page.setOfflineMode(true);
        await page.select('#preview-Ruang', 'Ruang 60');
        await page.waitForFunction(() => document.querySelector('#panel-3 [role=status]')?.textContent.includes('60 dari 500'));
        await page.setOfflineMode(false);
        for (const count of [60, 132, 500]) {
          const start = performance.now();
          await page.select('#preview-Ruang', count === 500 ? '' : `Ruang ${count}`);
          await page.waitForFunction((total) => document.querySelector('#panel-3 [role=status]')?.textContent.includes(`${total} dari 500`), {}, count);
          assert.equal(await page.$$eval('#panel-3 .exam-card', (cards) => cards.length), 9);
          const heap = (await page.metrics()).JSHeapUsedSize / 1048576;
          console.log(`Preview ${count} peserta: ${Math.round(performance.now() - start)} ms; heap JS ${heap.toFixed(1)} MiB`);
        }
        await page.evaluate(() => {
          const add = window.addEventListener.bind(window);
          window.addEventListener = (type, listener, options) => {
            if (type === 'afterprint') window.finishPrint = listener;
            else add(type, listener, options);
          };
          window.print = () => {
            const pages = [...document.querySelectorAll('.print-sheet')];
            window.printEvidence = {
              active: document.body.classList.contains('card-print-ready'),
              counts: pages.map((page) => page.querySelectorAll('.exam-card').length),
              names: pages.flatMap((page) => [...page.querySelectorAll('.exam-card')].map((card) => card.getAttribute('aria-label'))),
            };
          };
          const click = HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click = function () {
            if (this.download !== 'kartu-peserta-ujian.pdf') return click.call(this);
            window.pdfEvidence = fetch(this.href).then((response) => response.arrayBuffer()).then((bytes) => [...new Uint8Array(bytes)]);
          };
        });
        const printStart = performance.now();
        await page.$eval('#print-cards', (button) => button.click());
        await page.waitForFunction(() => window.printEvidence);
        const printed = await page.evaluate(() => window.printEvidence);
        assert.equal(printed.active, true);
        assert.equal(printed.counts.length, 56);
        assert.deepEqual(printed.counts.slice(-2), [9, 5]);
        assert.deepEqual(printed.names, Array.from({ length: 500 }, (_, index) => 'Kartu ujian Peserta Uji ' + index));
        const browserPdf = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
        assert.equal(browserPdf.getPageCount(), 56);
        const heap = (await page.metrics()).JSHeapUsedSize / 1048576;
        console.log(`Cetak 500 kartu: ${Math.round(performance.now() - printStart)} ms; heap JS ${heap.toFixed(1)} MiB`);
        await page.evaluate(() => window.finishPrint());
        await page.select('#preview-Kelas', 'IX-A');
        await page.waitForFunction(() => document.querySelector('#panel-3 [role=status]')?.textContent.includes('10 dari 500'));
        await page.waitForSelector('#download-card-pdf:enabled');
        const pdfStart = performance.now();
        await page.$eval('#download-card-pdf', (button) => button.click());
        await page.waitForFunction(() => window.pdfEvidence, { timeout: 60000 });
        const bytes = await page.evaluate(() => window.pdfEvidence);
        const pdf = await PDFDocument.load(new Uint8Array(bytes));
        console.log(`PDF 10 kartu: ${Math.round(performance.now() - pdfStart)} ms; ${bytes.length} byte`);
        assert.equal(pdf.getPageCount(), 2);
        assert.deepEqual(pdf.getPages().map((sheet) => sheet.node.Resources().lookup(pdfName.of('XObject')).keys().length), [9, 1]);
        assert.ok(Math.abs(pdf.getPage(0).getWidth() * 25.4 / 72 - 297) < 0.1);
        await page.$eval('#panel-3 input', (input) => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
      for (let format = 1; format <= 7; format++) {
        await page.$eval('#step-0', (button) => button.click());
        await page.waitForSelector('#panel-0', { visible: true });
        await page.$eval(`#pick-format-${format}`, (button) => button.click());
        await page.$eval('#step-3', (button) => button.click());
        await page.waitForSelector('#panel-3', { visible: true });
        await page.waitForSelector('#panel-3 .exam-card');
        assert.ok(await page.$eval('#panel-3 .exam-card dl', (list) => list.children.length >= 4));
      }
      await page.$eval('#step-0', (button) => button.click());
      await page.waitForSelector('#panel-0', { visible: true });
      await page.$eval('#pick-custom-format', (button) => button.click());
      await page.$eval('#step-3', (button) => button.click());
      await page.waitForSelector('#panel-3', { visible: true });
      assert.equal(await page.$eval('#panel-3 .exam-card dl', (list) => list.children.length), 3);
      await page.locator('.theme').click();
      await page.waitForSelector('[data-theme="dark"]');
      await page.$eval('#step-0', (button) => button.click());
      await page.waitForSelector('#panel-0', { visible: true });
      await page.locator('.theme').click();
      await page.waitForSelector('[data-theme="light"]');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      if (output) await page.screenshot({ path: `${output}/format-${name}.jpg`, type: 'jpeg', quality: 65 });
      if (name === 'desktop') {
        const key = 'generate-kartu:preferences:v1';
        await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key))?.format === 7, {}, key);
        const stored = await page.evaluate((key) => localStorage.getItem(key), key);
        assert.doesNotMatch(stored, /Madrasah Uji Fase 7|Peserta Uji/);
        await page.reload({ waitUntil: 'networkidle0' });
        await page.waitForSelector('#pick-custom-format[aria-pressed=true]');
        await page.$eval('#step-2', (button) => button.click());
        await page.waitForSelector('#panel-2', { visible: true });
        const backupInput = await page.$('#panel-2 input[accept=".json,application/json"]');
        assert.ok(backupInput);
        const backupFile = join(fixtureDir, 'settings.json');
        await writeFile(backupFile, '{rusak');
        await backupInput.uploadFile(backupFile);
        await page.waitForFunction(() => document.querySelector('#panel-2 [role=alert]')?.textContent.includes('JSON rusak'));
        assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), stored);
        await page.evaluate(() => { window.confirm = () => true; });
        await writeFile(backupFile, JSON.stringify({ ...JSON.parse(stored), format: 1, heading: { institution: 'Madrasah Pulih', exam: '', year: '' } }));
        await backupInput.uploadFile(backupFile);
        await page.waitForFunction(() => document.querySelector('#kop-institution')?.value === 'Madrasah Pulih');
        await page.evaluate(() => {
          const time = Date.now();
          Date.now = () => time + 7200001;
          window.dispatchEvent(new Event('pageshow'));
        });
        await page.waitForFunction(() => document.querySelector('main > [role=status]')?.textContent.includes('Sesi kedaluwarsa'));
        await page.waitForFunction(() => document.querySelector('#kop-institution')?.value !== 'Madrasah Pulih');
        await page.$eval('#reset-card-session', (button) => button.click());
        await page.waitForFunction(() => document.querySelector('main > [role=status]')?.textContent.includes('direset'));
      }
      await page.locator('a[href="/bantuan"]').click();
      await page.waitForFunction(() => location.pathname === '/bantuan');
      assert.equal(await page.locator('h1').map((el) => el.textContent).wait(), 'Bantuan');
      assert.deepEqual(errors, []);
      assert.deepEqual(externalRequests, [], 'No external requests or HTTP uploads during editor flow');
      assert.equal((await page.goto(new URL('/halaman-tidak-ada', origin).href))?.status(), 404);
      assert.equal(await page.locator('h1').map((el) => el.textContent).wait(), 'Halaman tidak ditemukan');
      if (name === 'desktop') {
        await page.evaluateOnNewDocument(() => {
          Storage.prototype.setItem = () => { throw new DOMException('Simulasi kuota', 'QuotaExceededError'); };
        });
        await page.goto(origin, { waitUntil: 'networkidle0' });
        await page.$eval('#step-2', (button) => button.click());
        await page.waitForFunction(() => document.querySelector('#panel-2')?.textContent.includes('Penyimpanan browser penuh atau diblokir'));
        await page.$eval('.theme', (button) => button.click());
        await page.waitForSelector('[data-theme=dark]');
      }
      console.log(`Smoke ${name} ${width}x${height}: OK`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  await rm(fixtureDir, { recursive: true, force: true });
}
