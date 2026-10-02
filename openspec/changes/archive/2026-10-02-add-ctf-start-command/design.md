# Design

## Context

Builds on `add-ctf-game`. Relevant pieces as they are today:

- `src/lib/ctf/session.ts` stores `{ keys, hints }` under the `sessionStorage` key `ctf`; `createCtf` in `doors.ts` reads and writes it through a `ProgressStore`.
- Commands have `hidden` (never listed) and `listed(ctx)` (listed in some states). Neither stops a command from running: `exit` is unlisted for guests but still runs. `findCommand` in `registry.ts` resolves any name, and `shell.ts` prints `command not found` plus `help` only when it returns nothing.
- `restart` calls `reboot(true)`, which runs `clearSessionFlags` in `unlock.ts`; that already removes the `ctf` entry.
- The first flag's base64 is rendered as an HTML comment by `Home.astro` from `src/data/ctf/public.json` (`entry`).
- The CTF index page `/ctf/` renders `ctf.*.md` through `Prose` plus the progress row.
- The footer in `BaseLayout.astro` has a right-aligned `.footer-hint` with the keyboard shortcut; it is hidden below 37.5rem, where the terminal is hidden too.

## Goals / Non-Goals

**Goals:**

- A visitor who never types `ctf` sees no game mechanics anywhere except one short paragraph on the home page; the first flag sits only in the page source.
- The timer is honest wall-clock time from `ctf` to the last flag, across navigation.

**Non-Goals:**

- Hiding the game from someone reading the JavaScript bundle. The start gate is presentation, like the cv gate; the doors stay protected by encryption, not by the gate.
- A leaderboard or any persistence of times beyond the session.
- Pausing the timer while the tab is closed or hidden.

## Decisions

### One `available` predicate on commands

Add an optional `available?(ctx): boolean` to `Command`. When it returns false the command does not exist: `findCommand` takes the context and skips it, `isListed` returns false, and tab completion skips it. `submit` and `hint` set `available: (ctx) => ctx.ctf().started()`. This differs from `listed`, which only hides a command from `help`, and keeps the `command not found` output identical to a truly unknown name, because it goes through the existing path in `shell.ts`.

Alternative considered: a guard inside `submit`/`hint` that prints `command not found` itself. Rejected because `help` and tab completion would still have to be taught separately, and the wording would drift from the shell's own message.

### Started state and timer live in the existing `ctf` entry

`CtfProgress` grows to `{ keys, hints, startedAt?: number, finishedAt?: number }` (epoch milliseconds). `Ctf` gains `started()`, `start(now)`, `elapsed(now)` and `finishedIn()`. `submit` sets `finishedAt` when the door it opens leaves no locked door. Keeping it in the same entry means `clearSessionFlags` already clears it, the privacy text describes one entry, and blocked storage degrades the same way as progress does: the game works for the current page only.

Alternative considered: a separate `ctf-started` key. Rejected: one more entry for the privacy pages, and a second thing to clear on restart.

### `ctf` command

`run`: if not started, `start(Date.now())` and print a one-line welcome; if started and not finished, print the elapsed time; if finished, print the final time. Then `navigate` to `routePath('ctf', lang)`. Elapsed and final times are formatted as `h:mm:ss` by a small helper next to `humanise` in `duration.ts`, since a run is measured to the second and `humanise` rounds.

### First-flag comment on every page

`BaseLayout.astro` renders `<!-- <base64> -->` from `public.json` at the top of `<body>` with `<Fragment set:html>`, the same technique the home page used, so every page carries it and the comment in `Home.astro` is removed. It is not gated on the start: the source is readable either way, and `submit` only exists after `ctf`, so finding it early changes nothing.

### Finale time on the smarthome page

The door page script appends one line under the story of the last door when `finishedIn()` returns a value: the total, formatted with the same helper. The label comes from `ctf.*.md` (new `finishedIn` field) so markup does not fork per language.

### Content

`ctf.*.md` body is rewritten with four sections: history of CTF (DEF CON CTF since 1996, the jeopardy and attack-defense formats, student competitions like picoCTF), Christian's own story as `PLATZHALTER:`/`PLACEHOLDER:`, a tool overview (browser developer tools and view-source, a base64/hex decoder such as CyberChef, curl and a terminal, `strings` and `file`, Wireshark, a hex editor, an ASCII table), and how to play this game. External tools are named in text; any link is a plain anchor. The home body shrinks to two sentences. Both follow the copy rules in CLAUDE.md (no em dashes, no rule-of-three lists, plain statements).

The first-door hints in `ctf/doors/0-entry.sops.yaml` are edited with `sops edit` and resealed, which rewrites every sealed file with fresh nonces; the flags do not change.

## Risks / Trade-offs

- [`findCommand` gains a context parameter and is called from three places] → All callers are in `shell.ts` and the registry; tests in `terminal.test.ts` cover lookup with and without the start.
- [Changing `CtfProgress` shape breaks stored state from the previous version] → `parseProgress` already treats missing fields as defaults; an old entry simply has no `startedAt`, so `submit` is unavailable until `ctf` is run. Acceptable within a session.
- [A run that solves the last door without `ctf` having set a start] → Impossible through the UI, since `submit` does not exist before the start; `finishedIn()` returns null if `startedAt` is missing, and nothing is printed.
- [The reseal changes all sealed files] → Expected; the dist leak test and a full playthrough run afterwards.
- [Content about CTF history must be accurate] → Keep to well-documented facts; the owner reviews the copy.

## Open Questions

- The exact wording of the tool overview and the history is left to review in the content files; it does not change behaviour or tasks.
