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


async function dialogAction(page, selector, action = 'click', value = '') {
  return page.evaluate(({ selector, action, value }) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error('Missing dialog element: ' + selector);
    if (action === 'click') el.click();
    else if (action === 'fill') {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (action === 'select') {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, { selector, action, value });
}
async function dialogValue(page, selector, property = 'textContent') {
  return page.evaluate(({ selector, property }) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error('Missing dialog element: ' + selector);
    return element[property];
  }, { selector, property });
}
async function dialogCount(page, selector) {
  return page.evaluate((selector) => document.querySelectorAll(selector).length, selector);
}

const origin = process.env.SMOKE_ORIGIN ?? 'http://127.0.0.1:3000';
const output = process.env.SMOKE_SCREENSHOTS;
const editorUrl = new URL('/editor', origin).href;

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
let browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: chromium.args,
  headless: 'shell',
});

try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    let page = await browser.newPage();
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
      const home = await page.goto(origin, { waitUntil: 'domcontentloaded' });
      assert.equal(home?.status(), 200);
      assert.match(await page.$eval('h1', (heading) => heading.textContent), /Buat kartu peserta ujian dari Excel/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('main a[href="/editor"]').click();
      await page.waitForFunction(() => location.pathname === '/editor');
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

      // Local stub: validate catalog display, selection, search and preview without writing to Neon.
      const catalogPage = await browser.newPage();
      await catalogPage.setViewport({ width, height, deviceScaleFactor: 1, isMobile: name === 'mobile', hasTouch: name === 'mobile' });
      catalogPage.on('pageerror', (error) => errors.push(error.message));
      catalogPage.on('console', (entry) => {
        const expectedPinRejection = entry.text().startsWith('Failed to load resource:') &&
          entry.text().includes('403') && entry.location().url === new URL('/api/community-formats', origin).href;
        if (entry.type() === 'error' && !expectedPinRejection) errors.push(entry.text());
      });
      const sampleCommunity = [{
        id: 9001, name: 'Format Uji Komunitas',
        fields: ['NoPeserta', 'NISN', 'NamaMurid', 'Kelas', 'Ruang', 'Sesi'],
        photoKey: 'NoPeserta', mono: [],
        labels: { NoPeserta: 'No. Peserta' },
        contributor: 'Kontributor Simulasi',
        createdAt: '2026-11-13T12:00:00.000Z',
      }];
      await catalogPage.setRequestInterception(true);
      let catalogDeleted = false;
      const communityRequest = (request) => {
        if (request.method() === 'DELETE' && new URL(request.url()).pathname === '/api/community-formats') {
          const { id, pin } = JSON.parse(request.postData());
          catalogDeleted = id === 9001 && pin === '12345678';
          void request.respond(catalogDeleted ? { status: 204 } : {
            status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'PIN pemilik salah.' }),
          });
          return;
        }
        if (request.method() === 'GET' && new URL(request.url()).pathname === '/api/community-formats') {
          void request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(catalogDeleted ? [] : sampleCommunity) });
        } else {
          void request.continue();
        }
      };
      catalogPage.on('request', communityRequest);
      await catalogPage.goto(editorUrl, { waitUntil: 'domcontentloaded' });
      await catalogPage.waitForSelector('.community-card[data-community-id="9001"]', { visible: true });
      await catalogPage.waitForSelector('.community-card[data-community-id="9001"]', { visible: true });
      assert.match(await catalogPage.$eval('.community-card-byline', (el) => el.textContent),
        /Kontributor Simulasi.*13 Nov 2026/);
      assert.equal(await catalogPage.$$eval('.community-card-fields li', (items) => items.length), 6);
      assert.equal(await catalogPage.$eval('.community-extra-fields', (el) => el.textContent.trim()), '+1 field lainnya');
      await catalogPage.$eval('.format-library-filters button:nth-child(3)', (button) => button.click());
      await catalogPage.waitForSelector('.format-library-filters button:nth-child(3)[aria-pressed="true"]');
      await catalogPage.waitForFunction(() => document.querySelectorAll('.format-grid article').length === 1);
      await catalogPage.locator('input[aria-label="Cari format"]').fill('Kontributor Simulasi');
      assert.equal(await catalogPage.$$eval('.community-card', (els) => els.length), 1);
      await catalogPage.locator('input[aria-label="Cari format"]').fill('');
      await catalogPage.locator('.community-card .community-choose').click();
      await catalogPage.waitForSelector('.community-card[data-selected="true"]');
      assert.equal(await catalogPage.$eval('.community-card[data-selected="true"] .community-choose',
        (el) => el.disabled), true);
      await catalogPage.locator('.community-card .community-preview').click();
      await catalogPage.waitForSelector('#format-preview-title');
      assert.match(await catalogPage.$eval('#format-preview-title', (el) => el.textContent), /Format Uji Komunitas/);
      await catalogPage.locator('.format-close').click();
      await catalogPage.waitForFunction(() => !document.querySelector('.format-dialog[open]'));
      await catalogPage.$eval('.format-library-filters button:nth-child(2)', (button) => button.click());
      await catalogPage.waitForSelector('.format-library-filters button:nth-child(2)[aria-pressed="true"]');
      await catalogPage.focus('input[aria-label="Cari format"]');
      await catalogPage.keyboard.down('Control');
      await catalogPage.keyboard.press('A');
      await catalogPage.keyboard.up('Control');
      await catalogPage.keyboard.press('Backspace');
      await catalogPage.waitForFunction(() => document.querySelectorAll('#panel-0 .format-grid article').length === 8,
        { timeout: 5000 }).catch(async () => {
          console.log('Filter debugging:', await catalogPage.evaluate(() => ({
            search: document.querySelector('input[aria-label="Cari format"]')?.value,
            categories: Array.from(document.querySelectorAll('.format-library-filters button'))
              .map((item) => [item.textContent, item.getAttribute('aria-pressed')]),
            builtins: document.querySelectorAll('#panel-0 .format-grid .format').length,
            community: document.querySelectorAll('.community-card').length,
          })));
          throw new Error('Built-in cards should return after clearing the search query.');
        });
      await catalogPage.$eval('#pick-format-1', (button) => button.click());
      await catalogPage.waitForSelector('#pick-format-1[aria-pressed="true"]');
      await catalogPage.$eval('.format-library-filters button:nth-child(1)', (button) => button.click());
      await catalogPage.waitForSelector('.format-library-filters button:nth-child(1)[aria-pressed="true"]');
      await catalogPage.waitForFunction(() => document.querySelectorAll('.format-grid article').length === 9);
      assert.equal(await catalogPage.$$eval('.community-card[data-selected="true"]', (els) => els.length), 0);
      assert.equal(await catalogPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await dialogAction(catalogPage, '.community-card .community-delete');
      await catalogPage.waitForSelector('#community-owner-pin');
      await dialogAction(catalogPage, '#community-owner-pin', 'fill', '87654321');
      await dialogAction(catalogPage, 'dialog[open] button[type="submit"]');
      await catalogPage.waitForFunction(() =>
        document.querySelector('#community-pin-hint[role="alert"]')?.textContent.includes('PIN salah'));
      assert.equal(await dialogCount(catalogPage, '.community-card'), 1);
      await dialogAction(catalogPage, '#community-owner-pin', 'fill', '12345678');
      await dialogAction(catalogPage, 'dialog[open] button[type="submit"]');
      await catalogPage.waitForFunction(() => !document.querySelector('.community-card') && !document.querySelector('dialog[open]'));
      catalogPage.off('request', communityRequest);
      await catalogPage.close();

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
      assert.equal(await page.$('.import-dialog[open]'), null);
      // Hold the first workbook request until the user has switched tabs.
      const workerGate = await page.evaluateHandle(() => {
        const postMessage = Worker.prototype.postMessage;
        let release = () => {};
        Worker.prototype.postMessage = function (request) {
          if (request.action !== 'inspect') return postMessage.call(this, request);
          Worker.prototype.postMessage = postMessage;
          release = () => postMessage.call(this, request);
        };
        return () => release();
      });
      await fileInput.uploadFile(valid);
      await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('Memproses Excel'));
      await page.locator('#step-2').click();
      await page.waitForSelector('#panel-2', { visible: true });
      await workerGate.evaluate((release) => release());
      await workerGate.dispose();
      await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('Pratinjau Data'));
      assert.equal(await page.$('.import-dialog[open]'), null);
      await page.locator('#step-1').click();
      await page.waitForSelector('.import-dialog[open]', { visible: true });
      await page.keyboard.press('Escape');
      await page.waitForSelector('.import-dialog[open]', { hidden: true });
      for (const file of [valid, duplicate]) {
        await fileInput.uploadFile(file);
        await page.waitForSelector('.import-dialog[open]');
        assert.equal(await page.$$eval('.import-steps li', (items) => items.length), 3);
        assert.match(await page.$eval('.import-dialog-private', (item) => item.textContent), /Diproses lokal/);
        await page.waitForFunction(() => {
          const sheet = document.querySelector('#participant-sheet');
          return sheet && !sheet.disabled && sheet.value === 'Petunjuk';
        });
        await page.select('#participant-sheet', 'Peserta');
        await page.waitForFunction((count) => document.querySelector('#panel-1')?.textContent.includes('Lima baris pertama dari ' + count + ' baris data'), {}, file === valid ? 500 : 2);
        if (file === valid) {
          await page.waitForSelector('#apply-participant-import:enabled');
          assert.equal(await page.$eval('.import-validation-ok', (item) => item.textContent.includes('500 murid')), true);
          await page.focus('#apply-participant-import');
          await page.keyboard.press('Space');
          await page.waitForSelector('.import-dialog[open]', { hidden: true });
          await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('500 Terpilih'));
          await page.locator('input[placeholder="Nama atau ID"]').fill('0002');
          await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('1 Hasil filter'));
        } else {
          await page.waitForFunction(() => document.querySelector('.import-dialog [role="alert"]')?.textContent.includes('Gunakan ID unik'));
          assert.equal(await page.$eval('#apply-participant-import', (button) => button.disabled), true);
          await page.keyboard.press('Escape');
          await page.waitForSelector('.import-dialog[open]', { hidden: true });
          assert.match(await page.$eval('#panel-1', (panel) => panel.textContent), /500 Peserta/);
        }
      }
      const photoInput = await page.$('#panel-1 input[accept="image/png,image/jpeg"]');
      assert.ok(photoInput);
      await photoInput.uploadFile(photo);
      await page.waitForFunction(() => [...document.querySelectorAll('.app-toast')].some((toast) => toast.textContent.includes('1 foto diterapkan')));
      if (name === 'desktop') {
        const zipInput = await page.$('#panel-1 input[accept=".zip"]');
        assert.ok(zipInput);
        const zipStart = performance.now();
        await zipInput.uploadFile(archive);
        await page.waitForFunction(() => [...document.querySelectorAll('.app-toast')].some((toast) => toast.textContent.includes('20 foto diterapkan')));
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
      await page.$eval('.kop-signature button:nth-child(3)', (button) => button.click());
      await page.waitForFunction(() => document.querySelector('.kop-signature output')?.textContent?.includes('1.2 cm'));
      await page.$eval('.kop-signature input[role="switch"]', (input) => input.click());
      await page.waitForFunction(() => document.querySelector('.kop-signature input[role="switch"]')?.checked === true);
      await page.$eval('.kop-save', (button) => button.click());
      await page.waitForFunction(() => document.querySelector('#panel-2 .page-heading-actions [role=status]')?.textContent === 'Disimpan');
      const savedAppearance = await page.evaluate(() => JSON.parse(localStorage.getItem('generate-kartu:preferences:v1')).settings);
      assert.deepEqual(savedAppearance.kopStyles.institution, { size: 12, bold: true, italic: true });
      assert.equal(savedAppearance.signatureSize, 1.2);
      assert.equal(savedAppearance.signatureOverlap, true);
      await page.$eval('#card-settings-1', (button) => button.click());
      await page.waitForSelector('#card-settings-1[aria-selected=true]');
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
      await page.waitForSelector('#card-settings-2[aria-selected=true]');
      await page.$eval('#step-3', (button) => button.click());
      await page.waitForSelector('#panel-3', { visible: true });
      assert.match(await page.locator('#panel-3').map((el) => el.textContent).wait(), /Lengkap Ruang/);
      assert.equal(await page.$$eval('#panel-3 .exam-card', (cards) => cards.length), 9);
      assert.match(await page.$eval('#panel-3 .print-count', (status) => status.textContent), /500 dari 500/);
      assert.equal(await page.$eval('#panel-3 .exam-card-head > div:nth-child(2) > div', (line) => getComputedStyle(line).fontStyle), 'italic');
      assert.equal(await page.$eval('#panel-3 .exam-card-signature', (signature) => signature.style.height), '1.2cm');
      assert.equal(await page.$eval('#panel-3 .exam-card-signature', (signature) => getComputedStyle(signature).position), 'absolute');
      const qr = await page.$eval('#panel-3 .card-qr path', (path) => path.getAttribute('d'));
      await page.$eval('#panel-3 nav button:last-child', (button) => button.click());
      await page.waitForFunction(() => document.querySelector('#panel-3 .print-count')?.textContent.includes('Halaman 2/56'));
      await page.$eval('#panel-3 nav button:first-child', (button) => button.click());
      await page.waitForFunction(() => document.querySelector('#panel-3 .print-count')?.textContent.includes('Halaman 1/56'));
      assert.equal(await page.$eval('#panel-3 .card-qr path', (path) => path.getAttribute('d')), qr);
      await page.locator('#panel-3 input[placeholder="Cari nama, NISN, atau no. peserta…"]').fill('0002');
      await page.waitForFunction(() => document.querySelector('#panel-3 .print-count')?.textContent.includes('1 dari 500'));
      assert.equal(await page.$$eval('#panel-3 .exam-card', (cards) => cards.length), 1);
      await page.waitForFunction(() => {
        const grid = document.querySelector('.print-card-grid');
        const card = grid?.querySelector('.exam-card');
        return card && card.getBoundingClientRect().width <= grid.clientWidth && grid.scrollWidth <= grid.clientWidth + 1;
      });
      await page.locator('#preview-a4').click();
      await page.waitForSelector('.print-a4-dialog[open] .exam-card');
      assert.equal(await page.$$eval('.print-a4-dialog[open] .exam-card', (cards) => cards.length), 1);
      await page.waitForFunction(() => {
        const frame = document.querySelector('.print-a4-dialog[open] .fit-preview');
        const sheet = frame?.querySelector('.print-sheet');
        return sheet && sheet.getBoundingClientRect().width <= frame.clientWidth + 1;
      });
      await page.keyboard.press('Escape');
      await page.waitForSelector('.print-a4-dialog[open]', { hidden: true });
      await page.locator('#panel-3 input[placeholder="Cari nama, NISN, atau no. peserta…"]').fill('tidak ditemukan');
      await page.waitForFunction(() => document.querySelector('#panel-3 .print-count')?.textContent.includes('0 dari 500'));
      assert.equal(await page.$$eval('#panel-3 .exam-card', (cards) => cards.length), 0);
      await page.$eval('#panel-3 input', (input) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForFunction(() => document.querySelector('#panel-3 .print-count')?.textContent.includes('500 dari 500'));
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
        await page.waitForFunction(() => document.querySelector('#panel-3 .print-count')?.textContent.includes('60 dari 500'));
        await page.setOfflineMode(false);
        for (const count of [60, 132, 500]) {
          const start = performance.now();
          await page.select('#preview-Ruang', count === 500 ? '' : `Ruang ${count}`);
          await page.waitForFunction((total) => document.querySelector('#panel-3 .print-count')?.textContent.includes(`${total} dari 500`), {}, count);
          assert.equal(await page.$$eval('#panel-3 .exam-card', (cards) => cards.length), 9);
          const heap = (await page.metrics()).JSHeapUsedSize / 1048576;
          console.log(`Preview ${count} peserta: ${Math.round(performance.now() - start)} ms; heap JS ${heap.toFixed(1)} MiB`);
        }
        const previewFields = await page.$$eval('#panel-3 .print-card-grid .exam-card dl', (lists) =>
          lists.map((list) => [...list.children].map((row) => row.textContent)));
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
              fields: pages.flatMap((page) => [...page.querySelectorAll('.exam-card dl')].map((list) =>
                [...list.children].map((row) => row.textContent))),
              names: pages.flatMap((page) => [...page.querySelectorAll('.exam-card')].map((card) => card.getAttribute('aria-label'))),
            };
          };
          const drawImage = CanvasRenderingContext2D.prototype.drawImage;
          window.pdfCardFields = [];
          CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
            const prefix = 'data:image/svg+xml;charset=utf-8,';
            if (image instanceof HTMLImageElement && image.src.startsWith(prefix)) {
              const card = new DOMParser().parseFromString(decodeURIComponent(image.src.slice(prefix.length)), 'image/svg+xml');
              const list = card.querySelector('.exam-card dl');
              if (list) window.pdfCardFields.push([...list.children].map((row) => row.textContent));
            }
            return drawImage.call(this, image, ...args);
          };
          const click = HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click = function () {
            if (this.download !== 'kartu-peserta-ujian.pdf') return click.call(this);
            window.pdfEvidence = fetch(this.href).then((response) => response.arrayBuffer()).then((bytes) => [...new Uint8Array(bytes)]);
          };
        });
        await page.evaluate(() => {
          window.printBatch = window.print;
          window.print = () => { throw new Error('Printer uji gagal'); };
        });
        await page.$eval('#print-cards', (button) => button.click());
        await page.waitForFunction(() => document.querySelector('.batch-result-dialog[open]')?.textContent.includes('Printer uji gagal'));
        assert.match(await page.$eval('.batch-result-dialog[open] .action-primary', (button) => button.textContent), /Ulangi batch 1/);
        await page.evaluate(() => { window.print = window.printBatch; });
        const printStart = performance.now();
        await page.locator('.batch-result-dialog[open] .action-primary').click();
        await page.waitForFunction(() => window.printEvidence);
        const printedNames = [];
        for (let batch = 0; batch < 5; batch++) {
          const printed = await page.evaluate(() => window.printEvidence);
          assert.equal(printed.active, true);
          assert.equal(printed.counts.length, 12);
          assert.equal(printed.counts.at(-1), 1);
          assert.equal(printed.names.length, 100);
          printedNames.push(...printed.names);
          if (batch === 0) {
            assert.deepEqual(printed.fields.slice(0, previewFields.length), previewFields);
            const browserPdf = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
            assert.equal(browserPdf.getPageCount(), 12);
          }
          await page.evaluate(() => { delete window.printEvidence; window.finishPrint(); });
          if (batch < 4) {
            await page.locator('.batch-result-dialog[open] .action-primary').click();
            await page.waitForFunction(() => window.printEvidence);
          }
        }
        assert.deepEqual(printedNames, Array.from({ length: 500 }, (_, index) => 'Kartu ujian Peserta Uji ' + index));
        await page.locator('.batch-result-dialog[open] footer button:first-child').click();
        await page.waitForSelector('.batch-result-dialog[open]', { hidden: true });
        console.log(`Cetak 500 kartu dalam 5 batch: ${Math.round(performance.now() - printStart)} ms`);
        await page.select('#preview-Kelas', 'IX-A');
        await page.waitForFunction(() => document.querySelector('#panel-3 .print-count')?.textContent.includes('10 dari 500'));
        await page.$eval('#step-2', (button) => button.click());
        await page.waitForSelector('#card-settings-3', { visible: true });
        await page.focus('#card-settings-2');
        await page.keyboard.press('ArrowRight');
        await page.waitForSelector('#card-settings-3[aria-selected=true]');
        const paperSelects = await page.$$('#settings-panel-3 select');
        await paperSelects[0].select('A5');
        await paperSelects[1].select('portrait');
        await paperSelects[2].select('center');
        await paperSelects[3].select('end');
        for (const [index, margin] of [10, 12, 14, 16].entries()) {
          await dialogAction(page, `#settings-panel-3 label:has(input):nth-child(${index + 1}) input`, 'fill', String(margin));
        }
        await page.waitForFunction(() => document.querySelector('.paper-overview [role="status"]')?.textContent.includes('3 kartu per lembar'));
        await page.locator('.kop-save').click();
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('generate-kartu:preferences:v1'))?.settings.paper.size === 'A5');
        await page.$eval('#step-3', (button) => button.click());
        await page.waitForSelector('#preview-a4:enabled');
        await page.select('#preview-Kelas', 'IX-A');
        await page.waitForFunction(() => document.querySelector('#panel-3 .print-count')?.textContent.includes('10 dari 500'));
        await page.locator('#preview-a4').click();
        await page.waitForSelector('.print-a4-dialog[open] .print-sheet');
        const placement = await page.$eval('.print-a4-dialog .print-sheet', (sheet) =>
          [sheet.style.width, sheet.style.height, sheet.style.paddingLeft, sheet.style.paddingTop]);
        assert.deepEqual(placement, ['148mm', '210mm', '33mm', '28mm']);
        await page.keyboard.press('Escape');
        await page.waitForSelector('.print-a4-dialog[open]', { hidden: true });
        await page.evaluate(() => { delete window.printEvidence; });
        await page.locator('#print-cards').click();
        await page.waitForFunction(() => window.printEvidence);
        assert.deepEqual(await page.evaluate(() => window.printEvidence.counts), [3, 3, 3, 1]);
        const configuredPrint = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
        assert.equal(configuredPrint.getPageCount(), 4);
        assert.ok(Math.abs(configuredPrint.getPage(0).getWidth() * 25.4 / 72 - 148) < 1);
        assert.ok(Math.abs(configuredPrint.getPage(0).getHeight() * 25.4 / 72 - 210) < 1);
        await page.evaluate(() => window.finishPrint());
        await page.waitForSelector('#download-card-pdf:enabled');
        const pdfDialog = '.pdf-progress-dialog[open]';
        const started = await page.$eval('#download-card-pdf', (button) => {
          button.click();
          const dialog = document.querySelector('.pdf-progress-dialog[open]');
          const progress = dialog?.querySelector('progress');
          dialog?.querySelector('footer button').click();
          return { cards: progress?.max, done: progress?.value };
        });
        assert.deepEqual(started, { cards: 10, done: 0 });
        await page.waitForSelector(pdfDialog, { hidden: true });
        await page.waitForFunction(() => document.activeElement?.id === 'download-card-pdf');
        assert.equal(await page.evaluate(() => typeof window.pdfEvidence), 'undefined');
        const expectedPdfFields = await page.$$eval('#panel-3 .print-card-grid .exam-card dl', (lists) =>
          lists.map((list) => [...list.children].map((row) => row.textContent)));
        const pdfStart = performance.now();
        await page.$eval('#download-card-pdf', (button) => button.click());
        await page.waitForSelector(pdfDialog, { visible: true });
        await page.waitForFunction(() => window.pdfEvidence, { timeout: 60000 });
        await page.waitForSelector(pdfDialog, { hidden: true });
        const bytes = await page.evaluate(() => window.pdfEvidence);
        assert.deepEqual(await page.evaluate((count) => window.pdfCardFields.slice(0, count), expectedPdfFields.length), expectedPdfFields);
        const pdf = await PDFDocument.load(new Uint8Array(bytes));
        console.log(`PDF 10 kartu: ${Math.round(performance.now() - pdfStart)} ms; ${bytes.length} byte`);
        assert.equal(pdf.getPageCount(), 4);
        assert.deepEqual(pdf.getPages().map((sheet) => sheet.node.Resources().lookup(pdfName.of('XObject')).keys().length), [3, 3, 3, 1]);
        assert.ok(Math.abs(pdf.getPage(0).getWidth() * 25.4 / 72 - 148) < 0.1);
        assert.ok(Math.abs(pdf.getPage(0).getHeight() * 25.4 / 72 - 210) < 0.1);
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
      // Isolate interactive form tests in a new Chromium process: the full
      // PDF/print regression leaves considerable DOM and renderer activity.
      await page.close();
      await browser.close();
      browser = await puppeteer.launch({
        executablePath: await chromium.executablePath(), args: chromium.args, headless: 'shell',
      });
      page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: name === 'mobile', hasTouch: name === 'mobile' });
      await page.setCacheEnabled(false);
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (['http:', 'https:'].includes(url.protocol) &&
          (url.origin !== new URL(origin).origin || request.method() !== 'GET' || /Peserta(?:%20|\+)Uji|Madrasah(?:%20|\+)Uji/i.test(url.href))) {
          externalRequests.push({ origin: url.origin, method: request.method() });
        }
      });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (entry) => { if (entry.type() === 'error') errors.push(entry.text()); });
      await page.goto(editorUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#pick-custom-format');
      await page.$eval('#step-0', (button) => button.click());
      await page.waitForSelector('#panel-0', { visible: true });
      await page.$eval('#pick-custom-format', (button) => button.click());
      const customDialog = '.custom-format-dialog[open]';
      await page.waitForFunction((selector) => !!document.querySelector(selector), {}, customDialog);
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden');
      assert.equal(await page.evaluate(() => document.querySelectorAll('.custom-format-dialog[open] .custom-format-rows li').length), 3);
      const options = await page.evaluate(() => Array.from(
        document.querySelectorAll('.custom-format-dialog[open] li:first-child select option'))
        .map((item) => ({ text: item.textContent.trim(), disabled: item.disabled })));
      assert.deepEqual(options.map((item) => item.text), [
        '— Pilih —', 'Nama Murid', 'NISN', 'No. Peserta', 'Kelas', 'Ruang', 'Tgl. Lahir',
        'Sesi', 'Username', 'Password', 'Nama Satdik', '-- Tulis Sendiri',
      ]);
      assert.equal(options[9].disabled, false, 'Password should be available for custom formats');
      await dialogAction(page, `${customDialog} li:nth-child(2) select`, 'select', 'Password');
      assert.equal(await dialogValue(page, `${customDialog} [aria-label="Kolom Excel baris 2"]`, 'value'), 'Password');
      assert.equal(await dialogValue(page, `${customDialog} [aria-label="Acuan Foto Password"]`, 'disabled'), true);
      assert.match(await dialogValue(page, `${customDialog} .custom-format-note`), /case-sensitive, tanpa spasi/);
      assert.match(await dialogValue(page, `${customDialog} .custom-format-note`), /sesi lokal/);
      assert.equal(await dialogValue(page, `${customDialog} [aria-label="Kolom Excel baris 1"]`, 'value'), 'NamaMurid');
      await dialogAction(page, `${customDialog} .custom-add`);
      assert.equal(await dialogCount(page, `${customDialog} .custom-format-rows li`), 4);
      await page.keyboard.press('Escape');
      await page.waitForFunction((selector) => !document.querySelector(selector), {}, customDialog);
      await page.waitForFunction(() => document.activeElement?.id === 'pick-custom-format');
      assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden');
      await dialogAction(page, '#pick-custom-format');
      await page.waitForFunction((selector) => !!document.querySelector(selector), {}, customDialog);
      assert.equal(await dialogCount(page, `${customDialog} .custom-format-rows li`), 3);
      await dialogAction(page, `${customDialog} li:nth-child(2) select`, 'select', 'NoPeserta');
      await dialogAction(page, `${customDialog} li:nth-child(3) select`, 'select', 'Kelas');
      await dialogAction(page, `${customDialog} [aria-label="Naikkan No. Peserta"]`);
      await dialogAction(page, `${customDialog} [aria-label="Acuan Foto No. Peserta"]`);
      await dialogAction(page, `${customDialog} [aria-label="Monospace No. Peserta"]`);
      await dialogAction(page, `${customDialog} .custom-add`);
      await dialogAction(page, `${customDialog} li:nth-child(4) select`, 'select', 'manual');
      await dialogAction(page, `${customDialog} [aria-label="Label Tampilan baris 4"]`, 'fill', 'Nomor Bangku');
      await dialogAction(page, `${customDialog} [aria-label="Kolom Excel baris 4"]`, 'fill', 'nopeserta');
      await page.waitForFunction((selector) => !!document.querySelector(selector), {}, `${customDialog} .custom-excel-duplicate`);
      assert.equal(await dialogCount(page, `${customDialog} .custom-excel-duplicate`), 2);
      await dialogAction(page, `${customDialog} .custom-save`);
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-describedby')?.startsWith('custom-excel-error-'));
      await dialogAction(page, `${customDialog} [aria-label="Kolom Excel baris 4"]`, 'fill', 'NomorBangku');
      await page.waitForFunction(() => document.querySelectorAll('.custom-excel-duplicate').length === 0);
      await dialogAction(page, `${customDialog} .custom-community input`);
      assert.equal(await dialogValue(page, `${customDialog} .custom-format-name input`, 'value'), 'Format_Kustom');
      await page.evaluate(() => {
        const fetchCatalog = window.fetch.bind(window);
        let nameChecks = 0;
        window.fetch = (input, options) => {
          const url = new URL(input instanceof Request ? input.url : input, location.href);
          if (url.origin === location.origin && url.pathname === '/api/community-formats' && url.searchParams.has('name')) {
            return Promise.resolve(Response.json({ exists: ++nameChecks === 1 }));
          }
          return fetchCatalog(input, options);
        };
      });
      await dialogAction(page, `${customDialog} .custom-save`);
      await page.waitForFunction(() => document.querySelector('#custom-format-name-error')?.textContent.includes('sudah digunakan'));
      await dialogAction(page, `${customDialog} .custom-format-name input`, 'fill', 'Format_Baru_2026');
      const toastState = await page.evaluate(async () => {
        const confirm = document.querySelector('.custom-format-dialog[open] .custom-save');
        const fetchCatalog = window.fetch;
        window.fetch = () => Promise.resolve(new Response(null, { status: 503 }));
        const original = window.setTimeout;
        const expirations = [];
        // Chromium can throttle timers in background targets on CI.
        window.setTimeout = (callback, delay, ...args) => {
          if (delay !== 2000) return original(callback, delay, ...args);
          expirations.push(() => callback(...args));
          return 0;
        };
        try {
          for (let index = 0; index < 4; index++) {
            confirm.click();
            await new Promise((resolve) => original(resolve, 20));
          }
        } finally {
          window.setTimeout = original;
          window.fetch = fetchCatalog;
        }
        const visible = [...document.querySelectorAll('.app-toast-stack:popover-open .app-toast')].map((item) => {
          const style = getComputedStyle(item);
          const bounds = item.getBoundingClientRect();
          return style.opacity === '1' && style.visibility === 'visible' && bounds.width > 0 && bounds.height > 0;
        });
        expirations.forEach((expire) => expire());
        return { visible, timers: expirations.length, remaining: document.querySelectorAll('.app-toast').length };
      });
      assert.deepEqual(toastState, { visible: [true, true, true], timers: 4, remaining: 0 });
      await dialogAction(page, `${customDialog} .custom-save`);
      const shareDialog = '.community-share-dialog[open]';
      await page.waitForFunction((selector) => !!document.querySelector(selector), {}, shareDialog);
      assert.equal(await dialogValue(page, `${shareDialog} h2`), 'Bagikan ke Komunitas?');
      assert.ok((await dialogValue(page, `${shareDialog} .community-share-notice`)).includes('Format_Baru_2026'));
      await dialogAction(page, `${shareDialog} .community-share-confirm`);
      await page.waitForSelector('#contributor-name-error[role="alert"]');
      assert.equal(await dialogValue(page, '#community-contributor-name', 'ariaInvalid'), 'true');
      await dialogAction(page, '#community-contributor-name', 'fill', 'rANDY uJI123!');
      assert.equal(await dialogValue(page, '#community-contributor-name', 'value'), 'Randy Uji');
      await dialogAction(page, `${shareDialog} .community-share-anonymous input`);
      assert.equal(await dialogValue(page, '#community-contributor-name', 'disabled'), true);
      await dialogAction(page, `${shareDialog} .community-share-cancel`);
      await page.waitForFunction((selector) => !document.querySelector(selector), {}, shareDialog);
      assert.equal(await dialogValue(page, customDialog, 'open'), true);
      await dialogAction(page, `${customDialog} .custom-community input`);
      await dialogAction(page, `${customDialog} .custom-save`);
      // The dialog closes asynchronously after the local save callback.
      await page.waitForFunction((selector) => {
        const error = [...document.querySelectorAll('.app-toast[role=alert]')].find((toast) => toast.textContent.includes('belum berhasil disimpan'));
        if (error) throw new Error(error.textContent);
        return !document.querySelector(selector);
      }, { polling: 100, timeout: 10000 }, customDialog);
      assert.equal(await dialogValue(page, '#pick-custom-format', 'ariaPressed'), 'true');
      await page.$eval('#step-3', (button) => button.click());
      await page.waitForSelector('#panel-3', { visible: true });
      assert.equal(await page.$eval('#panel-3 .exam-card dl', (list) => list.children.length), 4);
      assert.ok(await page.$eval('#panel-3 .exam-card dl', (list) => list.textContent.includes('Nomor Bangku')));
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
        await page.waitForFunction((key) => {
          const preferences = JSON.parse(localStorage.getItem(key));
          return preferences?.format === 7 && preferences.dark === false;
        }, {}, key);
        const stored = await page.evaluate((key) => localStorage.getItem(key), key);
        assert.doesNotMatch(stored, /Madrasah Uji Fase 7|Peserta Uji/);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#pick-custom-format[aria-pressed=true]');
        await page.$eval('#step-2', (button) => button.click());
        await page.waitForSelector('#panel-2', { visible: true });
        const backupInput = await page.$('#panel-2 input[accept=".json,application/json"]');
        assert.ok(backupInput);
        const backupFile = join(fixtureDir, 'settings.json');
        await writeFile(backupFile, '{rusak');
        await backupInput.uploadFile(backupFile);
        await page.waitForFunction(() => [...document.querySelectorAll('.app-toast')].some((toast) => toast.textContent.includes('JSON rusak')));
        assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), stored);
        await writeFile(backupFile, JSON.stringify({ ...JSON.parse(stored), format: 1, heading: { institution: 'Madrasah Pulih', exam: '', year: '' } }));
        await backupInput.uploadFile(backupFile);
        await page.waitForSelector('.backup-confirm-dialog[open]');
        assert.match(await dialogValue(page, '.backup-confirm-content'), /settings.json/);
        await dialogAction(page, '#confirm-backup-restore');
        await page.waitForFunction(() => document.querySelector('#kop-institution')?.value === 'Madrasah Pulih');
        await page.$eval('.kop-save', (button) => button.click());
        await page.waitForFunction(() => [...document.querySelectorAll('.app-toast')].some((toast) => toast.textContent.includes('berhasil disimpan')));
        assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('generate-kartu:card-session:v1'))?.data?.institution), 'Madrasah Pulih');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.$eval('#step-2', (button) => button.click());
        await page.waitForFunction(() => document.querySelector('#kop-institution')?.value === 'Madrasah Pulih');
        await page.evaluate(() => {
          const time = Date.now();
          Date.now = () => time + 56 * 60 * 1000;
          window.dispatchEvent(new Event('pageshow'));
        });
        await page.waitForSelector('dialog[open] #session-warning-title');
        await dialogAction(page, 'dialog[open] .community-share-confirm');
        await page.waitForFunction(() => !document.querySelector('dialog[open] #session-warning-title'));
        await page.waitForFunction(() => [...document.querySelectorAll('.app-toast')].some((toast) => toast.textContent.includes('diperpanjang')));
        await page.evaluate(() => {
          const time = Date.now();
          Date.now = () => time + 3600001;
          window.dispatchEvent(new Event('pageshow'));
        });
        await page.waitForFunction(() => [...document.querySelectorAll('.app-toast')].some((toast) => toast.textContent.includes('Sesi kedaluwarsa')));
        await page.waitForFunction(() => document.querySelector('#kop-institution')?.value !== 'Madrasah Pulih');
        const resetDialog = '.reset-dialog[open]';
        await page.focus('#reset-card-session');
        const savedBeforeReset = await page.evaluate(() => localStorage.getItem('generate-kartu:preferences:v1'));
        await dialogAction(page, '#reset-card-session');
        await page.waitForSelector(resetDialog, { visible: true });
        assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Batal');
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden');
        await page.keyboard.press('Escape');
        await page.waitForSelector(resetDialog, { hidden: true });
        assert.equal(await page.evaluate(() => document.activeElement.id), 'reset-card-session');
        assert.equal(await page.evaluate(() => localStorage.getItem('generate-kartu:preferences:v1')), savedBeforeReset);
        await dialogAction(page, '#reset-card-session');
        await dialogAction(page, `${resetDialog} .action-danger`);
        await page.waitForSelector(resetDialog, { hidden: true });
        await page.waitForFunction(() => [...document.querySelectorAll('.app-toast')].some((toast) => toast.textContent.includes('direset')));
      }
      await page.locator('.help-nav').click();
      await page.waitForSelector('#editor-help-panel .help-stats', { visible: true });
      await page.waitForFunction(() => {
        const grid = document.querySelector('.help-grid');
        if (!grid || (innerWidth > 720 && !grid.hasAttribute('data-masonry-ready'))) return false;
        const cards = [...grid.children].map((card) => card.getBoundingClientRect());
        const faq = cards.at(-1);
        return faq.width >= grid.clientWidth - 1 && cards.slice(0, -1).every((card) => card.bottom <= faq.top);
      });
      await page.locator('#editor-help-faq details:first-of-type summary').click();
      await page.waitForSelector('#editor-help-faq details[open] p', { visible: true });
      await page.$eval('.help-release-button', (button) => button.click());
      await page.waitForSelector('.release-notes-dialog[open]', { visible: true });
      assert.match(await dialogValue(page, '.release-notes-dialog'), /Format dan komunitas/);
      await dialogAction(page, '.release-notes-footer button');
      await page.waitForSelector('.release-notes-dialog[open]', { hidden: true });
      assert.equal(await page.$eval('.help-nav', (button) => button.getAttribute('aria-pressed')), 'true');
      assert.deepEqual(errors, []);
      assert.deepEqual(externalRequests, [], 'No external requests or HTTP uploads during editor flow');
      for (const path of ['/bantuan', '/halaman-tidak-ada']) {
        assert.equal((await page.goto(new URL(path, origin).href))?.status(), 404);
        assert.equal(await page.locator('h1').map((el) => el.textContent).wait(), 'Halaman tidak ditemukan');
      }
      if (name === 'desktop') {
        await page.evaluateOnNewDocument(() => {
          Storage.prototype.setItem = () => { throw new DOMException('Simulasi kuota', 'QuotaExceededError'); };
        });
        await page.goto(editorUrl, { waitUntil: 'domcontentloaded' });
        await page.$eval('#step-2', (button) => button.click());
        await page.waitForFunction(() => [...document.querySelectorAll('.app-toast')].some((toast) => toast.textContent.includes('Penyimpanan browser penuh atau diblokir')));
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
