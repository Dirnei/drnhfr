import { describe, expect, it } from 'vitest';
import { commands, completionNames, findCommand } from '../src/lib/terminal/registry';
import { renderHelp } from '../src/lib/terminal/help-text';
import { findIn, formatListing, nameFromHref } from '../src/lib/terminal/fs';
import { codeFor, codeMatches } from '../src/lib/terminal/unlock';
import type { SearchEntry } from '../src/lib/terminal/types';

/*
 * None of this could be tested before: the whole terminal lived inside a
 * `<script define:vars>`, which is inline and therefore unimportable. These
 * are the parts that are pure logic and would fail silently in a browser.
 */

describe('the unlock code', () => {
  // The rule, in one line: write the clock as YYMMDDHH and mirror it.
  it.each([
    ['2026-09-21 10:05', new Date(2026, 8, 21, 10, 5), '01129062'],
    ['2026-12-05 14:37', new Date(2026, 11, 5, 14, 37), '41502162'],
    ['2027-01-01 00:00', new Date(2027, 0, 1, 0, 0), '00101072'],
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
    { href: '/de/blog/', type: 'page' },
    { href: '/de/projekte/akka-cluster/', type: 'project' },
    { href: '/de/blog/split-brain/', type: 'post' },
    { href: '/de/kontakt/', type: 'page' },
  ];

  it('takes the last segment as the name', () => {
    expect(nameFromHref('/de/projekte/akka-cluster/')).toBe('akka-cluster');
    expect(nameFromHref('/de/')).toBe('de');
  });

  it('resolves a bare name, ignoring case and slashes', () => {
    expect(findIn(entries, 'BLOG')?.href).toBe('/de/blog/');
    expect(findIn(entries, '/blog/')?.href).toBe('/de/blog/');
    expect(findIn(entries, 'nope')).toBeUndefined();
    expect(findIn(entries, '  ')).toBeUndefined();
  });

  it('lists pages first, then projects, then articles', () => {
    const rows = formatListing(entries).split('\n');
    expect(rows.map((row) => row.trim().split(/\s{2,}/)[0])).toEqual([
      'blog/',
      'kontakt/',
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
    expect(completionNames()).toContain('whoami');
    expect(completionNames()).not.toContain('?');
  });

  /*
   * The point of the refactor: help used to be a hand-written array kept in
   * step with a switch and a completion list by hand. If it ever drifts
   * again, it will be because someone reintroduced a second source.
   */
  it('renders help from the registry, one row per visible command', () => {
    const rendered = renderHelp(commands).split('\n');
    expect(rendered[0]).toBe('available commands:');
    expect(rendered).toHaveLength(commands.filter((c) => !c.hidden).length + 1);
    for (const command of commands) {
      if (command.hidden) continue;
      expect(rendered.some((row) => row.startsWith(command.usage))).toBe(true);
    }
  });

  it('aligns every summary in the same column', () => {
    const rows = renderHelp(commands).split('\n').slice(1);
    const starts = commands
      .filter((command) => !command.hidden)
      .map((command) => rows.find((row) => row.startsWith(command.usage))!.indexOf(command.summary));
    expect(new Set(starts).size).toBe(1);
  });
});
