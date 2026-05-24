/**
 * Smoke tests for the home-page template gallery (Casual Editor
 * landing view). The 200+ existing e2e specs assume direct editor
 * mount, so they rely on `?e2e=1` skipping the home page — this
 * suite pins that contract from both directions.
 */
import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders template gallery at / (no e2e flag)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
    // The Blank-document card is always present (synthesized, no fetch).
    await expect(page.locator('[data-testid="template-card-blank"]')).toBeVisible();
    // Open-from-disk affordance is always there too.
    await expect(page.locator('[data-testid="home-open-from-disk"]')).toBeVisible();
    // The editor should NOT be mounted yet.
    await expect(page.locator('[data-testid="docx-editor"]')).toHaveCount(0);
  });

  test('clicking Blank document transitions to the editor', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="template-card-blank"]').click();
    await expect(page.locator('[data-testid="docx-editor"]')).toBeVisible({ timeout: 10_000 });
    // Home should be gone.
    await expect(page.locator('[data-testid="home-page"]')).toHaveCount(0);
  });

  test('?e2e=1 skips the home page and mounts the editor directly', async ({ page }) => {
    // This is the contract the 200+ existing specs depend on — every
    // EditorPage.goto() call appends ?e2e=1.
    await page.goto('/?e2e=1');
    await expect(page.locator('[data-testid="docx-editor"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="home-page"]')).toHaveCount(0);
  });

  test('?skipHome=1 also skips home (embedder escape hatch)', async ({ page }) => {
    await page.goto('/?skipHome=1');
    await expect(page.locator('[data-testid="docx-editor"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="home-page"]')).toHaveCount(0);
  });

  test('Resume template loads from /templates/resume.docx and renders content', async ({
    page,
  }) => {
    // Pins that scripts/make-home-templates.mjs emits a valid .docx the
    // editor can actually parse — silent corruption in the generator
    // would still pass the typecheck + every other test.
    await page.goto('/');
    await page.locator('[data-testid="template-card-resume"]').click();
    await expect(page.locator('[data-testid="docx-editor"]')).toBeVisible({ timeout: 10_000 });
    // The Resume template's hero name is the easiest unique marker.
    await expect(page.locator('.ProseMirror')).toContainText('Alex Morgan', {
      timeout: 10_000,
    });
  });
});
