---
'@eigenpal/docx-js-editor': minor
---

**New: `wordCompat` prop on `<DocxEditor>`.** Opt-in switch for Word-style rendering quirks. Off by default — the renderer stays faithful to the literal OOXML, matching how LibreOffice and Google Docs draw.

When `true`, the painter emulates Word's "firstRow-only borders close the last body row" behavior (GH #395): when `<w:tblBorders>` declares only `firstRow` styling, Word also draws the firstRow's bottom border on the last cell of the last body row when that cell has no `<w:bottom>` of its own. Useful for hosts building Word-comparison UIs or side-by-side viewers.

```tsx
<DocxEditor wordCompat document={doc} />
```

Threads through `<DocxEditor>` → `<PagedEditor>` → `renderPages` → `RenderContext.wordCompat` — third-party `PagedEditor` users can flip the same prop.
