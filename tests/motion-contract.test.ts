import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FILES = {
  bootIntro: 'src/components/BootIntro.astro',
  decodeText: 'src/components/DecodeText.astro',
  entryRow: 'src/components/EntryRow.astro',
  terminalShortcut: 'src/components/TerminalShortcut.astro',
};

function read(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), 'utf8');
}

// Strips /* ... */ block comments so assertions below can't be satisfied by
// prose that merely mentions the selector — they must match code.
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '');
}

// T3a — motion contract. BootIntro, DecodeText, EntryRow and
// TerminalShortcut are coupled only by two string literals that nothing else
// type-checks or greps: the `data-intro="running"` marker BootIntro sets on
// <html> while the boot overlay plays, and the `intro:finished` event it
// dispatches when done. A rename of either string in one file — with the
// others left unchanged — would silently and permanently kill the row
// stagger (EntryRow), the decode/intro handshake (DecodeText), and/or the
// "don't jump to a dead prompt under the intro" guard (TerminalShortcut).
// Nothing else in the build would fail.
describe('motion contract: data-intro / running / intro:finished', () => {
  it('BootIntro sets the running marker and dispatches intro:finished', () => {
    const src = read(FILES.bootIntro);
    expect(src).toContain("dataset.intro = 'running'");
    expect(src).toContain('intro:finished');
  });

  it('DecodeText reads the running marker and listens for intro:finished', () => {
    const src = read(FILES.decodeText);
    expect(src).toContain('dataset.intro');
    expect(src).toContain("'running'");
    expect(src).toContain('intro:finished');
  });

  it("EntryRow gates the row stagger on the [data-intro='running'] attribute", () => {
    // Matched against the comment-stripped source: the same string sits in
    // an explanatory comment a few lines above the real selector, so a rename
    // of the selector alone (leaving the comment stale) must still fail this.
    const src = stripComments(read(FILES.entryRow));
    expect(src).toMatch(/:not\(\[data-intro=(['"])running\1\]\)\s*\.row/);
  });

  it('TerminalShortcut gates the jump on the running marker', () => {
    const src = read(FILES.terminalShortcut);
    expect(src).toContain('dataset.intro');
    expect(src).toContain("'running'");
  });
});
