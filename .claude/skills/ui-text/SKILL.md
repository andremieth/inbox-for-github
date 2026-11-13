---
name: ui-text
description: Add or change user-visible text in Inbox for GitHub, in English and German. Use whenever a component needs a new label, hint, toast, tooltip or help line.
---

# Add or change UI text

1. Add the key to `src/ui/locales/en.ts` (the source) and `src/ui/locales/de.ts`. Group it with
   keys of the same prefix (`settings.`, `menu.`, `toast.`, `help.`, …).
2. Use `t("key", { name })` for plain text with `{name}` placeholders, `tRich` when a placeholder is
   markup. Never put a literal string in a component.
3. English in sentence case; German addresses the user with "du". Keep the two equally short where
   the UI is tight (chips, segments, menu entries).
4. `npm run typecheck` fails when `de.ts` misses a key (`de` is typed `Messages`), so run it.
5. Name shortcuts by the macOS glyphs ("⌘R", "⌃A", "⇧-click"), also in German: `t()` writes them
   out for Windows. A shortcut label a component builds itself goes through `tKey` or `tKeys`.
6. A text that names the Mac, macOS, the Dock or System Settings also needs its Windows wording:
   add the key to `enWindows` in `en.ts` and to `deWindows` in `de.ts`. `npm test` fails while a
   text Windows shows still says "Mac", "macOS" or "Dock", or a text of the help (`help.*`,
   `keys.*`) names the calendar, which Windows does not have.

Renaming a key is fine (it is internal); remove the old one from both files.
