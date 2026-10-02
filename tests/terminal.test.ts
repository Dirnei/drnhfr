import { describe, expect, it } from 'vitest';
import { commands, completionNames, findCommand } from '../src/lib/terminal/registry';
import { isListed, renderHelp } from '../src/lib/terminal/help-text';
import { findIn, formatListing, nameFromHref } from '../src/lib/terminal/fs';
import { codeFor, codeMatches } from '../src/lib/terminal/unlock';
import {
  ASCII_INK,
  BLOCK_INK,
  FONT,
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  renderBanner,
} from '../src/lib/terminal/font';
import { clock, humanise, humaniseCoarse } from '../src/lib/terminal/duration';
import { resolveTarget } from '../src/lib/terminal/commands/curl';
import { runPipeline, splitPipeline } from '../src/lib/terminal/pipeline';
import { parseLineCount } from '../src/lib/terminal/pipeline';
import { parseRm } from '../src/lib/terminal/commands/rm';
import { bar } from '../src/lib/terminal/commands/skills';
import type { CommandContext, SearchEntry } from '../src/lib/terminal/types';
import type { Ctf, DoorPayload, SubmitResult } from '../src/lib/ctf/doors';

const noCtf: Ctf = {
  doors: [],
  restore: async () => {},
  submit: async () => ({ kind: 'wrong' }),
  hint: () => ({ kind: 'done' }),
  opened: () => [],
  payload: () => undefined,
  onChange: () => {},
  started: () => false,
  start: () => {},
  elapsed: () => null,
  finishedIn: () => null,
};

