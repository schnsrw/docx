import { test, expect } from '@playwright/test';
import { EditorPage } from '../helpers/editor-page';

/**
 * Custom-hex highlight round-trip — UI end-to-end.
 *
 * Unit coverage (`highlight-roundtrip.test.ts`) pins the parser/
 * serializer contract: a custom-hex highlight serializes via
 * `<w:shd>` (since `<w:highlight>` only accepts the named-color
 * enum), and the parser rehydrates it back into `formatting.highlight`
 * when re-reading.
 *
 * This spec walks the user-visible flow: pick a custom hex color from
 * the highlight dropdown, apply it to selected text, save the document
 * to a buffer, reload it from that buffer, and assert the same run still
 * carries the highlight. If the round-trip dropped the semantic label,
 * the highlight mark would be missing on reload.
 */

async function readHighlightsOnFirstParagraph(
  page: import('@playwright/test').Page
): Promise<string[]> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = (window as any).__editorRef?.current;
    if (!handle) return [];
    const view = handle.getEditorRef?.()?.getView?.();
    if (!view) return [];
    const out: string[] = [];
    const paragraph = view.state.doc.firstChild;
    if (!paragraph) return [];
    paragraph.descendants(
      (node: { isText?: boolean; marks: { type: { name: string }; attrs: Record<string, unknown> }[] }) => {
        if (!node.isText) return;
        for (const mark of node.marks) {
          if (mark.type.name === 'highlight') {
            out.push(String((mark.attrs as { color?: string }).color ?? ''));
          }
        }
      }
    );
    return out;
  });
}

test('custom-hex highlight survives a save → reload cycle', async ({ page }) => {
  const editor = new EditorPage(page);
  await page.goto('/?e2e=1');
  await editor.waitForReady();
  await editor.newDocument();
  await editor.focus();

  // Type some text and select it.
  await editor.typeText('Highlight me');
  await editor.selectAll();

  // Apply a custom hex highlight (FFEB3B = material yellow — not in the
  // named-color enum, so it has to ride the `<w:shd>` fallback).
  await editor.setHighlightColor('FFEB3B');
  await page.waitForTimeout(150);

  // Sanity: the highlight is on the run pre-save.
  const before = await readHighlightsOnFirstParagraph(page);
  expect(before.length).toBeGreaterThan(0);
  expect(before[0].toUpperCase()).toBe('FFEB3B');

  // Save → reload. The save returns the serialized .docx buffer; we
  // hand it straight back to `loadDocumentBuffer` so the document
  // is re-parsed from XML (the only path that exercises the
  // `<w:shd>` → `formatting.highlight` rehydration).
  await page.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = (window as any).__editorRef?.current;
    const buf: ArrayBuffer = await handle.save();
    await handle.loadDocumentBuffer(buf);
  });
  await page.waitForTimeout(400);

  // After reload the highlight should still be there.
  const after = await readHighlightsOnFirstParagraph(page);
  expect(after.length).toBeGreaterThan(0);
  expect(after[0].toUpperCase()).toBe('FFEB3B');
});
