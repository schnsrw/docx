---
'@eigenpal/docx-js-editor': patch
---

Close the X3 focus-ring gap: the table hover-insert "+" button now
shows a keyboard outline (via a new opt-in `.ep-focus-ring` utility
class), and the Toolbar's heading-style / character-spacing /
section-break / field submenu items gain `role="menuitem"` so they
pick up the existing menu-item ring rule. No double-rings — the
opt-in class avoids the global selectors that risked it.
