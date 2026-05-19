# 07 — CI Recovery Tracker

Living tracker for the CI green-up work. Six e2e spec files surfaced
real failures once sharding revealed them (~169 unique test runs
failing, ~56 unique tests). Each fix lands as its own commit so the
diff is reviewable and the root-cause notes survive.

## Status

| Spec file | Failing tests | Status | Root cause | Fix |
|---|---|---|---|---|
| `e2e/tests/paragraph-styles.spec.ts` | ~30 | ✅ fixed | StylePicker is a Radix combobox now (not `<select>`); helper used `selectOption`. Style picker hid `Normal` when doc lacked the style. Style changes coalesced with prior typing in undo history. | Helper opens combobox + clicks role=option. StylePicker unions DEFAULT_STYLES with doc styles. ApplyStyle command calls `closeHistory()`. |
| `e2e/tests/fonts.spec.ts` | 1 | ✅ fixed | Computed-style assertion queried `[style*=font-family]` which matched a ruler-tick div (font-family: sans-serif) before the painted run. | Scope the query to `.layout-paragraph span[style*=font-family]`. |
| `e2e/tests/cursor-paragraph-ops.spec.ts` | TBD | ⏳ in flight | Ctrl+E center shortcut not firing | — |
| `e2e/tests/demo-docx.spec.ts` | ~3 | ⏳ in flight | Test looks for `text=demo.docx` on the page; app loads `docx-editor-demo.docx` | — |
| `e2e/tests/scenario-driven.spec.ts` | ~10 | ⏳ in flight | Line-spacing scenario — picker shape probably changed | — |
| `e2e/tests/formatting-persistence.spec.ts` | TBD | ⏳ in flight | Unknown | — |

## Adjacent fixes that landed alongside

- **Vite React dedupe** — workspace fix duplicated React; Radix Select crashed with `useMemo` null. (`examples/vite/vite.config.ts` → `dedupe: ['react','react-dom']`)
- **Alignment dropdown helper** — `editor.alignCenter()` instead of raw `Center (Ctrl+E)` button (popover-hidden).
- **List paragraph assertion** — query `.layout-list-marker` not stale `docx-list-*`/`data-paragraph-index`.
- **Border color split-button** — `.docx-color-picker-arrow` not the non-existent `.docx-color-picker-button`.
- **Toolbar testid** — `editor-toolbar` covers all shell variants.
- **E2e sharding** — 4-way matrix to land the suite under 8 min.
- **`.doc`-rename detection** — pre-flight magic-byte sniff in `unzipDocx`.
- **EMF/WMF placeholder** — sized, labelled, layout-stable fallback.

## EMF/WMF rendering (separate track)

`emf-converter@1.1.6` (MIT, pure-JS canvas-based EMF/WMF → PNG
data-URL) wired into `parser.ts` via a post-buildMediaMap async pass
(`emfWmfConverter.ts`). Headless callers (audit, Bun tests) no-op
because canvas APIs are absent. Browser path swaps the data URL so
the painter renders the real picture as `<img>`. Placeholder
remains the safety net for files the converter returns `null` on.
