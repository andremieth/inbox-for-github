---
name: file-issue
description: File a GitHub issue in andremieth/inbox-for-github, the Windows edition, for deferred work, a bug or a feature idea that concerns Windows or this fork. Use when work is postponed or the user asks to open an issue.
---

# File an issue

This repository takes what concerns Windows or the fork itself. A bug or an idea a Mac user would
notice as well belongs upstream, in `julian-wendt/inbox-for-github`: say so to the user instead of
filing it here, and file or comment there only on their explicit yes for that action.

1. **Search first:** `gh issue list -R andremieth/inbox-for-github --state all --search "<words>"`.
   Comment on an existing issue instead of filing a duplicate; group related small items.
2. **Title:** English, with a prefix for new issues: `[Bug]`, `[Feature]` or `[Task]`. Existing
   issues keep their titles.
3. **Body, in English:** Goal or Problem, what exists today (with file and function names),
   the proposal, and "To decide" for open questions. Name measured costs or facts with their date.
   The issue is public: follow "Public content" in `CONTRIBUTING.md`. A real item that prompted it
   is described with the demo's fictional names, never linked or quoted.
4. `gh issue create -R andremieth/inbox-for-github --title "…" --body-file <file>`, then give the
   user the link.
5. When closing an issue, comment what was done with the commit hashes, and what is left.
