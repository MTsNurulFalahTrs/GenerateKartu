import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { utils, write } from 'xlsx';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

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
    ...ids.map((id, index) => [id, '0000000123', 'Peserta Uji ' + index, 'IX-A', 'Ruang 1']),
  ]), 'Peserta');
  const file = join(fixtureDir, name);
  await writeFile(file, write(book, { type: 'buffer', bookType: 'xlsx', compression: true }));
  return file;
}
const valid = await fixture('valid.xlsx', ['0001', '0002']);
const duplicate = await fixture('duplikat.xlsx', ['0001', '0001']);
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
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (entry) => {
      if (entry.type() === 'error') errors.push(entry.text());
    });
    try {
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: name === 'mobile', hasTouch: name === 'mobile' });
      assert.equal((await page.goto(origin, { waitUntil: 'networkidle0' }))?.status(), 200);
      assert.equal(await page.locator('h1').map((el) => el.textContent).wait(), 'Pilih Format Kartu');
      assert.equal(await page.$$eval('.format-grid article', (cards) => cards.length), 8);
      await page.locator('[aria-label="Pilih Format 2"]').click();
      await page.waitForSelector('[aria-label="Pilih Format 2"][aria-pressed="true"]');
      await page.focus('#step-0');
      await page.keyboard.press('ArrowRight');
      await page.waitForSelector('#step-1[aria-selected="true"]');
      const fileInput = await page.$('input[type="file"]');
      assert.ok(fileInput);
      for (const file of [valid, duplicate]) {
        await fileInput.uploadFile(file);
        await page.waitForFunction(() => {
          const sheet = document.querySelector('#participant-sheet');
          return sheet && !sheet.disabled && sheet.value === 'Petunjuk';
        });
        await page.select('#participant-sheet', 'Peserta');
        await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('Pratinjau impor · 2 baris'));
        if (file === valid) {
          await page.locator('button::-p-text(Terapkan impor)').click();
          await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('2 terpilih'));
          await page.locator('input[placeholder="Nama atau ID"]').fill('0002');
          await page.waitForFunction(() => document.querySelector('#panel-1')?.textContent.includes('1 cocok'));
        } else {
          await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('Gunakan ID unik'));
          assert.equal(await page.locator('button::-p-text(Ganti data peserta)').map((button) => button.disabled).wait(), true);
          assert.match(await page.$eval('#panel-1', (panel) => panel.textContent), /2 peserta/);
        }
      }
      await page.locator('#step-2').click();
      await page.locator('button::-p-text(Jadwal)').click();
      await page.waitForSelector('button[aria-pressed="true"]::-p-text(Jadwal)');
      await page.locator('#step-3').click();
      assert.match(await page.locator('#panel-3').map((el) => el.textContent).wait(), /Lengkap Ruang/);
      await page.locator('.theme').click();
      await page.waitForSelector('[data-theme="dark"]');
      await page.locator('#step-0').click();
      await page.locator('.theme').click();
      await page.waitForSelector('[data-theme="light"]');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      if (output) await page.screenshot({ path: `${output}/format-${name}.jpg`, type: 'jpeg', quality: 65 });
      await page.locator('a[href="/bantuan"]').click();
      await page.waitForFunction(() => location.pathname === '/bantuan');
      assert.equal(await page.locator('h1').map((el) => el.textContent).wait(), 'Bantuan');
      assert.deepEqual(errors, []);
      assert.equal((await page.goto(new URL('/halaman-tidak-ada', origin).href))?.status(), 404);
      assert.equal(await page.locator('h1').map((el) => el.textContent).wait(), 'Halaman tidak ditemukan');
      console.log(`Smoke ${name} ${width}x${height}: OK`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  await rm(fixtureDir, { recursive: true, force: true });
}
