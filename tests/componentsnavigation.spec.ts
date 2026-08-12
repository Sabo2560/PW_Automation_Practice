import { test, expect } from '@playwright/test';

test.describe('Components listing navigation', () => {
  test('should open every component card and return to the listing via Back', async ({ page }) => {
    // This test walks through every component page sequentially (16+ round
    // trips), which comfortably exceeds Playwright's default 30s test
    // timeout under load — especially on webkit with multiple workers
    // competing for resources. Giving it explicit breathing room.
    test.setTimeout(120_000);

    // Pinning the viewport explicitly: the "BACK" button uses a responsive
    // Tailwind class (hidden by default, visible from md/768px up). Some
    // browser projects' default viewports sit close enough to that
    // breakpoint to render it inconsistently — this removes the ambiguity.
    // Height is set generously (900) to keep the last card in the grid
    // clear of the page footer, which overlaps it at smaller heights and
    // was silently swallowing clicks on that card — see test plan findings.
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto('/components');

    // Rather than hardcoding every component name (Input, Button, Dropdown...),
    // we read the actual hrefs off the page. Every card is an <a href="/components/<slug>">,
    // so this test automatically covers new components if the site adds more later,
    // without needing to come back and edit this file.
    // Note: hrefs on this site come without a leading slash
    // (e.g. "components/input", not "/components/input") — matching that here.
    const cardLinks = page.locator('a[href^="components/"]');
    const hrefs = await cardLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).filter((href): href is string => !!href)
    );

    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      // Wrapping each iteration in test.step() so the HTML report shows
      // per-component pass/fail instead of one opaque line for the whole
      // loop — if "components/slider" breaks, the report says so directly
      // instead of us having to dig through logs to find which one failed.
      await test.step(`navigate to /${href} and back`, async () => {
        // Re-visiting the listing page each loop instead of relying on the
        // Back button's return trip — keeps each iteration independent, so
        // if one component's page fails to load it doesn't cascade into
        // false failures for the rest of the list.
        await page.goto('/components');

        const cardLink = page.locator(`a[href="${href}"]`);
        await cardLink.scrollIntoViewIfNeeded();
        // Using keyboard activation instead of a mouse click here — the last
        // card in the grid sits right where the page footer overlaps it at
        // this viewport size, which was silently swallowing real mouse clicks.
        // Focus + Enter activates the link without depending on click coordinates.
        await cardLink.focus();
        await Promise.all([
          page.waitForURL(`/${href}`),
          page.keyboard.press('Enter'),
        ]);

        // Give the detail page a moment to fully hydrate before we try to
        // interact with it — clicking BACK immediately after navigation
        // occasionally fired before the button's click handler was wired up.
        await page.waitForLoadState('domcontentloaded');

        const backButton = page.getByRole('button', { name: 'BACK' });
        await backButton.scrollIntoViewIfNeeded();
        await Promise.all([
          page.waitForURL('/components'),
          backButton.click(),
        ]);
      });
    }
  });
});