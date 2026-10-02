# Tasks

## 1. Encoding helpers

- [ ] 1.1 Write failing tests in `tests/terminal.test.ts` for `encodeBase64` and `decodeBase64`: `hallo` ↔ `aGFsbG8=`, `Grüße` ↔ `R3LDvMOfZQ==`, missing padding, whitespace and line breaks inside the input, URL-safe `-`/`_`, `not*base64` and a 4n+1 length rejected as not base64, `//79` rejected as not text; verify `npm test` fails on the missing export
- [ ] 1.2 Create `src/lib/terminal/commands/base64.ts` exporting both helpers (TextEncoder/TextDecoder with `fatal: true` around `btoa`/`atob`, normalise then validate before decoding) and verify the 1.1 tests pass

## 2. The command

- [ ] 2.1 Write failing command tests with `stubContext`: `base64 hallo`, `-d` and `--decode`, `echo hallo | base64` and `echo Grüße | base64 | base64 -d` through `runPipeline`, argument winning over stdin, a 100-character input printing one unwrapped line, and the four errors (no input, not base64, not text, unknown option `-x`) each going to `printError` with nothing printed
- [ ] 2.2 Add the default export to `base64.ts` (`name: 'base64'`, `usage: 'base64 [-d] <text>'`, `order: 29`, option parsing as in design.md, error messages with a working example) and verify the 2.1 tests pass and the existing unique-order test still passes

## 3. Verification

- [ ] 3.1 Run `npm run check` (0/0/0), `npm test`, `npm run check:links` and `npm run check:gdpr`, all green
- [ ] 3.2 Build, serve `dist/` on a throwaway port and in headless Chromium run `help`, `base64 Grüße`, `echo Grüße | base64 | base64 -d` and `base64 -d not*base64` in the terminal; verify the outputs match the spec and the error line renders in the error style
- [ ] 3.3 Restart `astro dev` (a new command file is not seen by the running glob) and verify `base64 hallo` prints `aGFsbG8=` there and Tab completes `bas` to `base64`
