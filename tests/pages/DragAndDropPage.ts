import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type TaskTestId = 'task-1' | 'task-2' | 'task-3' | 'task-4';

/**
 * Page Object for the Drag and Drop component (https://www.automationplayground.dev/components/dragAndDrop),
 * which presents two independent widgets built on the browser's native HTML5 drag-and-drop API (NOT the
 * mouse-transform dragging used by /components/drag — see DragPage.ts, which must not be reused/extended here):
 * (1) a 2-column Kanban task board ("To Do" / "Finished") holding 4 task cards, and (2) a single
 * file-icon-to-drop-zone widget with an Uploading/Reset lifecycle. See specs/drag-and-drop.plan.md for full detail.
 *
 * Task testids are STABLE and tied to original card identity/text regardless of which column currently
 * contains them — never reassigned based on position (confirmed live, see plan).
 */
export class DragAndDropPage extends BasePage {
  readonly heading: Locator;
  readonly formLabels: Locator;
  readonly todoColumn: Locator;
  readonly finishedColumn: Locator;
  readonly file: Locator;
  readonly dropZone: Locator;
  readonly resetFileButton: Locator;
  readonly insightHeading: Locator;
  readonly githubSolutionLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Drag and Drop', level: 1 });
    // Two elements share this exact testid on this page (the only duplicate testid, confirmed
    // live) — first precedes the task board, second precedes the file widget, in DOM order.
    this.formLabels = page.getByTestId('form-label');
    this.todoColumn = page.getByTestId('todo-column');
    this.finishedColumn = page.getByTestId('finished-column');
    this.file = page.getByTestId('file');
    this.dropZone = page.getByTestId('drop-zone');
    // Only present in the DOM after a successful file drop.
    this.resetFileButton = page.getByTestId('button-reset-file-button');
    this.insightHeading = page.getByRole('heading', { name: 'Insight', level: 2 });
    this.githubSolutionLink = page.getByRole('link', { name: 'Github solution' });
  }

  /**
   * Navigates to '/components/dragAndDrop' and waits for the 'file' element to be visible,
   * confirming client-side hydration has completed — page.goto() resolves on the load event,
   * which can land before React hydration finishes on slower browsers.
   */
  async gotoDragAndDrop() {
    const response = await this.goto('/components/dragAndDrop');
    await expect(this.file).toBeVisible();
    return response;
  }

  /** Locator for a single Kanban task card by its stable testid ('task-1'..'task-4'). */
  task(testId: TaskTestId): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Reads the visible text of all direct task-card children of a Kanban column, in DOM order —
   * the load-bearing helper for order/sort assertions (membership alone is not sufficient for
   * most task-board scenarios, since exact order is what's actually under test).
   */
  async getColumnTaskTexts(column: Locator): Promise<string[]> {
    return column.locator('[data-testid^="task-"]').allTextContents();
  }

  /**
   * Drags a source locator (a task card or the file icon) onto a target locator by manually
   * dispatching the native DragEvent sequence (dragstart → dragenter → dragover → drop → dragend)
   * through a single shared DataTransfer, rather than Playwright's coordinate-based locator.dragTo().
   * Public since it takes arbitrary source/target locators, which dragTaskTo/dragFileToDropZone/
   * dragFileTo below don't fully cover (e.g. dragging the file icon onto something other than its own
   * drop-zone).
   *
   * This page previously used dragTo({ steps }) with a pre-drag scroll-both-into-view step. That was
   * abandoned after live debugging with instrumented document-level event listeners showed it failing
   * in TWO distinct ways on Firefox/WebKit, not just the originally-suspected cross-widget/long-distance
   * one:
   * - Cross-widget (task board → far-away file drop-zone): the in-progress scroll needed mid-gesture
   *   could silently drop the entire native drag session (zero events fired, not even 'dragstart').
   * - Same-widget, same-board task-to-column drags (short distance, NOT the scenario the old scroll
   *   mitigation targeted): confirmed live that as a column's content grows across sequential drags
   *   within one test, dragTo()'s interpolated mouse path can drift off both the intended target AND
   *   the pre-drag scroll centering — e.g. a second drag's captured event trace showed 'dragenter'/
   *   'dragover' cycling across 'todo-column', then the unrelated shared 'form-label' element, and
   *   ending there with 'dragend' and NO 'drop' ever firing — a silent no-op drop, not a wrong assertion.
   * Manual dispatch sidesteps both failure modes entirely: it targets the resolved elements directly
   * and never depends on viewport position, scroll state, or interpolated screen coordinates. This is
   * also Playwright's own documented fallback pattern ("Dragging manually") for native HTML5 DnD pages
   * that don't behave reliably under dragTo() simulation.
   */
  async drag(source: Locator, target: Locator) {
    const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());
    await source.dispatchEvent('dragstart', { dataTransfer });
    await target.dispatchEvent('dragenter', { dataTransfer });
    await target.dispatchEvent('dragover', { dataTransfer });
    await target.dispatchEvent('drop', { dataTransfer });
    // dragend completes the gesture on the ORIGIN element, but a successful drop can remove that element
    // from the DOM as part of handling it (e.g. the file widget's icon disappears once accepted) — in that
    // case there is nothing left to dispatch on. Skipping it there is safe: dragend only cleans up the
    // source's own drag-affordance state, it plays no part in the target/app-state mutation already done
    // by 'drop' above.
    if ((await source.count()) > 0) {
      await source.dispatchEvent('dragend', { dataTransfer });
    }
  }

  /** Drags a Kanban task card onto a target column. */
  async dragTaskTo(taskTestId: TaskTestId, targetColumn: Locator) {
    await this.drag(this.task(taskTestId), targetColumn);
  }

  /** Drags the file widget's draggable icon onto its own drop-zone. */
  async dragFileToDropZone() {
    await this.drag(this.file, this.dropZone);
  }

  /** Drags the file widget's draggable icon onto an arbitrary target locator (e.g. an invalid drop target). */
  async dragFileTo(targetLocator: Locator) {
    await this.drag(this.file, targetLocator);
  }
}
