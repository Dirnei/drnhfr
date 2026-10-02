# Tasks

## 1. Owner setup and spikes

- [x] 1.1 Owner: install `sops` and `age` (`winget install Mozilla.SOPS FiloSottile.age`), run `age-keygen` into `%AppData%\sops\age\keys.txt`, back the key up in 1Password; verify `sops --version` and `age --version` succeed
- [x] 1.2 Add root `.sops.yaml` with a creation rule for `ctf/doors/*.sops.yaml` and the owner's age recipient; verify `sops encrypt` on a throwaway file under that path produces readable keys and encrypted values
- [x] 1.3 Spike: render a Markdown string to HTML from a plain Node script with the `@astrojs/markdown-satteri` processor; verify the output matches how a content page renders the same text (smart quotes, headings); pin it as a devDependency if the import only works transitively
- [x] 1.4 Spike: put an HTML comment in the home slice via `<Fragment set:html>` and build; verify the comment is present in `dist/de/index.html`, otherwise switch to the `<meta>` fallback from design.md

## 2. Crypto and sealing

- [x] 2.1 `src/lib/ctf/crypto.ts`: `deriveKey(flag, salt)` and `openDoor(key, sealed)` on `crypto.subtle`; verify a Vitest round trip against a ciphertext produced with `node:crypto`, and that a wrong flag is rejected
- [x] 2.2 `scripts/ctf-seal.mjs`: decrypt each door with `sops -d`, validate fields and flag length (16+ inside the braces), render stories, encrypt, write to a temp dir and swap into `src/data/ctf/` only on full success; verify with fixture doors encrypted to a test age key generated in the test
- [x] 2.3 Seal script error paths: missing `sops`, missing key, malformed door; verify each prints a named cause and leaves `src/data/ctf/` unchanged
- [x] 2.4 Seal script warns when a story still starts with `PLATZHALTER:`/`PLACEHOLDER:`; verify against a fixture
- [x] 2.5 Add `ctf:seal` to `package.json`; verify `npm run ctf:seal` runs end to end on the owner's machine

## 3. Door content (placeholders)

- [x] 3.1 Create the five door files `ctf/doors/1-site.sops.yaml` … `5-smarthome.sops.yaml` with placeholder stories in DE and EN, real flags, two hints each for the next door, and `public.json` data for the first door; verify `npm run ctf:seal` produces five sealed files and `public.json`
- [x] 3.2 Site door payload: a dotfile entry whose content is the homelab flag; verify by decrypting the sealed file in a test-only helper with the flag from the door file
- [x] 3.3 Homelab door payload: a network diagram in the story and `hosts` data where one odd host's response carries the laser flag; verify the diagram renders and the odd host is reachable in the decrypted payload
- [x] 3.4 Laser door payload: a G-code file whose toolpath spells the dartomat flag; verify by rendering it in a G-code viewer (screenshot) and reading the flag off it
- [x] 3.5 Dartomat door: a game log encoding the smarthome flag with a hinted shift; verify by decoding the log by hand
- [x] 3.6 Smarthome door: finale text with a link to the contact page and no flag

## 4. Client state

- [x] 4.1 `src/lib/ctf/session.ts`: store, read and clear the derived keys of solved doors in `sessionStorage` with `try/catch`; verify Vitest cases for normal storage and a throwing `sessionStorage`
- [x] 4.2 `src/lib/ctf/doors.ts`: on page load re-open every stored door and expose the opened payloads; `submitFlag` derives once and tries every locked door; verify tests for correct, wrong, already-used and out-of-order flags
- [x] 4.3 Extend `CommandContext` with `ctf()` (the game object, including `submit`) and add them to `stubContext` in `tests/terminal.test.ts`; verify `npm run check` is 0/0/0

## 5. Terminal commands

- [x] 5.1 `submit` command with the messages from the play spec, including the no-WebCrypto and storage-blocked lines; verify tests via `stubContext`
- [x] 5.2 `hint` command with escalation per door and the "nothing left" message; verify tests for first hint, second hint, repeat, everything solved
- [x] 5.3 `ls -a` lists opened dotfiles, plain `ls` does not; `cat` reads them; verify tests with and without the site door opened
- [x] 5.4 `curl` private-address branch: fake host responses, `curl: (7) Failed to connect` otherwise, never `openTab`; verify tests for odd host, normal host, unknown host, locked door, and a public URL still opening a tab
- [x] 5.5 Restart `astro dev` after adding the commands and verify `help` lists `submit` and `hint` there

## 6. Pages, nav and home

- [x] 6.1 Add route key `ctf` to `routeSegments` and the slice `src/content/pages/ctf/` with five child routes and a locked placeholder in both languages; verify `npm run build` emits ten door pages and `tests/content-pages.test.ts` passes
- [x] 6.2 Door page script: decrypt and inject the story for the page's language, global styles under the page class, G-code download as a Blob; verify in Chromium that the injected story is styled and the download makes no network request
- [x] 6.3 `noindex` on door pages through a `BaseLayout` prop, `/ctf/` in the sitemap filter, nothing added to the search index; verify against `dist/sitemap-0.xml`, `dist/*/search.json` and the door page head
- [x] 6.4 Nav: append solved doors in door order from the client script; verify in Chromium at 1280px and 360px with all five solved
- [x] 6.5 Home page: base64 comment from `public.json`, write-up as `PLATZHALTER:` prose, progress row with 0/5, named links for solved doors, unnamed placeholders otherwise, red only on hover and focus; verify in Chromium with 0, 3 and 5 doors solved
- [x] 6.6 Add print values for any new colour token to `print.css`; verify by grepping new tokens in both files

## 7. Privacy and leak checks

- [x] 7.1 Privacy pages DE and EN: describe the CTF `sessionStorage` entry next to the existing ones; verify both files mention it and `npm run check:links` passes
- [x] 7.2 Leak test in Vitest over `dist/`: no complete flag (`drnhfr{` + 16 or more characters + `}`) anywhere, five sealed files present, door pages absent from sitemap and search index; verify it fails when a flag is planted in a page and passes after removal
- [x] 7.3 Repo leak check: `git grep` for each of the five real flags returns nothing; verify before committing

## 8. End-to-end verification

- [x] 8.1 Play the full chain in Chromium against `dist/` served on a throwaway port, using only the in-game route for each flag (view-source, `ls -a`, `curl`, G-code viewer, game log)
- [x] 8.2 Repeat the chain in `astro dev` after deleting `.astro/data-store.json` and restarting
- [x] 8.3 Run `npm run check`, `npm test`, `npm run check:links`, `npm run check:gdpr`; verify all four pass
