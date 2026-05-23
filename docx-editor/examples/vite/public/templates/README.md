# Home-page templates

Hand-authored `.docx` files that back the template gallery on the
Casual Editor home page (`examples/vite/src/Home.tsx`).

## Adding a new template

1. Author the file in Microsoft Word (or LibreOffice / Google Docs)
   and save as `.docx`. Real Word output produces the most fidelity
   coverage — synthesized OOXML is rougher around section properties,
   theme colors, and styles.
2. Drop the file into this directory. Use a filename matching the
   manifest entry's `source.path` (relative to this directory's URL
   root — e.g. `/templates/resume.docx`).
3. Open `examples/vite/src/templates/manifest.ts` and flip the
   matching entry from `kind: 'coming-soon'` to
   `kind: 'docx', path: '/templates/<filename>.docx'`.
4. Reload the editor — the card un-grays and clicking it loads the
   template.

## Card metadata (in `manifest.ts`)

| Field             | What it does                                                                            |
| ----------------- | --------------------------------------------------------------------------------------- |
| `id`              | Stable identifier; used as the `data-testid` on the card (`template-card-<id>`).        |
| `name`            | Card title.                                                                             |
| `description`     | One-line subtitle.                                                                      |
| `icon`            | Material Symbols Outlined glyph name — see https://fonts.google.com/icons.              |
| `accent`          | Soft pastel background for the icon panel.                                              |
| `source`          | `synthesized` (in-memory), `docx` (fetched), or `coming-soon` (disabled).               |
| `defaultFileName` | What the title-bar shows after the template lands in the editor.                        |

## Where the file is served from

Anything in `examples/vite/public/` is served at the root in dev and
prod. So `public/templates/resume.docx` is fetched as `/templates/resume.docx`.
The `loadTemplate()` helper does the `fetch` + `arrayBuffer()` and
hands the bytes to `<DocxEditor documentBuffer={…} />`.

## Why not synthesize templates from the `Document` model?

We can — `createEmptyDocument()` is exactly that — but real Word
output exercises styles, theme colors, multi-section breaks, list
numbering definitions, etc. in ways that synthetic builders don't.
Templates double as a fidelity-test corpus, so we prefer real `.docx`
authored by Word.
