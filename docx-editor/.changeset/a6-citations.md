---
'@eigenpal/docx-js-editor': minor
---

Add Tools → Citations (A6 v0): a local-only citation manager.
Add-form (author / title / year / URL) on top, list of saved
entries on the bottom with a shared APA / MLA / Chicago style radio.
Insert drops the formatted citation text at the cursor and wraps the
URL substring in a hyperlink mark. Storage is `localStorage` — the
real `.docx` bibliography-field round-trip is the future follow-up.
