---
'@eigenpal/docx-js-editor': minor
---

Command palette is now actually fuzzy — the docstring already
claimed it. Items are scored on ordered subsequence with a
word-boundary bonus (`+5` at start / after space / after `>`) and a
consecutive-match bonus (`+3`); skipped characters between matches
cost `-1` so a tight run beats a sprawling one. Results sort by
score, so `expdf` jumps straight to "Export as PDF" and `fr` ranks
"Find and Replace" first.
