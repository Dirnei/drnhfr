# Proposal

## Why

The game currently has no beginning: `submit` and `hint` sit in `help` for everyone, and the home page carries a long write-up about something most visitors will never play. Starting the game with one terminal command gives it a clear entry point, keeps the site quiet for visitors who are not interested, and leaves room for a proper CTF main page that explains what a CTF is to people who have never played one.

## What Changes

- New terminal command `ctf`. It starts the game, starts a timer, and opens the CTF main page. Running it again while a game is in progress only opens the main page and prints the elapsed time.
- `submit` and `hint` do not exist until the game is started: they are not listed in `help`, not tab-completed, and typing them gives `command not found`.
- Submitting the last flag stops the timer and prints how long the whole chain took. The finale page shows the same time.
- The HTML comment with the base64 of the first flag moves from the home page into the source of every page.
- The home page write-up shrinks to a short paragraph that names the game and says to type `ctf` in the terminal.
- The CTF main page (`/de/ctf/`, `/en/ctf/`) gets new content: the history of CTF competitions, how Christian came to know them (placeholder until he writes it), and a first overview of tools that are generally useful in CTFs, for people new to them.
- Hints for the first door point to the source of any page instead of the home page. This needs one edit of the encrypted entry file and a reseal.
- `restart` also ends a running game and clears the timer, as it already clears progress.
- The privacy pages mention that the started flag and the timer timestamps are part of the CTF `sessionStorage` entry.

## Capabilities

### New Capabilities

- `ctf/start`: the `ctf` command, the started state that gates `submit` and `hint`, the timer, the first-flag comment on every page, and the content of the CTF main page.

### Modified Capabilities

- `ctf/play`: `Hints` (first-door hints change), `Home page write-up` (shrinks to a pointer to `ctf`), `Progress lives in sessionStorage only` (restart also ends the game), `Privacy pages describe the storage` (started flag and timestamps).
- `ctf/challenges`: `Challenge 1, recon` (the comment is in every page source instead of only the home page).

These capabilities came from `add-ctf-game`, which is archived; their main specs are in `openspec/specs/ctf/`.

## Impact

- New: `src/lib/terminal/commands/ctf.ts`, a started/timer section in `src/lib/ctf/session.ts`, the base64 comment in `BaseLayout.astro`.
- Changed: `submit.ts` and `hint.ts` (`listed` and a guard), the command lookup so unlisted CTF commands are not found before the start, `clearSessionFlags`, `home.*.md`, `ctf.*.md`, `Home.astro` (comment removed), `DoorPage.astro` locked text, `privacy.*.md`, `ctf/doors/0-entry.sops.yaml` and `src/data/ctf/public.json` after a reseal.
- No new dependencies and no new third-party requests. Tool names on the CTF main page are text only; any link to an external tool is a plain anchor, which the GDPR check allows.
