---
'@eigenpal/docx-js-editor': minor
---

Word convention: `Cmd/Ctrl+Enter` inserts a page break at the
cursor. Bound in `PageBreakExtension`'s `onSchemaReady` so hosts
that drop the page-break node from their schema don't pick up a
no-op binding. Documented in the Keyboard Shortcuts dialog under
Editing.
