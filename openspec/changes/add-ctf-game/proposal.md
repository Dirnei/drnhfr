# Proposal

## Why

The home page is a headline and one sentence. The people most likely to read it closely are engineers checking Christian out before a technical interview, and right now nothing on it shows how he works or what he is proud of. A small capture the flag game, built into the site and written about on the home page, gives those visitors something to do for ten minutes and leads them through stories about his work that have no other place on the site.

## What Changes

- A chain of five story pages ("doors"): site, homelab, laser, dartomat, smarthome. Each one is locked until its flag is entered, tells a story, and hides the flag for the next door. Smarthome is the finale and hides nothing.
- Five challenges in classic CTF categories, pitched so any web developer can solve them: recon (base64 in an HTML comment), terminal (dotfile behind `ls -a`), network (`curl` to a host from the fake homelab network), forensics (G-code that draws the flag), crypto (a dart game log that encodes the flag).
- Story pages ship only as ciphertext. Each is encrypted with AES-GCM under a key derived from the flag that opens it, so a correct flag is the one that decrypts and no flag is stored in the bundle.
- The plaintext source (stories, flags, terminal data, G-code, hints) is committed encrypted with SOPS + age. `npm run ctf:seal` turns it into the committed `.sealed.json` files; CI only reads those and needs neither SOPS nor the key.
- New terminal commands `submit` and `hint`; `ls -a`, `cat` and `curl` learn about content that solved doors contribute.
- Solved doors are kept in `sessionStorage` and reached through a CTF menu in the nav that appears after the first solve; locked doors show as `?????`.
- The home page gets a write-up about the game (placeholder text until the owner writes it).
- The privacy pages (DE/EN) describe the new `sessionStorage` entry.
- Story pages are `noindex` and stay out of the sitemap and the search index.

## Capabilities

### New Capabilities

- `ctf/sealing`: how door content is authored (SOPS + age), sealed into per-door ciphertext, and what may and may not appear in the repo and the build output.
- `ctf/play`: entering flags, unlocking doors, hints, progress storage, the locked and unlocked story pages, the CTF nav menu and the home page write-up.
- `ctf/challenges`: the five challenges and the terminal behaviour each one relies on (dotfile, fake homelab hosts, G-code download, encoded game log).

### Modified Capabilities

None. The project has no existing OpenSpec specs.

## Impact

- New: `src/content/pages/ctf/` (route slice and story page component), `src/lib/ctf/` (crypto, state, unlock logic), `src/lib/terminal/commands/submit.ts` and `hint.ts`, `scripts/ctf-seal.mjs`, `ctf/doors/*.sops.yaml`, `.sops.yaml`, `src/data/ctf/*.sealed.json`.
- Changed: `src/i18n/routes.ts` (new route key), `SiteNav.astro`, the home page slice, `ls`/`cat`/`curl` commands, `astro.config.mjs` sitemap filter, privacy pages, `package.json` scripts.
- New local tooling for the owner only: `sops` and `age` (`winget install Mozilla.SOPS FiloSottile.age`), age key backed up in 1Password. No new runtime dependency and no new third-party request.
