// scripts/discover-api.js
// Standalone discovery script — NOT a Playwright test.
// Visits each page, logs all XHR/fetch requests to find real API routes.
// Run with: node scripts/discover-api.js

const { chromium } = require('@playwright/test');

const BASE_URL = 'https://www.automationplayground.dev';

const PAGES = [
  '/',
  '/components',
  '/faq',
  '/components/input',
  '/components/button',
  '/components/dropdown',
  '/components/multiselect',
  '/components/alert',
  '/components/radio',
  '/components/drag',
  '/components/wait',
  '/components/simple-table',
  '/components/advanced-table',
  '/components/form',
  '/components/calendar',
  '/components/slider',
  '/components/uploadFile',
  '/components/dragAndDrop',
  '/components/window',
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const findings = [];
  let currentPage = '';

  page.on('request', (req) => {
    const type = req.resourceType();
    if (type === 'xhr' || type === 'fetch') {
      findings.push({
        page: currentPage,
        method: req.method(),
        url: req.url(),
        resourceType: type,
        postData: req.postData() || null,
      });
    }
  });

  for (const path of PAGES) {
    currentPage = path;
    try {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
      console.warn(`Timeout/error loading ${path}: ${e.message}`);
    }
  }

  await browser.close();

  if (findings.length === 0) {
    console.log('No XHR/fetch calls detected on page load.');
    console.log('Note: some APIs only fire on user interaction (form submit, table sort, etc).');
    console.log('Extend this script with page.click()/page.fill() calls per component to catch those.');
  } else {
    console.log(JSON.stringify(findings, null, 2));
  }

  require('fs').writeFileSync('api-results/api-discovery-results.json', JSON.stringify(findings, null, 2));
  console.log(`\nSaved ${findings.length} findings to api-discovery-results.json`);
})();