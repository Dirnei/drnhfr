# Design

## Context

See proposal.md for why. Relevant current state:

- `src/content/pages/ctf/route.ts` declares the `ctf` route and one child per door (`publicData.doors`), each rendered by `DoorPage.astro`. Children are joined onto the base path by `collectRoutes()` in `src/lib/page-routes.ts`, so a child slug sits directly next to the door slugs.
- The `ctf` collection in `src/content.config.ts` loads `src/content/pages/ctf` with the default pattern `*.{de,en}.md`. Any new markdown file in that folder would be parsed against the `ctf` schema and fail.
- `tests/content-pages.test.ts` checks only the top level of each page folder for a `.de.md` and `.en.md` per key.
- `tests/ctf-dist.test.ts` already asserts that nothing under `/ctf/` is in the sitemap or `search.json`. Every CTF page passes `noindex` to `BaseLayout`.
- Prose rendered from markdown carries no `data-astro-cid-*`, so styles for it must be `is:global` and prefixed with the page's class (CLAUDE.md, Pages).

## Goals / Non-Goals

**Goals:**

- Adding a third help page later means adding two markdown files, nothing else.
- The ASCII table is generated from code, so no one types 128 rows by hand and the values cannot be wrong.

**Non-Goals:**

- No interactive converter on the ASCII page. It is a lookup table, static HTML.
- No `man` or `ascii` terminal command (decided with the owner).
- No help for commands other than `cat`, `curl`, `base64` and the pipe.

## Decisions

### Help pages are child routes of `ctf`, one per entry of a new collection

`route.ts` returns the door children followed by one child per help entry in the page's locale, all rendered by a new `HelpPage.astro` with `props: { page }`. Slugs are language-neutral (`ascii`, `terminal`), the same way door slugs are, so the alternate-language link is the same slug under the other locale.

Alternative considered: separate `RouteKey`s (`ctfAscii`, `ctfTerminal`) in `routeSegments`. Rejected: that map is meant for pages the nav, footer and language switch need, and it would put the help pages at `/de/ctf-ascii/` rather than under `/ctf/`.

### Content files sit flat in `src/content/pages/ctf/`, the `ctf` collection is narrowed

New files `ascii.de.md`, `ascii.en.md`, `terminal.de.md`, `terminal.en.md` next to `ctf.*.md`. The `ctf` collection gets pattern `ctf.{de,en}.md`; a new `ctfHelp` collection loads the same folder with `["*.{de,en}.md", "!ctf.*.md"]`. The slug of a help entry is `slugOf(id)`.

Keeping them flat means `tests/content-pages.test.ts` covers them without change; a `help/` subfolder would slip past it. If the glob loader rejects the negated pattern, fall back to a `help-` filename prefix with pattern `help-*.{de,en}.md` and strip the prefix for the slug.

Schema for `ctfHelp`: `meta` (`title`, `description`) plus `heading`. Everything else is markdown body.

### The ASCII rows come from `src/lib/ascii.ts`

A function returns 128 rows `{ code, hex, bin, glyph, control }`, with `glyph` the abbreviation for 0–31 and 127 (`NUL SOH STX ETX EOT ENQ ACK BEL BS HT LF VT FF CR SO SI DLE DC1 DC2 DC3 DC4 NAK SYN ETB CAN EM SUB ESC FS GS RS US`, `DEL`), `SP` for 32, otherwise the character. Hex is two uppercase digits, binary eight digits. Unit-tested.

`HelpPage.astro` renders the table only when `page === 'ascii'`, after the prose. Markup does not fork per language: column headers come from the `ascii` entry's frontmatter (`columns: { dec, hex, bin, char }`), so the `ctfHelp` schema has an optional `columns` object, required by a test for the `ascii` entry.

### Table layout

Four column groups of 32 rows side by side on wide screens (0–31, 32–63, 64–95, 96–127), the classic layout where a column step of 32 is visible (upper and lower case one group apart). Below a breakpoint the groups stack into one long table. The table is markup Astro renders, so scoped styles work for it; the prose above it uses `is:global` under `.ctf-help`. Abbreviations for control characters use `--text-muted`, not red. All characters are ASCII and inside the latin subset of the self-hosted font.

### The terminal guide is prose only

Examples are code blocks in markdown, written per language. The `cat` example uses the page names of that language (`cat projekte` / `cat projects`). The `curl` example uses `curl dirnhofer.net` or a page path, which opens in a new tab. No component markup beyond the prose.

### Links from the CTF main page

Plain markdown links in `ctf.de.md` / `ctf.en.md` (`/de/ctf/ascii/`, `/de/ctf/terminal/`), checked by `npm run check:links`.

## Risks / Trade-offs

- [A future door slug named `ascii` or `terminal` would shadow a help page] → a test compares help slugs with `publicData.doors`, and `collectRoutes` paths are unique-checked in the same test.
- [Examples on the terminal page drift from what the commands print] → a test runs the base64 examples through the real command with `stubContext` and compares with the outputs written on the page, extracted from the markdown code blocks.
- [Spoilers creep into later edits] → the spec forbids them; the test also asserts the help markdown contains no `ls -a`, no `192.168.`/`10.`/`172.` address and no `drnhfr{`.
- [Narrowing the `ctf` collection pattern leaves stale entries in `.astro/data-store.json`] → after the schema change, stop `astro dev`, delete that file and restart, as CLAUDE.md says.

## Migration Plan

Static site, no migration. Deploys with the next push to `main`; rollback is a revert.
