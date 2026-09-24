// Browser geometry regression checks; native safe areas still require an iPhone.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  try {
    for (const [width, height, classes] of [
      [375, 667, 'screen-compact'],
      [375, 812, 'screen-compact has-notch'],
      [393, 852, 'screen-standard has-dynamic-island is-promotion'],
      [430, 932, 'screen-large has-dynamic-island is-promotion'],
      [440, 956, 'screen-large-max has-dynamic-island is-promotion'],
      [393, 852, 'pwa-test'],
    ]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto(pathToFileURL(path.resolve(__dirname, '../native/Web/index.html')).href);
      await page.evaluate(c => document.documentElement.classList.add(...c.split(' ')), classes);
      await page.evaluate(() => document.fonts.ready);
      for (const keyboard of [0, 320, 0]) {
        await page.evaluate(k => window.__onNativeKeyboardChange(k, 0.15, 7), keyboard);
        await page.waitForFunction(target => Math.abs(document.querySelector('#app').getBoundingClientRect().bottom - target) < 1, height - keyboard);
        const bounds = await page.evaluate(() => {
          const rect = s => {
            const r = document.querySelector(s).getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, width: r.width, height: r.height };
          };
          return { app: rect('#app'), editor: rect('.editor'), bottom: rect('.bottom') };
        });
        assert.equal(bounds.app.top, 0);
        assert.equal(bounds.app.width, width);
        assert.ok(Math.abs(bounds.app.bottom - (height - keyboard)) < 2, JSON.stringify(bounds));
        assert.ok(bounds.editor.height > 50, JSON.stringify(bounds));
        assert.ok(bounds.bottom.bottom <= height - keyboard + 1, JSON.stringify(bounds));
      }
      console.log(`PASS ${width}x${height}: full viewport, keyboard open/close`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
