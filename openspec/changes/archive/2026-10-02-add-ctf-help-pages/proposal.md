# Proposal

## Why

The CTF expects visitors to turn character codes into letters and to use `cat`, `curl` and `base64` in the site's terminal, but nothing on the site explains either. A beginner who has never seen a terminal or an ASCII table gets stuck on the tool rather than the puzzle, and the CTF main page already names "an ASCII table" as a tool without offering one.

## What Changes

- New help pages under the CTF main page, in both languages, linked from it:
  - `/de/ctf/ascii/` and `/en/ctf/ascii/`: an ASCII table for codes 0 to 127 with decimal, hexadecimal, binary and the character, plus a short text on how to read it.
  - `/de/ctf/terminal/` and `/en/ctf/terminal/`: how to open and use the site's terminal, and what `cat`, `curl` and `base64` do there, each with a neutral example the visitor can type. Pipes (`echo … | base64 -d`) are explained because the base64 examples use them.
- The explanations stay generic. They show how each command works with examples that have nothing to do with a challenge: no dotfiles, no `ls -a`, no private addresses, no flags.
- The help pages are `noindex` and stay out of the sitemap and the search index, like the rest of `/ctf/`.
- The CTF main page links to both help pages; the "ASCII table" entry in its tool list links to the table.
- Nothing changes in the terminal itself.

## Capabilities

### New Capabilities

- `ctf/help`: the CTF help pages, what each one contains, how they are reached, and that they explain tools without giving away a challenge.

### Modified Capabilities

- `ctf/start`: the "CTF main page content" requirement gains links to the help pages.

## Impact

- `src/content/pages/ctf/`: new prose files per help page and language, a new component for the help pages, `route.ts` gains one child route per help page next to the doors.
- `src/content.config.ts`: a new collection for the help pages; the existing `ctf` collection is narrowed to `ctf.{de,en}.md` so it does not pick up the new files.
- `src/lib/`: a small module that builds the ASCII rows (names of control characters included), tested in `tests/`.
- `ctf.de.md` / `ctf.en.md`: links to the help pages.
- Tests: help slugs must not collide with door slugs; built help pages are `noindex` and absent from sitemap and search index (already covered by the `/ctf/` checks in `tests/ctf-dist.test.ts`).
- No new dependencies, no third-party requests, no storage.
