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
import { humanise, humaniseCoarse } from '../src/lib/terminal/duration';
import { resolveTarget } from '../src/lib/terminal/commands/curl';
import type { CommandContext, SearchEntry } from '../src/lib/terminal/types';

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
    { href: '/de/kontakt/', type: 'page' },
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
      otherHomeHref: '/en/',
      searchHref: '/de/search.json',
      introFallbackMs: 0,
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
    origin: 'https://dirnhofer.net',
    reboot: () => {},
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

describe('neofetch', () => {
  it('reports the facts from cv.json, not from a copy', async () => {
    const cv = (await import('../src/data/cv.json')).default;
    const { ctx, art } = stubContext();
    await findCommand('neofetch')!.run('', ctx);
    const text = art[0];
    expect(text).toContain('Role:');
    const title: unknown = cv.profile.title;
    expect(text).toContain(typeof title === 'string' ? title : (title as { en: string }).en);
    expect(text).toContain(cv.experience[0].stack[0]);
  });

  it('reports the cv as locked or unlocked, and says who you are', async () => {
    const locked = stubContext({ isUnlocked: () => false });
    await findCommand('neofetch')!.run('', locked.ctx);
    expect(locked.art[0]).toContain('locked');
    expect(locked.art[0]).toContain('guest@drnhfr');

    const open = stubContext({ isUnlocked: () => true });
    await findCommand('neofetch')!.run('', open.ctx);
    expect(open.art[0]).toContain('unlocked');
    expect(open.art[0]).toContain('root@drnhfr');
  });

  it('counts only the commands it would admit to', async () => {
    const { ctx, art } = stubContext();
    await findCommand('neofetch')!.run('', ctx);
    const visible = commands.filter((command) => !command.hidden).length;
    expect(art[0]).toContain(`${visible} installed`);
  });
});

describe('matrix', () => {
  it('draws a still frame under reduced motion and returns', async () => {
    let painted = '';
    const { ctx } = stubContext({
      reducedMotion: () => true,
      columns: () => 40,
      draw: () => ({ update: (text: string) => void (painted = text), end: () => {} }),
    });
    await findCommand('matrix')!.run('', ctx);
    expect(painted.split('\n')).toHaveLength(6);
  });

  it('stops when interrupted', async () => {
    let ended = false;
    let release: () => void = () => {};
    const { ctx } = stubContext({
      reducedMotion: () => false,
      columns: () => 20,
      draw: () => ({ update: () => {}, end: () => void (ended = true) }),
      interrupted: () => new Promise<void>((resolve) => (release = resolve)),
    });
    const running = findCommand('matrix')!.run('', ctx);
    release();
    await running;
    expect(ended).toBe(true);
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
  const ORIGIN = 'https://dirnhofer.net';

  it('treats a bare host as a host', () => {
    expect(resolveTarget('example.com', ORIGIN)).toEqual({
      ok: true,
      href: 'https://example.com/',
    });
  });

  it('treats a leading slash as a path on this site', () => {
    expect(resolveTarget('/de/projekte/', ORIGIN)).toEqual({
      ok: true,
      href: 'https://dirnhofer.net/de/projekte/',
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
        otherHomeHref: '/en/',
        searchHref: '/de/search.json',
        introFallbackMs: 0,
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
