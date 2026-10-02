# Tasks

## 1. State and timer

- [ ] 1.1 Extend `CtfProgress` in `src/lib/ctf/session.ts` with optional `startedAt` and `finishedAt`, and keep `parseProgress` tolerant of entries without them; verify Vitest cases for an old-shape entry and a new one
- [ ] 1.2 Add `started()`, `start(now)`, `elapsed(now)` and `finishedIn()` to `Ctf` in `src/lib/ctf/doors.ts`; `submit` sets `finishedAt` when it opens the last locked door; verify tests for start, elapsed across a re-created `Ctf` from the same store, finish on the fifth door only, and no time without a start
- [ ] 1.3 Add an `h:mm:ss` formatter next to `humanise` in `src/lib/terminal/duration.ts`; verify tests for seconds, minutes and runs over an hour
- [ ] 1.4 Extend `noCtf` and `fakeCtf` in `tests/terminal.test.ts` with the new methods; verify `npm run check` is 0/0/0

## 2. Commands

- [ ] 2.1 Add `available?(ctx)` to `Command`; make `findCommand` take the context and skip unavailable commands, and make `isListed` and tab completion respect it; verify tests that an unavailable command is not found, not listed and not completed
- [ ] 2.2 Set `available: (ctx) => ctx.ctf().started()` on `submit` and `hint`; verify that before the start `submit x` prints `submit: command not found` plus `help` without `submit` or `hint`, and that after the start both are listed
- [ ] 2.3 New `ctf` command: start or report elapsed or final time, then navigate to the CTF main page in the page's language; verify tests for first start, second run and finished state
- [ ] 2.4 `submit` prints the total time when the last door opens; verify a test with a fake `Ctf` reporting the finish
- [ ] 2.5 Confirm `restart` clears the started state and timer through `clearSessionFlags`; verify in the browser that `submit` is gone after `restart`

## 3. Pages

- [ ] 3.1 Remove the HTML comment from `Home.astro`; add the hidden `.ctf-entry` string to the footer in `BaseLayout.astro` and reveal it from `src/lib/ctf/ui.ts` when the game is started; verify in Chromium that it is invisible before `ctf` and visible on several pages after
- [ ] 3.2 Shrink the write-up in `home.de.md` and `home.en.md` to a short paragraph naming the game and the `ctf` command; verify the home page in Chromium at 1280px and 360px
- [ ] 3.3 Rewrite the body of `ctf.de.md` and `ctf.en.md`: history of CTF, Christian's story as placeholder, general tool overview, how to play; add a `finishedIn` label to the frontmatter and schema; verify `npm run check` and read both pages in Chromium
- [ ] 3.4 Door page: change the locked text to point to `ctf` first, and show the total time under the smarthome story when the run is finished; verify in Chromium after a full run
- [ ] 3.5 Update the privacy pages in both languages to mention the started flag and the timestamps; verify both files and `npm run check:links`

## 4. Hints and reseal

- [ ] 4.1 Edit the first-door hints in `ctf/doors/0-entry.sops.yaml` with `sops edit` so they point to the visible string; run `npm run ctf:seal`; verify the hints by decrypting `public.json` content and the five doors still open with their flags
- [ ] 4.2 Repo flag scan for the five real flags returns nothing; verify before committing

## 5. Verification

- [ ] 5.1 Full playthrough in Chromium against `dist/` served on 127.0.0.1: `submit` absent before `ctf`, `ctf` opens the main page, visible string decodes to flag 1, all five doors, final time printed and shown on the finale, `restart` removes everything
- [ ] 5.2 Repeat the start and first door in `astro dev` after a restart with `.astro/data-store.json` removed (new command and schema change)
- [ ] 5.3 Run `npm run check`, `npm test`, `npm run check:links`, `npm run check:gdpr`; verify all four pass
