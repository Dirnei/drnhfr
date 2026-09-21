# dirnhofer.net

Personal site for Christian Dirnhofer — software architect and tinkerer.
Astro static site, DE/EN, dark-only, deployed to GitHub Pages.

The binding design decisions live in `docs/superpowers/specs/` and the build
plan in `docs/superpowers/plans/` (both gitignored, present locally). Read the
spec before arguing with anything below.

---

## Comments

Write code that does not need them. A comment earns its place only when it
explains the lines directly below it **and** the reader could not get there
from the code itself — a non-obvious encoding, an empty catch, a value that
looks wrong until you know why.

Everything else goes. No rationale, no history, no design argument, no
restating the signature above it in a sentence. If a decision needs explaining
it belongs in the commit message, in `docs/superpowers/specs/`, or in this
file — not in the source.

This was applied retroactively: about 1,250 lines of commentary came out of
`src/`, `tests/` and `scripts/` in one pass. Do not put it back.

---

## Copy

**No em dashes** and **no rule-of-three lists** ("Kein Framework, kein
Container, keine Konventionen"). The tricolon is a persuasion rhythm, and what
it lists is usually already in the sentence before it.

Say what a thing is, and if it adds something, why it was
built. No marketing, no benefit lists, no closing flourish. The owner's own
line is the model: "Eine YAML-Spezifikation um CLI oder RCON Commands zu
beschreiben."

Page `<title>` separators are the one exception (`Impressum — Christian
Dirnhofer`): that is a separator, not prose.

---

## Verify, don't assume

There is a real browser available, and it has caught bugs in this project that
reasoning did not. Use it.

Playwright's Chromium is cached at
`~/AppData/Local/ms-playwright/` and Node 24 has a global `WebSocket`, so you
can drive it over CDP with no install:

- `chromium_headless_shell-*/…/chrome-headless-shell.exe` — fast, for
  measuring and screenshotting.
- `chromium-*/chrome-win64/chrome.exe` with `--headless=new` — the full
  build. Needed for anything the shell lacks: PDF viewing, real window
  management, popups.

Serve `dist/` on a throwaway port rather than testing against the dev server —
it has served stale CSS and sent a debugging session in the wrong direction.

Three traps that have already cost time here:

- **`--hide-scrollbars` hides real bugs.** Every art block once carried its own
  scrollbar and no run saw it, because that flag was on.
- **`Runtime.evaluate` carries no user activation** unless you pass
  `userGesture: true`. Without it `window.open` is blocked for the right
  reason but the wrong test.
- **Search the rendered artifact, not the assumed one.** The minifier rewrites
  `::after` to `:after`, drops quotes on single-word class values, and
  unicode-escapes `<` inside JSON. Component styles may live in
  `dist/_astro/*.css` rather than inlined in the HTML. Grep for literal
  rendered strings; several "the code is missing" conclusions here were the
  grep being wrong.

## Checks

`npm run check` (astro check, expect 0/0/0) · `npm test` · `npm run check:links`
· `npm run check:gdpr`. All four before a commit.

`npm run og` regenerates the share cards — **re-run it after any palette
change**, it has drifted twice.

---

## Hard constraints

- **Zero third-party requests.** `check:gdpr` fails the build on any external
  URL in the output. No analytics, no CDN fonts, no embeds. Download assets
  into `src/assets/` instead of hotlinking.
- **`sessionStorage` only, never `localStorage`.** The privacy pages describe
  the storage this site uses; they have to stay true.
- **Red (`--red`) is reserved for state and action** — hover, focus, errors,
  "you are here". Never decoration, never at rest. Fifty-four red bars on the
  CV had to be undone for this reason.
- **No border radii.** Everything is square, including images.
- Recompute contrast when a colour token moves. The ground has been lifted
  twice and both times left text below AA.

## Fonts

Self-hosted `@font-face` in `src/styles/`, `font-display: optional`, preloaded.
**Do not** switch to Fontsource `@import` — it caused an 86px reflow at FCP.

`font-stretch: 75%` + `font-weight: 800` reproduces the logo's axes. Never fake
condensation with `transform: scaleX()`.

Consequence worth remembering: the self-hosted face is a **latin subset**.
Anything outside it (block glyphs, box drawing, katakana) may be substituted
from another font with a different advance width, which shears any character
grid. `figlet` measures its ink before drawing with it for exactly this reason.

## Astro 7 notes

Rust compiler: unclosed tags are errors. Markdown runs through **Sätteri** —
do **not** install `@astrojs/markdown-remark`.

**Scoped styles only reach elements Astro rendered.** Astro stamps
`data-astro-cid-*` at build time, so anything created by `document.createElement`
never matches a scoped rule. The terminal ran unstyled for a long time this way
— error lines were not red, and nobody noticed because only text content was
ever checked. Log line styles therefore use `.log :global(.line…)`; the
`:global` is load-bearing, do not tidy it away.

---

## The terminal

`src/components/Terminal.astro` is markup and styles only. Everything else is
in `src/lib/terminal/`, imported by a bundled script. It deliberately does
**not** use `define:vars`, because that forces the script inline and an inline
script cannot import — which is what held 470 lines in one file. Server data
arrives through a `#terminal-config` JSON blob.

### Adding a command

One file in `src/lib/terminal/commands/`. That is the whole installation step:
`import.meta.glob` finds it, and `help` and tab completion both derive from the
registry, so there is no second list to update and nothing that can drift.

```ts
export default {
  name: 'uptime',
  usage: 'uptime',
  summary: 'how long this tab has been up',
  order: 12,                     // curated position in help; must be unique
  hidden: true,                  // never listed (sl)
  listed: (ctx) => ctx.isUnlocked(),  // listed only in some states (exit, su)
  completesEntries: true,        // Tab completes its argument (cd, cat)
  run(arg, ctx) { ctx.print('…'); },
} satisfies Command;
```

Commands never touch the DOM. They go through `CommandContext` — `print`,
`printArt`, `printError`, `find`, `navigate`, `openTab`, `draw`, `columns`,
`charWidth`, `uptimeMs`, `history`, `interrupted`, `reboot`. That is what makes
them testable: `tests/terminal.test.ts` has a `stubContext` helper, and running
a command in a test is just calling it with a fake.

**Heavy payloads load lazily** — `await import()` inside `run`, so the metadata
stays static for `help` while the data only arrives on first use. See
`figlet` (font), `fortune` (the lines), `neofetch` (cv.json).

Anything that animates must await `ctx.interrupted()` so a keypress gets the
prompt back, and must call `drawing.end()` in a `finally`.

### The CV gate

`su <password>` / `exit`, flag in `sessionStorage`. The password is month, day,
year and hour, each pair reversed on its own: `2026-09-21 18:xx` → `09 21 26 18`
→ `90126281`.

There is also a bypass link for people who should not have to solve anything:
appending `#` + `BYPASS_HASH` (`src/lib/terminal/unlock.ts`) to any URL sets the
same flag and strips the hash again — `https://dirnhofer.net/de/lebenslauf/#no-time-for-puzzles`.
The check lives in the `BaseLayout` head so it runs before the nav and page
scripts read the flag; that ordering is why it is not on the CV page itself.

**It is a toy, not access control** — the owner's words. The CV page ships its
full markup and merely hides it, so the content is public to anyone who reads
the HTML. Never describe it as protection, and never put anything there that
actually needs protecting.

---

## Content and data

- **`src/data/cv.json` is one file for both languages.** A field is either a
  plain string (same in both) or `{ de, en }`. Zod validates at build time, so
  a missing translation is a build error. Dates are `YYYY-MM` facts, formatted
  per locale at render time.
- **Project logos are vendored**, like every other asset: `src/assets/projects/`,
  mapped to a project in `src/lib/project-logos.ts` by `translationKey`. They are
  deliberately **not** an `image()` field on the collection: in Astro 7.3.3 the dev
  server writes `.astro/content-assets.mjs` empty, so an `image()` field rehydrates
  to nothing and the logo is invisible in `astro dev` while being fine in a build.
  A plain ESM import behaves the same in both. Both logos are drawn for the
  light docs sites they come from, so the page sets them on a `--logo-tile`
  square rather than on the page ground, where a dark-inked mark would vanish.
  The scanline texture across that tile is `main::after` from `motion.css`, not
  part of the logo.
- Link icons are Octicons (MIT), vendored in `src/assets/icons/` with
  `fill="currentColor"` added; see the README there. `ProjectLinks.astro` maps
  repo/docs/demo to them.
- The CV page and the PDF are **the same document**: the PDF is the page
  printed through `src/styles/print.css`. There is no second renderer. On
  screen it is a proportional timeline; `@media print` unwinds that into a
  dated list, because a proportional rail wastes a sheet of A4.
- `print.css` overrides **every** colour token. When you add one, add its print
  value too — `--boot-info` was missed once and printed as empty bars.

## The email address

Contact page and Impressum. Also the Datenschutz/Privacy pages, where Art. 13
GDPR requires the controller's contact details — that one stays. It is
deliberately **not** in the footer or the terminal MOTD; the home page is the
most crawled page on the site. If you are about to add a contact line
somewhere, don't.

---

## Working agreements

- Work directly on `main`. Do not push; there is no remote yet, and pushing
  before DNS resolves produces a completely broken deploy (`site` is
  `https://dirnhofer.net` with no `base`, so every root-absolute path 404s on
  `dirnei.github.io`).
- Commit messages follow the global `~/.claude/CLAUDE.md` rules: Conventional
  Commits, English, **subject line only**, 74 characters max, no body, no
  trailers, no attribution.
- Generated directories get a self-ignoring `.gitignore` containing `*` inside
  them, not a root-level entry.
- `src/pages/*/index.astro` carry the owner's own hero copy. He edits them
  directly; leave uncommitted changes there alone unless asked.

## Before launch (owner's list)

- `grep -rn "PLATZHALTER:\|PLACEHOLDER:" src/` — sample content and CV gaps.
- Confirm the inferred skill list; the levels in `cv.json` were read off a
  bar chart and are estimates.
- `serva transport systems` has no start date in the source CV — `2018-01` is
  a guess.
- Lawyer review of the legal pages, specifically § 25 TDDG and the intro's
  `sessionStorage` flag.
- **Set DNS before the first push.**
