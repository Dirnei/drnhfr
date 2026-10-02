# Proposal

## Why

The terminal has text tools for pipes (grep, sort, wc, cowsay) but nothing to encode or decode. Base64 is the one encoding every web developer meets, and the first CTF challenge hides its flag base64-encoded in the home page source. With a `base64` command that flag can be decoded in the site's own terminal instead of in some other tab.

## What Changes

- New terminal command `base64`, shaped like the coreutils tool: `base64 <text>` encodes, `base64 -d <text>` (or `--decode`) decodes.
- It reads its argument first and piped input second, like `cowsay` and `cat`, so `echo hallo | base64` and `echo aGFsbG8= | base64 -d` both work.
- Text is handled as UTF-8, so umlauts and emoji round-trip.
- Decoding is lenient about whitespace, missing `=` padding and the URL-safe alphabet; anything that still is not base64, or decodes to bytes that are not UTF-8 text, prints an error.
- `help` and tab completion pick the command up from the registry with no further change.

## Capabilities

### New Capabilities

- `terminal/base64`: the `base64` command, its encode and decode modes, input sources and error cases.

### Modified Capabilities

None.

## Impact

- One new file in `src/lib/terminal/commands/`, plus tests in `tests/terminal.test.ts`.
- No new dependency; the browser's own encoding APIs are enough.
- No change to the CTF: the recon flag is meant to be decoded, and this only makes that possible without leaving the site.
