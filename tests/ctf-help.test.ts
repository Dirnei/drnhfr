import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import publicData from '../src/data/ctf/public.json';
import { findCommand } from '../src/lib/terminal/registry';
import { runPipeline, splitPipeline, type ResolvedStage } from '../src/lib/terminal/pipeline';
import type { CommandContext } from '../src/lib/terminal/types';

const dir = join(process.cwd(), 'src', 'content', 'pages', 'ctf');
const helpFiles = readdirSync(dir).filter((name) => /\.(de|en)\.md$/.test(name) && !name.startsWith('ctf.'));
const slugs = [...new Set(helpFiles.map((name) => name.replace(/\.(de|en)\.md$/, '')))];
const read = (name: string) => readFileSync(join(dir, name), 'utf8');

interface Example {
  command: string;
  output: string[];
}

function examples(markdown: string): Example[] {
  const blocks = [...markdown.matchAll(/```\n([\s\S]*?)```/g)].map((match) => match[1].trimEnd().split('\n'));
  return blocks.flatMap((lines) => {
    const found: Example[] = [];
    for (const line of lines) {
      if (line.startsWith('$ ')) found.push({ command: line.slice(2), output: [] });
      else found.at(-1)?.output.push(line);
    }
    return found;
  });
}

async function run(line: string): Promise<string[]> {
  const out: string[] = [];
  const ctx = {
    print: (text: string) => void out.push(text),
    printError: (text: string) => void out.push(text),
    stdin: null,
  } as unknown as CommandContext;
  const stages = splitPipeline(line)!.map((stage) => ({ ...stage, command: findCommand(stage.name)! }));
  await runPipeline(stages as ResolvedStage[], ctx);
  return out;
}

describe('ctf help pages', () => {
  it('finds both help pages', () => {
    expect(slugs.sort()).toEqual(['ascii', 'terminal']);
  });

  it('never share a slug with a door', () => {
    expect(slugs.filter((slug) => publicData.doors.includes(slug))).toEqual([]);
  });

  for (const locale of ['de', 'en']) {
    it(`labels the ascii columns in ${locale}`, () => {
      expect(read(`ascii.${locale}.md`)).toMatch(/^columns:\n {2}dec: .+\n {2}hex: .+\n {2}bin: .+\n {2}char: .+$/m);
    });

    const offline = examples(read(`terminal.${locale}.md`)).filter(({ command }) =>
      command.split('|').every((stage) => /^\s*(echo|base64)\b/.test(stage)),
    );

    it(`has base64 examples in ${locale}`, () => {
      expect(offline.length).toBeGreaterThanOrEqual(3);
    });

    for (const { command, output } of offline) {
      it(`prints what terminal.${locale}.md says for: ${command}`, async () => {
        expect(await run(command)).toEqual(output);
      });
    }
  }

  for (const name of helpFiles) {
    it(`${name} gives nothing away`, () => {
      const text = read(name);
      expect(text).not.toMatch(/ls\s+-a/);
      expect(text).not.toMatch(/\b(10|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+/);
      expect(text).not.toContain('drnhfr{');
      expect(text).not.toMatch(/dotfile|versteckte Datei|hidden file/i);
    });
  }
});
