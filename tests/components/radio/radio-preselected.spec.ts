// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe('Radio - Pre-Selected Default (Foo/Bar group)', () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
    await radioPage.gotoRadio();
  });

  test('Bar is checked by default on fresh load and Foo is not', async () => {
    // 1. Navigate to '/components/radio' on a fresh context and, without any interaction,
    //    inspect the foobar-radio group
    // expect: '#Bar' is checked
    // expect: '#Foo' is NOT checked — confirming this is a genuine static default rendered on every
    // fresh load, not leftover state from a prior test
    await expect(radioPage.barRadio).toBeChecked();
    await expect(radioPage.fooRadio).not.toBeChecked();
  });

  test('Selecting Foo switches the checked state away from Bar, and the switch is fully reversible', async () => {
    // 1. Navigate to '/components/radio', check '#Foo'
    await radioPage.fooRadio.check();

    // expect: '#Foo' is checked
    // expect: '#Bar' is NOT checked
    await radioPage.expectOnlyChecked(radioPage.fooRadio, [radioPage.barRadio]);

    // 2. Check '#Bar' again
    await radioPage.barRadio.check();

    // expect: '#Bar' is checked
    // expect: '#Foo' is NOT checked, confirming a full round-trip back to the original default state
    await radioPage.expectOnlyChecked(radioPage.barRadio, [radioPage.fooRadio]);
  });
});
