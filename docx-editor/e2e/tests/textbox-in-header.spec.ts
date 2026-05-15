/**
 * Textbox-in-header rendering tests — issue #318 (header edge case)
 *
 * Issue #318 explicitly notes: "In some templates, the textbox is only
 * visible in Microsoft Word when editing the header section, but it is
 * not rendered in the editor at all."
 *
 * Body textboxes are handled correctly (see textbox-rendering.spec.ts —
 * 10/10 pass on textbox-test.docx). The header path is separate; we
 * suspect the header parser doesn't invoke textBoxParser / shapeParser
 * (line 622 of packages/core/src/docx/headerFooterParser.ts is just a
 * `hasImages` type-check, not actual parsing).
 *
 * Fixture: `e2e/fixtures/header-with-textbox.docx`, built by
 * `scripts/make-header-textbox-fixture.mjs`. It injects an inline
 * `<wps:txbx>` with "Header Textbox" + body text into word/header1.xml
 * of `template-with-hf-rule.docx`.
 *
 * Expected: this batch FAILS until header textbox parsing is wired up.
 */

import { test, expect } from '@playwright/test';
import { EditorPage } from '../helpers/editor-page';

const FIXTURE = 'fixtures/header-with-textbox.docx';
const EDITOR = 'docx-editor';

test.describe('Textbox in header — issue #318 (header path)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForReady();
    await editor.loadDocxFile(FIXTURE);
    await page.waitForTimeout(500); // give the layout-painter a beat after load
  });

  test('header textbox heading appears in painter output', async ({ page }) => {
    await expect(
      page.getByTestId(EDITOR).getByText('Header Textbox', { exact: true })
    ).toBeVisible({ timeout: 5000 });
  });

  test('header textbox body appears in painter output', async ({ page }) => {
    await expect(
      page.getByTestId(EDITOR).getByText('A textbox inside the page header.')
    ).toBeVisible({ timeout: 5000 });
  });

  test('a .layout-textbox container exists for the header textbox', async ({ page }) => {
    const containers = page.locator('.layout-textbox');
    // The fixture is built on template-with-hf-rule.docx which has no
    // body textboxes, so a count >= 1 means our header textbox got a
    // container.
    await expect(containers).toHaveCount(1, { timeout: 5000 });
  });
});
