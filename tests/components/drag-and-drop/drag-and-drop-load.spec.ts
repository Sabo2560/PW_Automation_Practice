// spec: specs/drag-and-drop.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragAndDropPage } from '../../pages/DragAndDropPage';

test.describe('Drag and Drop - Initial Load and Default State', () => {
  test('Page loads with both widgets, labels, and Insight section correctly rendered in their exact default states', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop' on a fresh browser context
    const consoleErrors = dragAndDropPage.trackConsoleErrors();
    const response = await dragAndDropPage.gotoDragAndDrop();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Drag and Drop' (level 1) is visible
    await expect(dragAndDropPage.heading).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect both 'form-label' elements in DOM order
    // expect: First label reads exactly 'Move task to Finished and verify alphabeticall sort' (verbatim
    // double-L typo — asserted as-is, not corrected)
    await expect(dragAndDropPage.formLabels.nth(0)).toHaveText('Move task to Finished and verify alphabeticall sort');
    // expect: Second label reads exactly 'Drag file to target location'
    await expect(dragAndDropPage.formLabels.nth(1)).toHaveText('Drag file to target location');

    // 3. Inspect the To Do column ('todo-column') and Finished column ('finished-column')
    // expect: 'todo-column' contains exactly 3 task cards with text, in DOM order: 'Review code', 'Deploy
    // app', 'Fix bug'
    await expect(dragAndDropPage.todoColumn.locator('[data-testid^="task-"]')).toHaveText([
      'Review code',
      'Deploy app',
      'Fix bug',
    ]);
    // expect: 'finished-column' contains exactly 1 task card with text 'Design web'
    await expect(dragAndDropPage.finishedColumn.locator('[data-testid^="task-"]')).toHaveText(['Design web']);

    // 4. Inspect the file widget area
    // expect: '[data-testid="file"]' is visible and present exactly once
    await expect(dragAndDropPage.file).toBeVisible();
    await expect(dragAndDropPage.file).toHaveCount(1);
    // expect: '[data-testid="drop-zone"]' is visible with text exactly 'Drop file here'
    await expect(dragAndDropPage.dropZone).toBeVisible();
    await expect(dragAndDropPage.dropZone).toHaveText('Drop file here');
    // expect: '[data-testid="button-reset-file-button"]' is NOT present in the DOM (0 elements)
    await expect(dragAndDropPage.resetFileButton).toHaveCount(0);

    // 5. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    await expect(dragAndDropPage.insightHeading).toBeVisible();

    // expect: The concept list contains exactly the items 'Move task between columns', 'Verify task status
    // update', 'Drop file into target area', 'Check file disappears on drop', 'Reset restores initial
    // state', in that order
    const conceptList = page.getByRole('list').filter({ hasText: 'Move task between columns' });
    await expect(conceptList.getByRole('listitem')).toHaveText([
      'Move task between columns',
      'Verify task status update',
      'Drop file into target area',
      'Check file disappears on drop',
      'Reset restores initial state',
    ]);

    // expect: A 'Github solution' link is visible with the expected href
    await expect(dragAndDropPage.githubSolutionLink).toBeVisible();
    await expect(dragAndDropPage.githubSolutionLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/dragAndDrop/dragAndDrop.spec.ts'
    );
  });

  test('Enumerate all data-testid elements on fresh load and confirm the exact inventory of 10, including the duplicate form-label pair', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop' and enumerate all '[data-testid]' elements via
    // page.locator('[data-testid]').all()
    await dragAndDropPage.gotoDragAndDrop();
    const testIds = await page
      .locator('[data-testid]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-testid')));

    // expect: Exactly 10 elements are returned
    expect(testIds).toHaveLength(10);

    // expect: The set of distinct testid VALUES is exactly: 'form-label' (appearing twice),
    // 'todo-column', 'finished-column', 'task-1', 'task-2', 'task-3', 'task-4', 'file', 'drop-zone' —
    // with 'button-reset-file-button' correctly ABSENT from a fresh load
    const counts = testIds.reduce<Record<string, number>>((acc, id) => {
      acc[id!] = (acc[id!] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      'form-label': 2,
      'todo-column': 1,
      'finished-column': 1,
      'task-1': 1,
      'task-2': 1,
      'task-3': 1,
      'task-4': 1,
      file: 1,
      'drop-zone': 1,
    });
    expect(counts['button-reset-file-button']).toBeUndefined();
  });
});
