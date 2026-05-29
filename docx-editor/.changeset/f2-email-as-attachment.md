---
'@eigenpal/docx-js-editor': minor
---

Add File → "Email as attachment…" (F2). Triggers the same save path
as Save, downloads the `.docx`, and opens a `mailto:` draft with
subject + body pre-filled. The browser can't auto-attach files for
security reasons, so the body and a toast both nudge the user to
drag the downloaded file into the email window.
