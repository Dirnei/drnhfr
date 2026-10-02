# Tasks

## 1. ASCII data

- [x] 1.1 Write `tests/ascii.test.ts` first: 128 rows; row 65 is `41` / `01000001` / `A`; rows 0, 10, 32, 127 read `NUL`, `LF`, `SP`, `DEL`; every control row is flagged. Verify it fails.
- [x] 1.2 Implement `src/lib/ascii.ts` and verify `npm test -- ascii` passes.

## 2. Content collection and files

- [x] 2.1 Narrow the `ctf` collection to `ctf.{de,en}.md` and add `ctfHelp` (`title`, `description`, `heading`, optional `columns { dec, hex, bin, char }`) loading the same folder without `ctf.*.md`; fall back to the `help-` prefix from design.md if the negated pattern is rejected. Add `getCtfHelpPages(locale)` to `src/lib/entries.ts`. Verify `npm run check` reports 0/0/0.
- [x] 2.2 Write `ascii.de.md` / `ascii.en.md`: what ASCII is, how to read a row, why upper and lower case are 32 apart; `columns` labels in frontmatter. Follow the copy rules in CLAUDE.md (no em dashes, no tricolons, plain). Verify `tests/content-pages.test.ts` passes.
- [x] 2.3 Write `terminal.de.md` / `terminal.en.md`: opening the terminal (and that it needs tablet width), Tab and arrow keys, then `cat`, `curl`, `base64` with typed examples and their output, then the pipe with `echo aGFsbG8= | base64 -d`. Only neutral examples, nothing from a challenge. Run each example in the real terminal on the built site and verify the output matches the page.

## 3. Routes and page

- [x] 3.1 Add `HelpPage.astro`: `BaseLayout` with `noindex`, `altHref` to the same slug in the other locale, heading, prose with `is:global` styles under `.ctf-help`, and the ASCII table when `page === 'ascii'`, built from `src/lib/ascii.ts` with column labels from frontmatter. Verify `npm run check` is 0/0/0.
- [x] 3.2 Extend `src/content/pages/ctf/route.ts` with one child per help entry next to the doors. Verify `npm run build` emits `dist/{de,en}/ctf/{ascii,terminal}/index.html`.
- [x] 3.3 Style the table: four groups of 32 side by side on wide screens, stacked below a breakpoint, control abbreviations in `--text-muted`, no radii, no red at rest. Verify in headless Chromium against `dist/` at 1280 and 375 px (without `--hide-scrollbars`) that `document.documentElement.scrollWidth <= innerWidth` and all 128 rows render.

## 4. CTF main page links

- [x] 4.1 In `ctf.de.md` / `ctf.en.md`, link the "ASCII-Tabelle" / "ASCII table" entry to the table and add links to both help pages in "So funktioniert dieses Spiel" / "How this game works". Verify `npm run check:links` passes.

## 5. Guards

- [x] 5.1 Add a test that no `ctfHelp` slug equals a door in `public.json` and that the `ascii` entry in both languages has `columns`. Verify it passes, and fails when a door is temporarily renamed to `ascii`.
- [x] 5.2 Add a test that runs the terminal page's base64 examples through the real `base64` command with `stubContext` and compares with the outputs on the page, and that the help markdown contains no `ls -a`, no private address (`10.`, `172.16`–`172.31`, `192.168.`) and no `drnhfr{`. Verify both pass.
- [x] 5.3 Extend `tests/ctf-dist.test.ts` so each built help page has `noindex` and its path is absent from sitemap and both `search.json`. Verify `npm run build && npm test` passes.

## 6. Final checks

- [x] 6.1 Restart `astro dev` after deleting `.astro/data-store.json` and confirm both help pages and the CTF main page render on port 4321 in both languages.
- [x] 6.2 Run `npm run check`, `npm test`, `npm run check:links`, `npm run check:gdpr` and verify all four pass.
