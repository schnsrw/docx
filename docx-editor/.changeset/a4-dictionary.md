---
'@eigenpal/docx-js-editor': minor
---

Add Tools → Dictionary + `Ctrl/Cmd+Shift+Y` (A4). Looks up the
selected word via the free public `dictionaryapi.dev` endpoint and
shows every meaning's part-of-speech + first definition. Loading and
error states route through the shared `PanelState` helper (its first
non-empty-state adopter), so the dialog matches the rest of the
editor's chrome.