describe('the unlock code', () => {
  it.each([
    ['2026-09-21 10:05', new Date(2026, 8, 21, 10, 5), '90126201'],
    ['2026-12-05 14:37', new Date(2026, 11, 5, 14, 37), '21506241'],
    ['2027-01-01 00:00', new Date(2027, 0, 1, 0, 0), '10107200'],
  ])('%s -> %s', (_label, date, expected) => {
    expect(codeFor(date)).toBe(expected);
  });

  it('holds for the whole hour', () => {
    expect(codeFor(new Date(2026, 8, 21, 10, 0))).toBe(codeFor(new Date(2026, 8, 21, 10, 59)));
  });

  it('changes when the hour does', () => {
    expect(codeFor(new Date(2026, 8, 21, 10, 59))).not.toBe(codeFor(new Date(2026, 8, 21, 11, 0)));
  });

  it('still accepts the code from a minute ago across an hour boundary', () => {
    const justAfterEleven = new Date(2026, 8, 21, 11, 0, 30);
    const tenOClockCode = codeFor(new Date(2026, 8, 21, 10, 0));
    expect(codeMatches(tenOClockCode, justAfterEleven)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(codeMatches('00000000', new Date(2026, 8, 21, 10, 5))).toBe(false);
  });
});

describe('the filesystem', () => {
  const entries: SearchEntry[] = [
    { href: '/de/projekte/', type: 'page' },
    { href: '/de/projekte/akka-cluster/', type: 'project' },
    { href: '/de/projekte/split-brain/', type: 'project' },
    { href: '/de/kontakt/', type: 'page', aliases: ['kontakt', 'contact'] },
  ];

  it('takes the last segment as the name', () => {
    expect(nameFromHref('/de/projekte/akka-cluster/')).toBe('akka-cluster');
    expect(nameFromHref('/de/')).toBe('de');
  });

  it('resolves a bare name, ignoring case and slashes', () => {
    expect(findIn(entries, 'PROJEKTE')?.href).toBe('/de/projekte/');
    expect(findIn(entries, '/projekte/')?.href).toBe('/de/projekte/');
    expect(findIn(entries, 'nope')).toBeUndefined();
    expect(findIn(entries, '  ')).toBeUndefined();
  });

  it('resolves the name in the other language too', () => {
    expect(findIn(entries, 'contact')?.href).toBe('/de/kontakt/');
    expect(findIn(entries, 'Contact/')?.href).toBe('/de/kontakt/');
    expect(findIn(entries, 'kontakt')?.href).toBe('/de/kontakt/');
  });

  it('lists pages first, then projects', () => {
    const rows = formatListing(entries).split('\n');
    expect(rows.map((row) => row.trim().split(/\s{2,}/)[0])).toEqual([
      'kontakt/',
      'projekte/',
      'akka-cluster',
      'split-brain',
    ]);
  });

  it('aligns the kind column to the longest name', () => {
    const rows = formatListing(entries).split('\n');
    const columns = rows.map((row) => row.indexOf(row.trim().split(/\s{2,}/)[1]));
    expect(new Set(columns).size).toBe(1);
  });
});

describe('the command registry', () => {
  it('found every command file', () => {
    expect(commands.length).toBeGreaterThanOrEqual(11);
  });

  it('has no duplicate names or aliases', () => {
    const names = commands.flatMap((command) => [command.name, ...(command.aliases ?? [])]);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every command a distinct position in help', () => {
    const orders = commands.map((command) => command.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('dispatches names and aliases, case-insensitively', () => {
    expect(findCommand('ls')?.name).toBe('ls');
    expect(findCommand('LS')?.name).toBe('ls');
    expect(findCommand('?')?.name).toBe('help');
    expect(findCommand('sudo')).toBeUndefined();
  });

  it('offers primary names to Tab, but not aliases', () => {
    const { ctx } = stubContext();
    expect(completionNames(ctx)).toContain('whoami');
    expect(completionNames(ctx)).not.toContain('?');
  });

  it('lists exit only once unlocked, and su only while locked', () => {
    const guest = stubContext({ isUnlocked: () => false }).ctx;
    const root = stubContext({ isUnlocked: () => true }).ctx;
    expect(completionNames(guest)).toContain('su');
    expect(completionNames(guest)).not.toContain('exit');
    expect(completionNames(root)).toContain('exit');
    expect(completionNames(root)).not.toContain('su');
  });

  it('still runs a command that is not listed', () => {
    const { ctx, out } = stubContext({ isUnlocked: () => false });
    findCommand('exit')!.run('', ctx);
    expect(out[0]).toBe('already guest.');
  });

  it('renders help from the registry, one row per visible command', () => {
    const { ctx } = stubContext();
    const rendered = renderHelp(commands, ctx).split('\n');
    expect(rendered[0]).toBe('available commands:');
    const listed = commands.filter((command) => isListed(command, ctx));
    expect(rendered).toHaveLength(listed.length + 1);
    for (const command of listed) {
      expect(rendered.some((row) => row.startsWith(command.usage))).toBe(true);
    }
  });

  it('keeps sl out of help and out of Tab', () => {
    expect(findCommand('sl')?.name).toBe('sl');
    const { ctx } = stubContext();
    expect(completionNames(ctx)).not.toContain('sl');
    const rows = renderHelp(commands, ctx).split('\n');
    expect(rows.some((row) => row.startsWith('sl'))).toBe(false);
  });

  it('aligns every summary in the same column', () => {
    const { ctx } = stubContext();
    const rows = renderHelp(commands, ctx).split('\n').slice(1);
    const starts = commands
      .filter((command) => isListed(command, ctx))
      .map((command) => rows.find((row) => row.startsWith(command.usage))!.indexOf(command.summary));
    expect(new Set(starts).size).toBe(1);
  });
});

function stubContext(overrides: Partial<CommandContext> = {}) {
  const out: string[] = [];
  const art: string[] = [];
  const err: string[] = [];
  const ctx = {
    config: {
      lang: 'de',
      cvHref: '/de/lebenslauf/',
      cvAliases: ['lebenslauf', 'cv'],
      homeHref: '/de/',
      otherHomeHref: '/en/',
      searchHref: '/de/search.json',
      boot: { lines: [], lineStepMinMs: 0, lineStepMaxMs: 0 },
      lastCommit: null,
    },
    print: (text: string) => void out.push(text),
    printArt: (text: string) => void art.push(text),
    printError: (text: string) => void err.push(text),
    clearScreen: () => {},
    entries: () => [],
    find: () => undefined,
    commands: () => commands,
    isUnlocked: () => false,
    setUnlocked: () => {},
    draw: () => ({ update: () => {}, end: () => {} }),
    columns: () => 80,
    charWidth: () => 7.8,
    uptimeMs: () => 252000,
    history: () => [],
    interrupted: () => new Promise<void>(() => {}),
    reducedMotion: () => true,
    navigate: () => {},
    openTab: () => true,
    origin: 'https://www.dirnhofer.net',
    path: '/de/',
    stdin: null,
    reboot: () => {},
    remove: () => {},
    wipe: () => {},
    ctf: () => noCtf,
    ...overrides,
  } as CommandContext;
  return { ctx, out, art, err };
}

describe('the block font', () => {
  it('has a rectangular grid for every glyph', () => {
    for (const [char, glyph] of Object.entries(FONT)) {
      expect(glyph, `${char} height`).toHaveLength(GLYPH_HEIGHT);
      for (const row of glyph) {
        expect(row.length, `${char} row "${row}"`).toBe(GLYPH_WIDTH);
        expect(row, `${char} row "${row}"`).toMatch(/^[#.]+$/);
      }
    }
  });

  it('renders one row per glyph row, whatever the input', () => {
    expect(renderBanner('drnhfr')).toHaveLength(GLYPH_HEIGHT);
    expect(renderBanner('')).toHaveLength(GLYPH_HEIGHT);
  });

  it('falls back to blank for characters it has no glyph for', () => {
    expect(() => renderBanner('日本語')).not.toThrow();
    expect(renderBanner('日')).toHaveLength(GLYPH_HEIGHT);
  });

  it('is case-insensitive', () => {
    expect(renderBanner('abc')).toEqual(renderBanner('ABC'));
  });
});

describe('cowsay', () => {
  const cowsay = findCommand('cowsay')!;

  it('puts one line in a < > bubble', () => {
    const { ctx, art } = stubContext();
    cowsay.run('moo', ctx);
    const lines = art[0].split('\n');
    expect(lines[1]).toBe('< moo >');
    expect(lines[0]).toBe(' _____');
    expect(lines[2]).toBe(' -----');
  });

  it('switches to the / | \ frame once it wraps', () => {
    const { ctx, art } = stubContext({ columns: () => 30 });
    cowsay.run('the quick brown fox jumps over the lazy dog', ctx);
    const lines = art[0].split('\n');
    expect(lines[1].startsWith('/')).toBe(true);
    expect(lines[1].endsWith(String.fromCharCode(92))).toBe(true);
    const backslash = String.fromCharCode(92);
    expect(lines.some((line) => line.startsWith(backslash) && line.endsWith('/'))).toBe(true);
  });

  it('says moo when given nothing', () => {
    const { ctx, art } = stubContext();
    cowsay.run('', ctx);
    expect(art[0]).toContain('< moo >');
  });

  it('keeps every bubble line the same width', () => {
    const { ctx, art } = stubContext({ columns: () => 30 });
    cowsay.run('one two three four five six seven eight', ctx);
    const body = art[0].split('\n').slice(1, -6);
    expect(body.length).toBeGreaterThan(1);
    expect(new Set(body.map((line) => line.length)).size).toBe(1);
  });
});

describe('figlet', () => {
  const figlet = findCommand('figlet')!;

  it('writes the argument large', async () => {
    const { ctx, art } = stubContext();
    await figlet.run('hi', ctx);
    expect(art[0].split('\n')).toHaveLength(GLYPH_HEIGHT);
    expect(art[0]).toContain('█');
  });

  it('defaults to the site name', async () => {
    const { ctx, art } = stubContext();
    await figlet.run('', ctx);
    expect(art[0]).toBe(renderBanner('drnhfr').join('\n'));
  });

  it('falls back to ASCII ink when the block glyph is not cell-perfect', async () => {
    const { ctx, art } = stubContext({
      charWidth: (sample: string) => (sample.includes(BLOCK_INK) ? 9.4 : 7.8),
    });
    await figlet.run('hi', ctx);
    expect(art[0]).toContain(ASCII_INK);
    expect(art[0]).not.toContain(BLOCK_INK);
  });

  it('uses block ink when the glyph measures true', async () => {
    const { ctx, art } = stubContext({ charWidth: () => 7.8 });
    await figlet.run('hi', ctx);
    expect(art[0]).toContain(BLOCK_INK);
  });

  it('refuses a banner nobody asked for', async () => {
    const { ctx, art, err } = stubContext();
    await figlet.run('x'.repeat(200), ctx);
    expect(art).toHaveLength(0);
    expect(err[0]).toContain('plenty');
  });
});

describe('the small useful ones', () => {
  it('echo says it back', () => {
    const { ctx, out } = stubContext();
    findCommand('echo')!.run('  hello there  ', ctx);
    expect(out[0]).toBe('hello there');
  });

  it('uptime humanises the clock', () => {
    const { ctx, out } = stubContext({ uptimeMs: () => 252_000 });
    findCommand('uptime')!.run('', ctx);
    expect(out[0]).toBe('up 4m 12s, 1 user');
  });

  it('uptime drops the hour until there is one', () => {
    const { ctx, out } = stubContext({ uptimeMs: () => 9_000 });
    findCommand('uptime')!.run('', ctx);
    expect(out[0]).toBe('up 9s, 1 user');
  });

  it('uptime counts hours once there are', () => {
    const { ctx, out } = stubContext({ uptimeMs: () => 3_723_000 });
    findCommand('uptime')!.run('', ctx);
    expect(out[0]).toBe('up 1h 2m 3s, 1 user');
  });

  it('history numbers the entries, right-aligned', () => {
    const many = Array.from({ length: 11 }, (_, index) => `cmd${index + 1}`);
    const { ctx, out } = stubContext({ history: () => many });
    findCommand('history')!.run('', ctx);
    const rows = out[0].split('\n');
    expect(rows[0]).toBe(' 1  cmd1');
    expect(rows[10]).toBe('11  cmd11');
  });

  it('history says so when there is none', () => {
    const { ctx, out } = stubContext({ history: () => [] });
    findCommand('history')!.run('', ctx);
    expect(out[0]).toBe('(nothing yet)');
  });
});

describe('fortune', () => {
  it('prints one of the fortunes', async () => {
    const { FORTUNES } = await import('../src/lib/terminal/fortunes');
    const { ctx, out } = stubContext();
    await findCommand('fortune')!.run('', ctx);
    expect(FORTUNES).toContain(out[0]);
  });

  it('attributes nothing to anyone', async () => {
    const { FORTUNES } = await import('../src/lib/terminal/fortunes');
    for (const line of FORTUNES) {
      expect(line).not.toMatch(/\s[-—]{1,2}\s*[A-Z][a-z]+\s+[A-Z]/);
    }
  });
});

describe('pipes', () => {
  const resolve = (raw: string) =>
    splitPipeline(raw)!.map((stage) => ({ ...stage, command: findCommand(stage.name)! }));

  it('splits on | and keeps each argument', () => {
    expect(splitPipeline('echo hi there | cowsay')).toEqual([
      { name: 'echo', arg: 'hi there' },
      { name: 'cowsay', arg: '' },
    ]);
  });

  it('rejects an empty stage', () => {
    expect(splitPipeline('fortune |')).toBeNull();
    expect(splitPipeline('| cowsay')).toBeNull();
    expect(splitPipeline('fortune || cowsay')).toBeNull();
  });

  it('hands the output of one command to the next', async () => {
    const { ctx, out, art } = stubContext();
    await runPipeline(resolve('echo hello there | cowsay'), ctx);
    expect(out).toHaveLength(0);
    expect(art[0]).toContain('< hello there >');
  });

  it('lets fortune feed the cow', async () => {
    const { FORTUNES } = await import('../src/lib/terminal/fortunes');
    const { ctx, out, art } = stubContext({ columns: () => 200 });
    await runPipeline(resolve('fortune | cowsay'), ctx);
    expect(out).toHaveLength(0);
    const bubbleEdges = ['<', '|', '/', String.fromCharCode(92)];
    const said = art[0]
      .split(String.fromCharCode(10))
      .filter((line) => bubbleEdges.includes(line[0]))
      .map((line) => line.slice(2, -2).trim())
      .join(' ');
    expect(FORTUNES).toContain(said);
  });

  it('prefers an argument over piped input', async () => {
    const { ctx, art } = stubContext();
    await runPipeline(resolve('echo ignored | cowsay moo'), ctx);
    expect(art[0]).toContain('< moo >');
  });

  it('still shows errors from the middle of a pipe', async () => {
    const { ctx, err, art } = stubContext();
    await runPipeline(resolve('cat | cowsay'), ctx);
    expect(err[0]).toContain('missing operand');
    expect(art[0]).toContain('< moo >');
  });

  it('cat passes piped input straight through', async () => {
    const { ctx, out } = stubContext();
    await runPipeline(resolve('echo hi there | cat'), ctx);
    expect(out).toEqual(['hi there']);
  });
});

describe('the filters', () => {
  const resolve = (raw: string) =>
    splitPipeline(raw)!.map((stage) => ({ ...stage, command: findCommand(stage.name)! }));
  const piped = async (raw: string, stdin: string) => {
    const result = stubContext({ stdin });
    await runPipeline(resolve(raw), result.ctx);
    return result;
  };
  const NL = String.fromCharCode(10);
  const text = ['alpha one', 'Beta two', 'gamma three', 'beta four'].join(NL);

  it('grep keeps matching lines, case-sensitive like the real one', async () => {
    expect((await piped('grep beta', text)).out).toEqual(['beta four']);
    expect((await piped('grep -i beta', text)).out).toEqual([['Beta two', 'beta four'].join(NL)]);
  });

  it('grep prints nothing when nothing matches', async () => {
    const { out, err } = await piped('grep delta', text);
    expect(out).toHaveLength(0);
    expect(err).toHaveLength(0);
  });

  it('grep, head and wc explain themselves when nothing is piped in', async () => {
    for (const name of ['grep x', 'head', 'wc']) {
      const { ctx, err } = stubContext();
      await runPipeline(resolve(name), ctx);
      expect(err[0], name).toContain('pipe something in');
    }
  });

  it('grep asks for a word', async () => {
    const { err } = await piped('grep', text);
    expect(err[0]).toContain('look for');
  });

  it('head reads -n 2, -n2 and -2 the same way', async () => {
    expect(parseLineCount('-n 2')).toBe(2);
    expect(parseLineCount('-n2')).toBe(2);
    expect(parseLineCount('-2')).toBe(2);
    expect(parseLineCount('')).toBe(10);
    expect(parseLineCount('two')).toBeNull();
    const { out } = await piped('head -n 2', text);
    expect(out).toEqual([['alpha one', 'Beta two'].join(NL)]);
  });

  it('wc counts lines, words and characters like the real one', async () => {
    expect((await piped('wc -l', text)).out).toEqual(['4']);
    expect((await piped('wc -w', text)).out).toEqual(['8']);
    expect((await piped('wc -c', text)).out).toEqual([String(text.length + 1)]);
    expect((await piped('wc', text)).out[0].trim().split(/\s+/)).toEqual(['4', '8', String(text.length + 1)]);
    expect((await piped('wc -x', text)).err[0]).toContain('unknown option');
  });

  it('tail keeps the last lines', async () => {
    const { out } = await piped('tail -n 2', text);
    expect(out).toEqual([['gamma three', 'beta four'].join(NL)]);
  });

  it('sort orders lines, -r reverses, -n compares numbers', async () => {
    expect((await piped('sort', text)).out).toEqual([['alpha one', 'beta four', 'Beta two', 'gamma three'].join(NL)]);
    expect((await piped('sort -r', text)).out[0].split(NL)[0]).toBe('gamma three');
    const numbers = ['10', '9', '100'].join(NL);
    expect((await piped('sort -n', numbers)).out).toEqual([['9', '10', '100'].join(NL)]);
    expect((await piped('sort -rn', numbers)).out).toEqual([['100', '10', '9'].join(NL)]);
    expect((await piped('sort -x', text)).err[0]).toContain('unknown option');
  });

  it('uniq folds neighbouring repeats only, -c counts them', async () => {
    const repeats = ['ls', 'ls', 'cd', 'ls'].join(NL);
    expect((await piped('uniq', repeats)).out).toEqual([['ls', 'cd', 'ls'].join(NL)]);
    expect((await piped('sort | uniq -c', repeats)).out).toEqual([
      ['      1 cd', '      3 ls'].join(NL),
    ]);
  });

  it('tail, sort and uniq explain themselves when nothing is piped in', async () => {
    for (const name of ['tail', 'sort', 'uniq']) {
      const { ctx, err } = stubContext();
      await runPipeline(resolve(name), ctx);
      expect(err[0], name).toContain('pipe something in');
    }
  });

  it('chains through several stages', async () => {
    const { ctx, out } = stubContext({ history: () => ['ls', 'cd projekte', 'ls', 'cd ..', 'help'] });
    await runPipeline(resolve('history | grep cd | wc -l'), ctx);
    expect(out).toEqual(['2']);
  });
});

describe('rm', () => {
  const rm = findCommand('rm')!;
  const ENTRIES: SearchEntry[] = [
    { href: '/en/contact/', type: 'page', aliases: ['kontakt', 'contact'] },
    { href: '/en/imprint/', type: 'page' },
    { href: '/en/projects/', type: 'page' },
    { href: '/en/projects/edict/', type: 'project' },
    { href: '/en/projects/servus/', type: 'project' },
  ];
  const fsContext = () => {
    const removed: string[] = [];
    let wiped = false;
    const visible = () => ENTRIES.filter((entry) => !removed.includes(entry.href));
    const result = stubContext({
      entries: visible,
      find: (name: string) => findIn(visible(), name),
      remove: (href: string) => void removed.push(href),
      wipe: () => void (wiped = true),
    });
    return { ...result, removed, wiped: () => wiped };
  };

  it('reads flags in any order and keeps every target', () => {
    const { flags, targets } = parseRm('-r -v contact /imprint');
    expect([...flags].sort()).toEqual(['r', 'v']);
    expect(targets).toEqual(['contact', '/imprint']);
    expect([...parseRm('-rfv x').flags].sort()).toEqual(['f', 'r', 'v']);
  });

  it('removes a page', () => {
    const { ctx, removed, out, err } = fsContext();
    rm.run('contact', ctx);
    expect(removed).toEqual(['/en/contact/']);
    expect(out).toHaveLength(0);
    expect(err).toHaveLength(0);
  });

  it('removes a page by its name in the other language', () => {
    const { ctx, removed } = fsContext();
    rm.run('kontakt', ctx);
    expect(removed).toEqual(['/en/contact/']);
  });

  it('removes several targets and says so with -v', () => {
    const { ctx, removed, out } = fsContext();
    rm.run('-v contact imprint', ctx);
    expect(removed).toEqual(['/en/contact/', '/en/imprint/']);
    expect(out).toEqual(["removed 'contact/'", "removed 'imprint/'"]);
  });

  it('wants -r for a directory with things in it', () => {
    const plain = fsContext();
    rm.run('projects', plain.ctx);
    expect(plain.removed).toHaveLength(0);
    expect(plain.err[0]).toBe("rm: cannot remove 'projects/': Is a directory");

    const recursive = fsContext();
    rm.run('-r projects', recursive.ctx);
    expect(recursive.removed).toEqual(['/en/projects/edict/', '/en/projects/servus/', '/en/projects/']);
  });

  it('says so when the target does not exist, or no longer does', () => {
    const { ctx, err } = fsContext();
    rm.run('nope', ctx);
    rm.run('contact', ctx);
    rm.run('contact', ctx);
    expect(err).toEqual([
      "rm: cannot remove 'nope': No such file or directory",
      "rm: cannot remove 'contact': No such file or directory",
    ]);
  });

  it('wipes everything for rm -rf /', () => {
    for (const arg of ['-rf /', '-fr /*', '-r -f /', '-rf --no-preserve-root /']) {
      const { ctx, wiped } = fsContext();
      rm.run(arg, ctx);
      expect(wiped(), arg).toBe(true);
    }
  });

  it('refuses / without -r and complains about a missing operand', () => {
    const root = fsContext();
    rm.run('/', root.ctx);
    expect(root.wiped()).toBe(false);
    expect(root.err[0]).toContain('Is a directory');

    const empty = fsContext();
    rm.run('-rf', empty.ctx);
    expect(empty.err[0]).toBe('rm: missing operand');
  });
});

describe('skills', () => {
  const resolve = (raw: string) =>
    splitPipeline(raw)!.map((stage) => ({ ...stage, command: findCommand(stage.name)! }));
  const NL = String.fromCharCode(10);

  it('draws a ten-cell bar from the level', () => {
    expect(bar(98)).toBe('██████████');
    expect(bar(45)).toBe('█████░░░░░');
    expect(bar(0, '#', '-')).toBe('----------');
  });

  it('prints one line per skill in cv.json, level first', async () => {
    const cv = (await import('../src/data/cv.json')).default;
    const total = cv.expertise.reduce((sum, group) => sum + group.skills.length, 0);
    const { ctx, out } = stubContext({ columns: () => 120 });
    await findCommand('skills')!.run('', ctx);
    const lines = out[0].split(NL);
    expect(lines).toHaveLength(total);
    for (const line of lines) expect(line).toMatch(/^\s*\d{1,3}  /);
    expect(lines[0]).toContain(cv.expertise[0].group);
  });

  it('feeds sort, head and grep', async () => {
    const cv = (await import('../src/data/cv.json')).default;
    const top = Math.max(...cv.expertise.flatMap((group) => group.skills.map((skill) => skill.level)));
    const sorted = stubContext({ columns: () => 120 });
    await runPipeline(resolve('skills | sort -rn | head -n 1'), sorted.ctx);
    expect(parseInt(sorted.out[0], 10)).toBe(top);

    const grepped = stubContext({ columns: () => 120 });
    await runPipeline(resolve('skills | grep Databases'), grepped.ctx);
    expect(grepped.out[0].split(NL)).toHaveLength(
      cv.expertise.find((group) => group.group === 'Databases')!.skills.length,
    );
  });

  it('drops the group column when the log is narrow', async () => {
    const { ctx, out } = stubContext({ columns: () => 40 });
    await findCommand('skills')!.run('', ctx);
    expect(out[0]).not.toContain('Programming Languages');
  });

  it('falls back to ASCII bars when the block glyph is not cell-perfect', async () => {
    const { ctx, out } = stubContext({
      columns: () => 120,
      charWidth: (sample: string) => (sample.includes('█') ? 9.4 : 7.8),
    });
    await findCommand('skills')!.run('', ctx);
    expect(out[0]).not.toContain('█');
    expect(out[0]).toContain('#');
  });

  it('points at grep when given an argument', async () => {
    const { ctx, err } = stubContext();
    await findCommand('skills')!.run('devops', ctx);
    expect(err[0]).toContain('skills | grep');
  });
});

describe('whoami', () => {
  it('names the user, not the person', () => {
    const guest = stubContext({ isUnlocked: () => false });
    findCommand('whoami')!.run('', guest.ctx);
    expect(guest.out[0]).toBe('guest');

    const root = stubContext({ isUnlocked: () => true });
    findCommand('whoami')!.run('', root.ctx);
    expect(root.out[0]).toBe('root');
  });
});

describe('curl', () => {
  const ORIGIN = 'https://www.dirnhofer.net';

  it('treats a bare host as a host', () => {
    expect(resolveTarget('example.com', ORIGIN)).toEqual({
      ok: true,
      href: 'https://example.com/',
    });
  });

  it('treats a leading slash as a path on this site', () => {
    expect(resolveTarget('/de/projekte/', ORIGIN)).toEqual({
      ok: true,
      href: 'https://www.dirnhofer.net/de/projekte/',
    });
  });

  it('keeps an explicit scheme', () => {
    expect(resolveTarget('http://example.com/x', ORIGIN)).toEqual({
      ok: true,
      href: 'http://example.com/x',
    });
  });

  it.each([
    ['javascript:alert(1)'],
    ['JavaScript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['file:///etc/passwd'],
  ])('refuses %s', (hostile) => {
    const result = resolveTarget(hostile, ORIGIN);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('unsupported protocol');
  });

  it('asks for a url when given none', () => {
    const result = resolveTarget('   ', ORIGIN);
    expect(result.ok).toBe(false);
  });

  it('reports a blocked popup instead of pretending it worked', () => {
    const { ctx, out, err } = stubContext({ openTab: () => false });
    findCommand('curl')!.run('example.com', ctx);
    expect(out).toHaveLength(0);
    expect(err[0]).toContain('blocked');
  });

  it('says where it went', () => {
    const opened: string[] = [];
    const { ctx, out } = stubContext({
      openTab: (href: string) => {
        opened.push(href);
        return true;
      },
    });
    findCommand('curl')!.run('example.com', ctx);
    expect(opened).toEqual(['https://example.com/']);
    expect(out[0]).toContain('https://example.com/');
  });

  it('answers to wget as well', () => {
    expect(findCommand('wget')?.name).toBe('curl');
  });
});

describe('duration formatting', () => {
  it.each([
    [9_000, '9s'],
    [252_000, '4m 12s'],
    [3_723_000, '1h 2m 3s'],
    [200_000_000, '2d 7h 33m 20s'],
    [0, '0s'],
  ])('%i ms -> %s', (ms, expected) => {
    expect(humanise(ms)).toBe(expected);
  });

  it.each([
    [9_000, '9s'],
    [252_000, '4m 12s'],
    [3_723_000, '1h 2m'],
    [200_000_000, '2d 7h'],
  ])('coarse: %i ms -> %s', (ms, expected) => {
    expect(humaniseCoarse(ms)).toBe(expected);
  });
});

describe('uptime and the last commit', () => {
  const withCommit = (iso: string | null, uptimeMs = 252_000) =>
    stubContext({
      uptimeMs: () => uptimeMs,
      config: {
        lang: 'de',
        cvHref: '/de/lebenslauf/',
      cvAliases: ['lebenslauf', 'cv'],
        homeHref: '/de/',
        otherHomeHref: '/en/',
        searchHref: '/de/search.json',
        boot: { lines: [], lineStepMinMs: 0, lineStepMaxMs: 0 },
        lastCommit: iso,
      },
    });

  it('reports the age of the last commit', () => {
    const twoDaysAgo = new Date(Date.now() - 200_000_000).toISOString();
    const { ctx, out } = withCommit(twoDaysAgo);
    findCommand('uptime')!.run('', ctx);
    expect(out[0]).toBe('up 4m 12s, 1 user');
    expect(out[1]).toBe('last commit 2d 7h ago');
  });

  it('says nothing when git could not answer', () => {
    const { ctx, out } = withCommit(null);
    findCommand('uptime')!.run('', ctx);
    expect(out).toHaveLength(1);
  });

  it('says nothing rather than "0s ago" when the clock is behind the build', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { ctx, out } = withCommit(future);
    findCommand('uptime')!.run('', ctx);
    expect(out).toHaveLength(1);
  });

  it('says nothing when the timestamp is unparseable', () => {
    const { ctx, out } = withCommit('not-a-date');
    findCommand('uptime')!.run('', ctx);
    expect(out).toHaveLength(1);
  });
});

describe('cd', () => {
  const cd = findCommand('cd')!;
  const go = (arg: string, path: string) => {
    const visited: string[] = [];
    const { ctx, err } = stubContext({ path, navigate: (href) => void visited.push(href) });
    cd.run(arg, ctx);
    return { visited, err };
  };

  it('goes home for ~, / and no argument', () => {
    for (const arg of ['~', '/', '~/', '']) {
      expect(go(arg, '/de/projekte/').visited).toEqual(['/de/']);
    }
  });

  it('goes up one level for ..', () => {
    expect(go('..', '/de/projekte/edict/').visited).toEqual(['/de/projekte/']);
    expect(go('..', '/de/projekte/').visited).toEqual(['/de/']);
  });

  it('stays put when already there', () => {
    expect(go('~', '/de/').visited).toEqual([]);
    expect(go('..', '/de/').visited).toEqual([]);
    expect(go('.', '/de/projekte/').visited).toEqual([]);
  });

  it('reports an unknown target', () => {
    const { visited, err } = go('nirgendwo', '/de/');
    expect(visited).toEqual([]);
    expect(err).toHaveLength(1);
  });
});

const both = (text: string) => ({ de: text, en: text });

function door(overrides: Partial<DoorPayload> = {}): DoorPayload {
  return {
    title: both('Diese Seite'),
    html: both('<p>story</p>'),
    hints: null,
    terminal: { files: [], hosts: [] },
    downloads: [],
    ...overrides,
  };
}

function fakeCtf(open: Record<string, DoorPayload>, overrides: Partial<Ctf> = {}): Ctf {
  return {
    ...noCtf,
    doors: ['site', 'homelab', 'laser', 'dartomat', 'smarthome'],
    opened: () => Object.entries(open).map(([id, payload]) => ({ door: id, payload })),
    payload: (id) => open[id],
    ...overrides,
  };
}

const run = async (line: string, ctx: CommandContext) => {
  const [name, ...rest] = line.split(' ');
  await findCommand(name)!.run(rest.join(' '), ctx);
};

const siteDoor = door({
  terminal: { files: [{ name: '.env', content: 'HOMELAB_DOOR=drnhfr{test}' }], hosts: [] },
});
const homelabDoor = door({
  title: both('Homelab'),
  terminal: {
    files: [],
    hosts: [
      { host: '10.0.30.7', status: 200, headers: { 'X-Flag': 'drnhfr{laser}' }, body: '<h1>hi</h1>' },
      { host: '10.0.30.5', error: 'curl: (1) Received HTTP/0.9 when not allowed' },
    ],
  },
});

describe('submit', () => {
  const submitting = (result: SubmitResult, open: Record<string, DoorPayload> = { site: siteDoor }) =>
    stubContext({ ctf: () => fakeCtf(open, { submit: async () => result }) });

  it('names the door that opened and how to get there', async () => {
    const { ctx, out, err } = submitting({ kind: 'opened', door: 'site', persisted: true });
    await run('submit drnhfr{x}', ctx);
    expect(err).toEqual([]);
    expect(out).toEqual(['door opened: Diese Seite  (1/5)', 'cd ctf/site']);
  });

  it('warns when the progress cannot be stored', async () => {
    const { ctx, out } = submitting({ kind: 'opened', door: 'site', persisted: false });
    await run('submit drnhfr{x}', ctx);
    expect(out[2]).toMatch(/storage is blocked/);
  });

  it('rejects a wrong flag as an error', async () => {
    const { ctx, err } = submitting({ kind: 'wrong' });
    await run('submit drnhfr{nope}', ctx);
    expect(err).toEqual(['submit: no door opens with that']);
  });

  it('says which door a used flag opened', async () => {
    const { ctx, out } = submitting({ kind: 'already', door: 'site' });
    await run('submit drnhfr{x}', ctx);
    expect(out).toEqual(['submit: that flag already opened "Diese Seite"']);
  });

  it('explains a missing WebCrypto', async () => {
    const { ctx, err } = submitting({ kind: 'unsupported' });
    await run('submit drnhfr{x}', ctx);
    expect(err[0]).toMatch(/WebCrypto/);
  });

  it('asks for a flag', async () => {
    const { ctx, err } = submitting({ kind: 'wrong' });
    await run('submit', ctx);
    expect(err[0]).toMatch(/usage/);
  });
});

describe('hint', () => {
  it('prints the hint in the page language', async () => {
    const { ctx, out } = stubContext({
      ctf: () => fakeCtf({}, { hint: () => ({ kind: 'hint', door: 'site', text: { de: 'schau', en: 'look' } }) }),
    });
    await run('hint', ctx);
    expect(out).toEqual(['hint: schau']);
  });

  it('says when nothing is left', async () => {
    const { ctx, out } = stubContext({ ctf: () => fakeCtf({}) });
    await run('hint', ctx);
    expect(out[0]).toMatch(/nothing left/);
  });
});

describe('cd to a door', () => {
  it('reaches a door whose name a project also uses', () => {
    const visited: string[] = [];
    const { ctx } = stubContext({
      path: '/de/',
      find: (name) =>
        findIn(
          [
            { href: '/de/projekte/dartomat/', type: 'project' },
            { href: '/de/ctf/dartomat/', type: 'page', aliases: ['ctf/dartomat'] },
          ],
          name,
        ),
      navigate: (href) => void visited.push(href),
    });
    void findCommand('cd')!.run('ctf/dartomat', ctx);
    expect(visited).toEqual(['/de/ctf/dartomat/']);
  });
});

describe('dotfiles', () => {
  const entries: SearchEntry[] = [{ href: '/de/projekte/', type: 'page' }];

  it('are listed by ls -a once the site door is open', async () => {
    const { ctx, out } = stubContext({ entries: () => entries, ctf: () => fakeCtf({ site: siteDoor }) });
    await run('ls -a', ctx);
    expect(out[0]).toContain('.env');
  });

  it('are not listed by plain ls', async () => {
    const { ctx, out } = stubContext({ entries: () => entries, ctf: () => fakeCtf({ site: siteDoor }) });
    await run('ls', ctx);
    expect(out[0]).not.toContain('.env');
  });

  it('can be read with cat', async () => {
    const { ctx, out } = stubContext({ ctf: () => fakeCtf({ site: siteDoor }) });
    await run('cat .env', ctx);
    expect(out).toEqual(['HOMELAB_DOOR=drnhfr{test}']);
  });

  it('do not exist before the site door is open', async () => {
    const { ctx, out, err } = stubContext({ entries: () => entries });
    await run('ls -a', ctx);
    await run('cat .env', ctx);
    expect(out[0]).not.toContain('.env');
    expect(err).toEqual(['cat: no such file: .env']);
  });
});

describe('curl on the homelab network', () => {
  const opened = () => fakeCtf({ homelab: homelabDoor });

  it('answers the odd host with headers and body', async () => {
    const tabs: string[] = [];
    const { ctx, out } = stubContext({ ctf: opened, openTab: (href) => (tabs.push(href), true) });
    await run('curl http://10.0.30.7:80/', ctx);
    expect(out[0].split('\n')).toEqual(['HTTP/1.1 200 OK', 'X-Flag: drnhfr{laser}', '', '<h1>hi</h1>']);
    expect(tabs).toEqual([]);
  });

  it('accepts curl flags before the address', async () => {
    const { ctx, out } = stubContext({ ctf: opened });
    await run('curl -i 10.0.30.7', ctx);
    expect(out[0]).toContain('X-Flag');
  });

  it('prints a host error as curl would', async () => {
    const { ctx, err } = stubContext({ ctf: opened });
    await run('curl 10.0.30.5', ctx);
    expect(err).toEqual(['curl: (1) Received HTTP/0.9 when not allowed']);
  });

  it('refuses unknown private hosts', async () => {
    const { ctx, err } = stubContext({ ctf: opened });
    await run('curl 192.168.1.1', ctx);
    expect(err[0]).toMatch(/^curl: \(7\) Failed to connect/);
  });

  it('refuses every private host while the homelab door is locked, and opens no tab', async () => {
    const tabs: string[] = [];
    const { ctx, err } = stubContext({ openTab: (href) => (tabs.push(href), true) });
    await run('curl 10.0.30.7', ctx);
    expect(err[0]).toMatch(/^curl: \(7\) Failed to connect/);
    expect(tabs).toEqual([]);
  });

  it('still opens public urls in a tab', async () => {
    const tabs: string[] = [];
    const { ctx } = stubContext({ ctf: opened, openTab: (href) => (tabs.push(href), true) });
    await run('curl example.com', ctx);
    expect(tabs).toEqual(['https://example.com/']);
  });
});

describe('restart', () => {
  it('answers to reboot too', () => {
    expect(findCommand('reboot')?.name).toBe('restart');
  });
});

describe('clock', () => {
  it.each([
    [0, '0:00:00'],
    [59_999, '0:00:59'],
    [61_000, '0:01:01'],
    [3_723_000, '1:02:03'],
    [36_000_000, '10:00:00'],
  ])('%i ms -> %s', (ms, expected) => {
    expect(clock(ms)).toBe(expected);
  });
});

describe('game commands before and after ctf', () => {
  const before = () => stubContext({ ctf: () => fakeCtf({}) });
  const after = () => stubContext({ ctf: () => fakeCtf({}, { started: () => true }) });

  it('are not found before the start', () => {
    const { ctx } = before();
    expect(findCommand('submit', ctx)).toBeUndefined();
    expect(findCommand('hint', ctx)).toBeUndefined();
    expect(findCommand('ctf', ctx)?.name).toBe('ctf');
  });

  it('are neither listed nor completed before the start', () => {
    const { ctx } = before();
    const help = renderHelp(commands, ctx);
    expect(help).not.toMatch(/^submit/m);
    expect(help).not.toMatch(/^hint/m);
    expect(help).toMatch(/^ctf/m);
    expect(completionNames(ctx)).not.toContain('submit');
  });

  it('exist, are listed and complete after the start', () => {
    const { ctx } = after();
    expect(findCommand('submit', ctx)?.name).toBe('submit');
    expect(renderHelp(commands, ctx)).toMatch(/^submit/m);
    expect(completionNames(ctx)).toEqual(expect.arrayContaining(['submit', 'hint']));
  });
});

describe('ctf', () => {
  it('starts the game and opens the main page', async () => {
    const started: number[] = [];
    const visited: string[] = [];
    const { ctx, out } = stubContext({
      ctf: () => fakeCtf({}, { start: (at) => void started.push(at) }),
      navigate: (href) => void visited.push(href),
    });
    await run('ctf', ctx);
    expect(started).toHaveLength(1);
    expect(out[0]).toMatch(/ctf started/);
    expect(visited).toEqual(['/de/ctf/']);
  });

  it('reports the running time without restarting the clock', async () => {
    const started: number[] = [];
    const { ctx, out } = stubContext({
      ctf: () =>
        fakeCtf({}, { started: () => true, start: (at) => void started.push(at), elapsed: () => 125_000 }),
    });
    await run('ctf', ctx);
    expect(started).toEqual([]);
    expect(out).toEqual(['ctf running for 0:02:05']);
  });

  it('reports the final time once every door is open', async () => {
    const { ctx, out } = stubContext({
      ctf: () => fakeCtf({}, { started: () => true, finishedIn: () => 3_723_000 }),
    });
    await run('ctf', ctx);
    expect(out).toEqual(['every door is open. your time: 1:02:03']);
  });

  it('stays put when already on the main page', async () => {
    const visited: string[] = [];
    const { ctx } = stubContext({
      path: '/en/ctf/',
      config: { ...stubContext().ctx.config, lang: 'en' },
      ctf: () => fakeCtf({}, { started: () => true, elapsed: () => 0 }),
      navigate: (href) => void visited.push(href),
    });
    await run('ctf', ctx);
    expect(visited).toEqual([]);
  });
});

describe('submit on the last door', () => {
  it('prints the total time', async () => {
    const { ctx, out } = stubContext({
      ctf: () =>
        fakeCtf(
          { smarthome: door({ title: both('Smarthome') }) },
          { submit: async () => ({ kind: 'opened', door: 'smarthome', persisted: true }), finishedIn: () => 754_000 },
        ),
    });
    await run('submit x', ctx);
    expect(out).toContain('every door is open. your time: 0:12:34');
  });
});
