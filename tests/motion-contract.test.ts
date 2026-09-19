import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FILES = {
  bootIntro: 'src/components/BootIntro.astro',
  decodeText: 'src/components/DecodeText.astro',
  entryRow: 'src/components/EntryRow.astro',
  commandPalette: 'src/components/CommandPalette.astro',
};

function read(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), 'utf8');
}

// T3a — motion contract. BootIntro, DecodeText, EntryRow and CommandPalette
// are coupled only by two string literals that nothing else type-checks or
// greps: the `data-intro="running"` marker BootIntro sets on <html> while
// the boot overlay plays, and the `intro:finished` event it dispatches when
// done. A rename of either string in one file — with the others left
// unchanged — would silently and permanently kill the row stagger
// (EntryRow), the decode/intro handshake (DecodeText), and/or the command
// palette's "don't open under the intro" guard (CommandPalette). Nothing
// else in the build would fail.
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
    const src = read(FILES.entryRow);
    expect(src).toContain("data-intro='running'");
  });

  it('CommandPalette gates opening on the running marker', () => {
    const src = read(FILES.commandPalette);
    expect(src).toContain('dataset.intro');
    expect(src).toContain("'running'");
  });
});
