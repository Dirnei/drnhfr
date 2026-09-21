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

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '');
}

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
    const src = stripComments(read(FILES.entryRow));
    expect(src).toMatch(/:not\(\[data-intro=(['"])running\1\]\)\s*\.row/);
  });

  it('TerminalShortcut gates the jump on the running marker', () => {
    const src = read(FILES.terminalShortcut);
    expect(src).toContain('dataset.intro');
    expect(src).toContain("'running'");
  });
});
