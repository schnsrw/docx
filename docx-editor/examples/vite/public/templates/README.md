# Home-page templates

`.docx` files that back the template gallery on the Casual Editor
home page (`examples/vite/src/Home.tsx`). All current entries are
synthesized programmatically by `scripts/make-home-templates.mjs` —
re-run that script if you change the content.

## Files in this directory

| File                          | What it is                                                       |
| ----------------------------- | ---------------------------------------------------------------- |
| `resume.docx`                 | Single-column résumé with experience and skills.                 |
| `letter.docx`                 | Formal letter with sender block, salutation, body, closing.      |
| `meeting-notes.docx`          | Agenda, discussion, action items, next-meeting block.            |
| `project-proposal.docx`       | Executive summary, objectives, approach, milestones table.       |
| `thumbs/<id>.svg`             | 200×140 SVG mockup shown on the home-page card.                  |

The Blank and Sample cards don't have files here — Blank uses the
in-memory `createEmptyDocument()` and Sample reads `/sample.docx`
from the parent `public/` directory.

## Adding a new template

There are two paths:

**A. Add via the generator script (recommended for simple templates):**

1. Open `scripts/make-home-templates.mjs`. Define a new body via the
   `h` / `p` / `r` / `bullet` / `numbered` / `table` helpers.
2. Add a `writeDocx(..., NEW_BODY)` call at the bottom of the script.
3. Add a matching SVG thumbnail to `public/templates/thumbs/`.
4. Push an entry into `examples/vite/src/templates/manifest.ts`.
5. Run `bun scripts/make-home-templates.mjs` to regenerate.

**B. Drop in a hand-authored .docx (recommended for complex Word output):**

1. Author the file in Microsoft Word and save as `.docx`. Real Word
   output exercises styles, theme colors, and section properties in
   ways the synthesized OOXML can't.
2. Drop it into this directory.
3. Add the manifest entry (`kind: 'docx', path: '/templates/<file>.docx'`).
4. Add a matching SVG thumbnail.

## Card metadata (in `manifest.ts`)

| Field             | What it does                                                                            |
| ----------------- | --------------------------------------------------------------------------------------- |
| `id`              | Stable identifier; used as the `data-testid` on the card (`template-card-<id>`).        |
| `name`            | Card title.                                                                             |
| `description`     | One-line subtitle.                                                                      |
| `icon`            | Material Symbols Outlined glyph name — see https://fonts.google.com/icons.              |
| `accent`          | Soft pastel background for the icon panel.                                              |
| `source`          | `synthesized` (in-memory), `docx` (fetched), or `coming-soon` (disabled).               |
| `thumbnail`       | Path to the per-template SVG mockup in `public/templates/thumbs/`.                      |
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
