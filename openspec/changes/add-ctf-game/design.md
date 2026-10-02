# Design

## Context

The site is static (Astro 7, GitHub Pages) with no backend and a hard rule against third-party requests. The repository `Dirnei/drnhfr` is public. Anything shipped to the browser or committed is readable, so the game's secrecy has to come from cryptography, not from hiding markup. The existing CV gate hides shipped markup and is explicitly a toy; that model would let view-source skip the whole chain.

Pieces this builds on:

- Page slices under `src/content/pages/<name>/route.ts`, found by `import.meta.glob`; `routeSegments` in `src/i18n/routes.ts` is the URL map.
- The terminal (`src/lib/terminal/`): commands found by glob, `CommandContext` as the only door to the DOM, config through `#terminal-config`.
- `SiteNav.astro` already reveals a hidden entry (`#nav-cv`) from `sessionStorage` with an inline script.
- The search index (`src/lib/search-index.ts`) lists pages explicitly; the sitemap is filtered in `astro.config.mjs`.
- Markdown renders through Sätteri; `@astrojs/markdown-satteri` exports its processor and is already installed as a dependency of Astro.

## Goals / Non-Goals

**Goals:**

- Neither the repository nor the build output reveals a flag (other than the base64 entry hint) or a locked story.
- CI builds without any secret.
- The owner edits door content with the same tooling he uses for infrastructure secrets.

**Non-Goals:**

- Leaderboards, accounts, timing, anything needing a server.
- Resistance to brute force against a weak flag. Flags are long enough that guessing is not the intended route; PBKDF2 makes it slow, not impossible.
- Persisting progress beyond the browser session.
- Real story text and photos. The change ships placeholders (`PLATZHALTER:`/`PLACEHOLDER:`) that the owner replaces.

## Decisions

### Encrypt each door with a key derived from its flag

AES-256-GCM, key from PBKDF2-SHA256 (300,000 iterations) over the flag, one salt shared by all doors, a random 96-bit nonce per door. A correct flag is simply one whose key authenticates a door's ciphertext.

- Single salt: `submit` derives one key and tries it against every locked door, so solving out of order works and a phone pays for one derivation, not five. A per-door salt adds nothing here, since every door already has its own flag.
- Alternative considered, hashed flags with hidden markup: simpler, but the next flag sits in the shipped HTML of the current page. Rejected.
- Alternative considered, hashed flags with public story pages: nothing left to unlock. Rejected.

### Door payload

Each door decrypts to one JSON object:

```
{
  html:     { de, en },                 // rendered story
  title:    { de, en },                 // nav and progress label
  hints:    [string, string] | null,    // for the NEXT door; null on the finale
  terminal: { files?, hosts? },         // dotfiles for ls -a / cat, fake hosts for curl
  downloads?: { name, content }[]       // G-code
}
```

Hints for the next door ride inside the current door, so even hints are not public beyond the first door's. The first door's hints, the shared salt and the base64 entry flag are public and live in `src/data/ctf/public.json`.

### SOPS + age for the source, Node for sealing

Each door is `ctf/doors/<n>-<door>.sops.yaml`, encrypted to the age recipient in the root `.sops.yaml`. Stories are YAML block scalars holding Markdown. `scripts/ctf-seal.mjs` runs `sops -d --output-type json` per door, renders the Markdown with the Sätteri processor, encrypts with `node:crypto`, and writes `src/data/ctf/<door>.sealed.json` plus `public.json`. It writes to a temporary location first and only replaces the committed files when every door succeeded.

- Alternative considered, a homemade vault with a master password: no external binaries, but it means maintaining a key derivation and edit workflow ourselves. Rejected in favour of a tool the owner already knows from IaC.
- Alternative considered, gitignored plaintext: a lost disk loses the content. Rejected.
- Reseal churn: fresh nonces mean every seal rewrites every sealed file. Accepted; the files are small and only change when the owner seals.

### Rendering the decrypted HTML

Story pages are a slice `src/content/pages/ctf/` with route key `ctf` (segment `ctf` in both languages) and five child routes. The component renders the locked placeholder, embeds the sealed JSON, and a bundled script decrypts and injects `html[lang]` when a stored flag opens it. Because injected HTML carries no `data-astro-cid-*`, its styles are `is:global` under a page class, the same pattern as `Prose.astro`.

The nav carries one hidden CTF menu whose door rows the client script fills and reveals after the first solve, the same way `#nav-cv` is revealed.

### Client state and the terminal

`src/lib/ctf/` holds the crypto (`deriveKey`, `openDoor`), the session store (the derived AES key of each solved door, exported raw and keyed by door, so a page load re-opens doors without running PBKDF2 again; wrapped in `try/catch` like `unlock.ts`), and an `opened` registry that every page fills on load by re-opening stored doors. Commands read it through one addition to `CommandContext`: `ctf()` returns the game object, whose `submit(flag)` runs derive-and-try and notifies the CTF menu, the progress row on the CTF index page and the door page, and whose `hint()` and `opened()` serve the other commands. `ls -a`, `cat` and `curl` consult the opened doors' `terminal` data before their existing behaviour.

`curl` gains one branch: a host that parses as a private IPv4 address (10/8, 172.16/12, 192.168/16) or ends in `.lan` never reaches `openTab`. It is answered from the opened doors' `hosts` or with `curl: (7) Failed to connect`.

### Entry flag in the home page

The home slice renders the comment with `<Fragment set:html={...} />` from `public.json`, so the text is the base64 string and not a literal flag. Whether Astro's HTML compression keeps comments is verified against `dist/` in the first task; if it strips them, the fallback is the same string in a `<meta name="x-hint">`.

### Excluding story pages from discovery

The sitemap filter gains `/ctf/`; the search index never lists them because it is built from explicit page lists; the story component sets `<meta name="robots" content="noindex">` through a `BaseLayout` prop.

## Risks / Trade-offs

- [Importing `@astrojs/markdown-satteri` from a script relies on a transitive dependency] → Verify the processor API in the first task; if it is not usable standalone, pin it as a direct devDependency rather than switching renderers.
- [The owner loses the age key] → Content is unrecoverable and has to be rewritten. Back up the key in 1Password; the seal script's error message says so.
- [The CTF menu panel overflows on small screens] → It is anchored to the right edge of its entry; checked at 360px with five rows.
- [Placeholder stories ship to production] → The `PLATZHALTER:` grep on the launch list also covers `ctf/doors/` once decrypted; the seal script warns when a story still starts with a placeholder marker.
- [`astro dev` misses the new slice or the new data files] → Restart the dev server after adding them and play the chain there as well as on `dist/`.
- [Cheap brute force on a short flag] → Flags are at least 16 characters inside the braces; the seal script rejects shorter ones.

## Migration Plan

No migration. The owner installs `sops` and `age`, generates a key, adds the recipient to `.sops.yaml`, and runs `npm run ctf:seal` once. Rollback is a revert; nothing persists outside `sessionStorage`.
