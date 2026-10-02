# Design

## Context

A terminal command is one file in `src/lib/terminal/commands/`, found by `import.meta.glob`; `help` and Tab derive from the registry. Commands only talk to `CommandContext`. A command that takes text reads its argument first and `ctx.stdin` second (`cowsay`, `cat`); `ctx.stdin` is `null` when nothing was piped in. Pipeline stages capture `print` output joined with `\n`, so piped text never carries a trailing newline. Errors go through `ctx.printError` with an inline English message and a working example, as in `grep` and `wc`. `help` positions are unique `order` values; 0 to 28 and 99 are taken.

## Goals / Non-Goals

**Goals:**

- One command, `base64`, with coreutils-style `-d` / `--decode`.
- Pure encode/decode helpers that tests can call without a context.

**Non-Goals:**

- `-w` line wrapping, `-i` ignore-garbage, or file arguments. There are no files to read; the argument is text, as for `cowsay`.
- Showing binary results. Bytes that are not UTF-8 are an error, not a hexdump.

## Decisions

**One command with `-d`, not `encode` and `decode`.** Everyone who knows the tool types `base64 -d`, and the terminal already mirrors coreutils names (`head -n`, `wc -l`, `grep -i`). Option parsing: if the trimmed argument is `-d` or `--decode`, or starts with one of them followed by whitespace, decode the rest. Any other first token that starts with `-` is an unknown option. Text to encode that starts with a dash can be piped in instead; text after `-d` may start with one, since URL-safe base64 can.

**`TextEncoder` / `TextDecoder` around `btoa` / `atob`.** `btoa` throws on anything above U+00FF, so the text goes through `TextEncoder` to bytes, the bytes become a binary string for `btoa`, and decoding goes the other way with `new TextDecoder('utf-8', { fatal: true })` so invalid UTF-8 throws instead of printing replacement characters. All four exist in browsers and in Node 24, so vitest needs no polyfill. Alternative considered: a hand-written base64 table, about 30 lines that the platform already has.

**Lenient decoding, then strict validation.** Before `atob`: strip all whitespace, map `-` to `+` and `_` to `/`, re-pad to a multiple of four. Then require `/^[A-Za-z0-9+/]*={0,2}$/` and a length that is a multiple of four; anything else is "not base64". This keeps the error message ours rather than the `InvalidCharacterError` text of whichever browser runs it. Re-padding cannot rescue a length of 4n+1, which is rejected.

**No trailing newline on encode.** GNU `echo hi | base64` gives `aGkK` because echo emits a newline. Here pipes carry none, so the same line gives `aGk=`. Matching GNU would mean inventing a newline the pipe does not have and breaking `base64 hi` = `echo hi | base64`. The site's own consistency wins; the CTF flag decodes either way.

**Helpers live in the command file and are exported.** `encodeBase64(text)` and `decodeBase64(text)` (throwing a small error kind for "not base64" vs "not text"). `curl.ts`, `rm.ts` and `skills.ts` already export their pure helpers for the tests the same way. No shared module: nothing else needs them. `src/lib/ctf/crypto.ts` has its own `toBase64`/`fromBase64` for key bytes; those work on `Uint8Array` for the vault and stay separate so the CTF code does not depend on a toy command.

**`order: 29`.** Next free slot, after the CTF commands. Slotting it among the filters (16 to 21) would renumber eight commands for a cosmetic gain.

## Risks / Trade-offs

- [`|` in the text splits the pipeline] → Same as every other command; base64 output never contains `|`, so decode input is unaffected.
- [Visitor expects GNU's `aGkK` for `echo hi | base64`] → Accepted; documented above. Decoding GNU output still works, it just yields `hi` plus a newline that the log does not show.
- [Leniency accepts input that a strict decoder rejects] → Only whitespace, padding and the URL-safe alphabet are forgiven; any other character is still an error.
