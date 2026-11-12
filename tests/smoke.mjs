import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
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
}
