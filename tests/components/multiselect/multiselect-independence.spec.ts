// spec: specs/multiselect.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { MultiselectPage } from '../../pages/MultiselectPage';

test.describe('Multiselect - Cross-Form Independence', () => {
  let multiselectPage: MultiselectPage;

  test.beforeEach(async ({ page }) => {
    multiselectPage = new MultiselectPage(page);
    await multiselectPage.gotoMultiselect();
  });

  test('Interacting with one form does not alter the chip state or option list of either other form', async () => {
    // 1. Record form-2's and form-3's chip counts and text as a baseline
    // expect: Baseline recorded matches the documented defaults (form-2: 0 chips; form-3: 2 chips, 'Option 4' and 'Option 5')
    await expect(multiselectPage.chips(multiselectPage.form2)).toHaveCount(0);
    const form3Baseline = await multiselectPage.getChipTexts(multiselectPage.form3);
    expect(form3Baseline).toEqual(['Option 4', 'Option 5']);

    // 2. In form-1 only: open its dropdown, select 'Option 2' and 'Option 6', then filter with text 'zzz' to trigger 'No Options Available' within form-1
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 2');
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 6');
    await multiselectPage.filterOptions(multiselectPage.form1, 'zzz');

    // expect: form-1 shows exactly 2 chips ('Option 2', 'Option 6') and 'No Options Available' text scoped within form-1
    await expect(multiselectPage.chips(multiselectPage.form1)).toHaveText(['Option 2', 'Option 6']);
    await expect(multiselectPage.noOptionsAvailable(multiselectPage.form1)).toHaveText('No Options Available');

    // 3. Re-read form-2's and form-3's state without navigating away
    // expect: form-2 still has exactly 0 chips (unchanged from baseline)
    await expect(multiselectPage.chips(multiselectPage.form2)).toHaveCount(0);
    // expect: form-3 still has exactly 2 chips: 'Option 4' and 'Option 5' (unchanged from baseline)
    const form3AfterChips = await multiselectPage.getChipTexts(multiselectPage.form3);
    expect(form3AfterChips).toEqual(form3Baseline);
    // expect: confirming form-1's selection, filtering, and empty-state trigger had zero cross-contamination effect on the other two independent widgets
  });

  test('No API/network requests fire as a result of any multiselect interaction across all three forms (purely client-side component)', async ({
    page,
  }) => {
    // 1. Navigate to '/components/multiselect', begin recording network requests, then interact with all three forms
    // (select options in form-1, exhaust form-2, remove and re-add a chip in form-3, and type a search filter in form-1)
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      // Only track requests that look like data/API calls, not standard page assets
      const looksLikeApiCall = request.method() !== 'GET' || url.includes('/api/');
      if (!url.includes('/components/multiselect') && request.resourceType() !== 'document' && looksLikeApiCall) {
        apiRequests.push(url);
      }
    });

    // select options in form-1
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 2');
    // type a search filter in form-1
    await multiselectPage.filterOptions(multiselectPage.form1, '3');

    // exhaust form-2
    await multiselectPage.openForm(multiselectPage.form2);
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 1');
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 2');
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 3');

    // remove and re-add a chip in form-3
    await multiselectPage.removeChip(multiselectPage.form3, 'Option 4');
    await multiselectPage.selectOption(multiselectPage.form3, 'Option 4');

    // expect: No XHR/fetch network request specific to any multiselect action is observed (only the pre-existing
    // Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component
    // page in this suite) — confirming this plan requires no API-level test coverage
    expect(apiRequests).toEqual([]);
  });
});
