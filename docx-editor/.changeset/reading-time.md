---
'@eigenpal/docx-js-editor': patch
---

Add a "~N min read" estimate to the status bar, alongside word
count. Uses a 200-wpm prose-average baseline (the same convention
Medium uses) and rounds up so the user is more likely to
over-budget than under. Hidden on empty documents.
