import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { services } from '../src/content.mjs';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('test-results', { recursive: true });
const paths = [
  '/',
  '/about',
  '/services',
  ...services.map((service) => '/services/' + service.slug),
  '/our-process',
  '/our-clients',
  '/contact',
  '/privacy',
  '/legal',
];
try {
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      const response = await page.goto('http://localhost:3000' + path);
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('h1').count(), 1);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Overflow at ${width} ${path}`,
      );
      assert.equal(
        await page
          .locator('img')
          .evaluateAll((imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length),
        0,
      );
    }
    await page.goto('http://localhost:3000/');
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
  }
  for (const path of ['/', '/services']) {
    await page.goto('http://localhost:3000' + path);
    const search = page.getByRole('searchbox', { name: 'Search our services' });
    await search.fill('  FAMILY law  ');
    assert.equal(await page.locator('.service-card:not([hidden])').count(), 1);
    assert.equal(await page.locator('.service-card:not([hidden]) h3').textContent(), 'Family Law');
    await search.fill('divorce');
    assert.equal(await page.locator('.service-card:not([hidden]) h3').textContent(), 'Family Law');
    await search.fill('unlisted-service-xyz');
    assert.equal(await page.locator('.service-card:not([hidden])').count(), 0);
    assert.ok(await page.locator('.service-search-empty').isVisible());
    await page.getByRole('link', { name: 'Send an enquiry', exact: true }).click();
    assert.ok(page.url().endsWith('/contact#inquiry'));
    assert.ok(await page.locator('#inquiry-form').isVisible());
    await page.goto('http://localhost:3000' + path);
    await search.fill('tax');
    await search.fill('');
    assert.equal(await page.locator('.service-card:not([hidden])').count(), services.length);
    assert.ok(await page.locator('.service-search-empty').isHidden());
  }
  await page.goto('http://localhost:3000/');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
  await page.goto('http://localhost:3000/services/corporate-law');
  assert.equal(await page.locator('[name=service]').inputValue(), 'Corporate Law');
  await page.locator('[name=name]').fill('Test Person');
  await page.locator('[name=email]').fill('test@example.com');
  await page.locator('[name=message]').fill('A test inquiry about a business agreement.');
  await page.locator('[name=consent]').check();
  await page.locator('button[type=submit]').click();
  await page.locator('.form-status.error').waitFor();
  assert.match(await page.locator('.form-status').textContent(), /not been sent/);
  assert.equal(await page.locator('[name=name]').inputValue(), 'Test Person');
  await page.route('**/api/inquiry', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"message":"Inquiry sent."}',
    }),
  );
  await page.locator('button[type=submit]').click();
  await page.locator('.form-status.success').waitFor();
  assert.equal(await page.locator('[name=name]').inputValue(), '');
  assert.equal(await page.locator('[name=service]').inputValue(), 'Corporate Law');
  await page.goto('http://localhost:3000/contact?type=consultation');
  assert.equal(await page.locator('[name=requestType]').inputValue(), 'Consultation request');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:3000/');
  assert.equal(
    await page.locator('.marquee-track').evaluate((e) => getComputedStyle(e).animationName),
    'marquee',
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of paths) {
    await page.goto('http://localhost:3000' + path);
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      [],
      `Accessibility: ${path}`,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    `Passed: ${paths.length} pages at 4 viewport sizes; mobile menu, forms, reduced motion, WCAG accessibility scans and browser errors.`,
  );
} finally {
  await browser.close();
}
