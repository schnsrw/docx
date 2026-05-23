---
'@eigenpal/docx-js-editor': minor
---

Round-trip fidelity, dark theme, and ODT/MD/TXT export via `@schnsrw/core`.

**New: ODT / Markdown / plain-text export.** The toolbar's Export menu now offers ODT, Markdown, and plain-text in addition to DOCX. Conversion runs off-thread in a Web Worker bridged to the `@schnsrw/core` WASM converter — added as a new runtime dependency (`@schnsrw/core@^0.1.1`). DOCX export is unchanged and still routes through the editor's own serializer.

**New: dark theme.** Real dark mode driven by semantic surface CSS variables (`--doc-surface`, `--doc-text-on-surface`, etc.) rather than CSS inversion. View → Theme picks Light / Dark / System, and the choice persists across reloads. Every dialog, dropdown, sidebar, ribbon button, toolbar icon, status bar, and context menu was reviewed and ported off hardcoded light colors. `[data-theme="dark"]` sets `color-scheme: dark` so native form controls follow.

**New: UX.**
- Command palette (`⌘⇧P`) with fuzzy search over every menu action.
- Status bar at the page bottom: page indicator, word/character count, zoom slider, zoom shortcuts (`⌘=` / `⌘-` / `⌘0`).
- Hover-to-switch menu bar: opening one menu and hovering a sibling trigger immediately switches; arrow keys navigate between menus; one-click swap fixed (was previously a two-click bug from a stacking-context regression).
- Save status indicator in the title bar (●Unsaved / Saving…) plus a `beforeunload` guard when there are unsaved changes.
- Phased loading indicator on first file open: "Reading → Parsing → Building layout → Still working" with an elapsed-seconds counter after 1.5 s.
- File Properties dialog gets section headers (Metadata / File info).
- Keyboard-shortcut chips in toolbar tooltips (Bold, Italic, Underline, Strike, Link, Super/Subscript, Undo, Redo, Clear formatting, list buttons, indent/outdent).
- Toolbar gets an Insert Image button next to Link.
- View menu (zoom in/out/reset, theme picker) and full Edit / Format menus mirrored into the title bar.
- About dialog brand-aligned with the title bar document icon.
- First load opens a blank document instead of the upstream sample.

**Round-trip fidelity fixes** — every fixture in the audit suite now round-trips with zero parse-but-drop tags:
- Empty self-closing `<w:pBdr/>`, `<w:spacing/>`, `<w:ind/>`, `<w:rPr/>` inside `<w:pPr>` survive via a `presentEmpty` marker on `ParagraphFormatting`.
- Section properties `<w:pgNumType>`, `<w:formProt>`, `<w:textDirection>` parsed and serialized.
- `<w:footnotePr/>` and `<w:endnotePr/>` round-trip in their self-closing form when no children are populated.
- `<w:tblCellMar>` logical-side names (`w:start` / `w:end`) preserved instead of being coerced to `w:left` / `w:right`.
- Drawing percent-of-anchor hints (`wp14:sizeRelH` / `wp14:sizeRelV` with `pctWidth` / `pctHeight`) parsed into `Image.relativeSize` and re-emitted.
- Complex fields (`<w:fldChar>` + `<w:instrText>`) inside `<w:ins>` and `<w:del>` no longer dropped — runs stay raw inside tracked context instead of being coalesced into a `ComplexField` the surrounding filter would discard.
- `<w:highlight w:val="none"/>` (the explicit no-highlight override, ECMA-376 §17.18.40) round-trips instead of being stripped at serialize time.
- Run border `<w:bdr>` (§17.3.2.4) now modeled on `TextFormatting.border` and round-tripped.
- `<w:bookmarkEnd>` anchored as a direct child of `<w:tbl>` (Word does this when a range starts inside a cell and closes at the table boundary) survives via `Table.trailingBookmarks`.
