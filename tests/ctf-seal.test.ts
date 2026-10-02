import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SealError, seal } from '../scripts/ctf/seal.mjs';
import { sopsDecrypt } from '../scripts/ctf/sops.mjs';
import { deriveKey, openDoor } from '../src/lib/ctf/crypto';

const ITERATIONS = 1000;
const hint = (text: string) => ({ de: text, en: text });

function door(id: string, overrides: Record<string, unknown> = {}) {
  return {
    flag: `drnhfr{${id}-sixteen-chars-long}`,
    title: { de: `Tür ${id}`, en: `Door ${id}` },
    story: { de: `# ${id}\n\nGeschichte`, en: `# ${id}\n\nStory` },
    hints: [hint('look closer'), hint('look even closer')],
    ...overrides,
  };
}

let dir: string;
let doorsDir: string;
let outDir: string;

const decryptJson = async (file: string) => JSON.parse(await readFile(file, 'utf8'));
const render = async (markdown: string) => `<p>${markdown}</p>`;
const run = (warn: (message: string) => void = () => {}) =>
  seal({ doorsDir, outDir, decrypt: decryptJson, render, warn, iterations: ITERATIONS });

async function writeDoors(doors: Record<string, unknown>) {
  for (const [name, data] of Object.entries(doors)) {
    await writeFile(join(doorsDir, name), JSON.stringify(data));
  }
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'ctf-seal-'));
  doorsDir = join(dir, 'doors');
  outDir = join(dir, 'out');
  await import('node:fs/promises').then((fs) => fs.mkdir(doorsDir));
  await writeDoors({
    '0-entry.sops.yaml': { hints: [hint('view the source')] },
    '1-site.sops.yaml': door('site'),
    '2-laser.sops.yaml': door('laser', { hints: undefined }),
  });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('seal', () => {
  it('writes one sealed file per door and a public file', async () => {
    const result = await run();
    expect(result.doors).toEqual(['site', 'laser']);
    expect((await readdir(outDir)).sort()).toEqual(['laser.sealed.json', 'public.json', 'site.sealed.json']);
    expect(Buffer.from(result.entry, 'base64').toString()).toBe('drnhfr{site-sixteen-chars-long}');
  });

  it('seals each door under its own flag', async () => {
    const result = await run();
    const sealed = JSON.parse(await readFile(join(outDir, 'laser.sealed.json'), 'utf8'));
    const key = await deriveKey('drnhfr{laser-sixteen-chars-long}', result.salt, ITERATIONS);
    const payload = await openDoor<{ html: { en: string }; hints: unknown }>(key, sealed);
    expect(payload?.html.en).toContain('Story');
    expect(payload?.hints).toBeNull();
    const wrong = await deriveKey('drnhfr{site-sixteen-chars-long}', result.salt, ITERATIONS);
    expect(await openDoor(wrong, sealed)).toBeNull();
  });

  it('leaves no flag in plain text in the output', async () => {
    await run();
    for (const name of await readdir(outDir)) {
      expect(await readFile(join(outDir, name), 'utf8')).not.toContain('drnhfr{');
    }
  });

  it('rejects a short flag', async () => {
    await writeDoors({ '1-site.sops.yaml': door('site', { flag: 'drnhfr{short}' }) });
    await expect(run()).rejects.toThrow(/at least 16 characters/);
  });

  it('rejects a missing translation', async () => {
    await writeDoors({ '1-site.sops.yaml': door('site', { story: { de: 'nur deutsch' } }) });
    await expect(run()).rejects.toThrow(/story\.en is missing/);
  });

  it('rejects hints on the last door', async () => {
    await writeDoors({ '2-laser.sops.yaml': door('laser') });
    await expect(run()).rejects.toThrow(/last door/);
  });

  it('rejects a door without hints for the next one', async () => {
    await writeDoors({ '1-site.sops.yaml': door('site', { hints: [] }) });
    await expect(run()).rejects.toThrow(SealError);
  });

  it('rejects two doors with the same flag', async () => {
    await writeDoors({
      '2-laser.sops.yaml': door('laser', { hints: undefined, flag: 'drnhfr{site-sixteen-chars-long}' }),
    });
    await expect(run()).rejects.toThrow(/share a flag/);
  });

  it('leaves existing output untouched when a door is malformed', async () => {
    await run();
    const before = await readFile(join(outDir, 'site.sealed.json'), 'utf8');
    await writeDoors({ '2-laser.sops.yaml': { flag: 'nope' } });
    await expect(run()).rejects.toThrow(SealError);
    expect(await readFile(join(outDir, 'site.sealed.json'), 'utf8')).toBe(before);
    expect((await readdir(outDir)).some((name) => name.startsWith('.staging'))).toBe(false);
  });

  it('warns about placeholder stories', async () => {
    await writeDoors({
      '1-site.sops.yaml': door('site', { story: { de: 'PLATZHALTER: kommt noch', en: 'Story' } }),
    });
    const warnings: string[] = [];
    await run((message) => warnings.push(message));
    expect(warnings).toEqual(['site: story.de is still a placeholder']);
  });
});

describe('sops decrypt errors', () => {
  it('names a missing sops binary', async () => {
    await expect(sopsDecrypt('x.yaml', 'sops-that-does-not-exist')).rejects.toThrow(/sops is not installed/);
  });
});

function findTool(name: string): string | null {
  const packages = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages');
  const candidates = [
    join(packages, 'SecretsOPerationS.SOPS_Microsoft.Winget.Source_8wekyb3d8bbwe', `${name}.exe`),
    join(packages, 'FiloSottile.age_Microsoft.Winget.Source_8wekyb3d8bbwe', 'age', `${name}.exe`),
  ];
  const local = candidates.find((path) => existsSync(path));
  if (local) return local;
  try {
    execFileSync(name, ['--version'], { stdio: 'ignore' });
    return name;
  } catch {
    return null;
  }
}

const sopsBin = findTool('sops');
const keygenBin = findTool('age-keygen');

describe.skipIf(!sopsBin || !keygenBin)('real sops round trip', () => {
  it('decrypts a door encrypted to a throwaway age key, and names a missing key', async () => {
    const keyFile = join(dir, 'keys.txt');
    const output = execFileSync(keygenBin!, ['-o', keyFile], { encoding: 'utf8', stdio: 'pipe' });
    const recipient = (await readFile(keyFile, 'utf8')).match(/public key: (age1\w+)/)?.[1] ?? output;
    const file = join(dir, 'door.yaml');
    await writeFile(file, 'flag: drnhfr{real-sops-round-trip}\n');
    execFileSync(sopsBin!, ['encrypt', '--age', recipient, '-i', file], { cwd: dir });
    expect(await readFile(file, 'utf8')).not.toContain('drnhfr{');

    const previous = process.env.SOPS_AGE_KEY_FILE;
    try {
      process.env.SOPS_AGE_KEY_FILE = keyFile;
      expect(await sopsDecrypt(file, sopsBin!)).toEqual({ flag: 'drnhfr{real-sops-round-trip}' });
      process.env.SOPS_AGE_KEY_FILE = join(dir, 'missing-keys.txt');
      await expect(sopsDecrypt(file, sopsBin!)).rejects.toThrow(/no age key can decrypt/);
    } finally {
      if (previous === undefined) delete process.env.SOPS_AGE_KEY_FILE;
      else process.env.SOPS_AGE_KEY_FILE = previous;
    }
  });
});
