import { describe, expect, it } from 'vitest';
import { countLines, repoStats } from '../src/lib/build-info';
import { daysBetween } from '../src/lib/days';

describe('daysBetween', () => {
  it('counts whole days and never goes negative', () => {
    expect(daysBetween('2026-09-21T10:00:00+02:00', '2026-10-02T09:59:59+02:00')).toBe(10);
    expect(daysBetween('2026-09-21T10:00:00+02:00', '2026-10-02T10:00:00+02:00')).toBe(11);
    expect(daysBetween('2026-10-02T10:00:00Z', '2026-09-21T10:00:00Z')).toBe(0);
  });
});

describe('countLines', () => {
  it('skips blank lines', () => {
    expect(countLines('a\n\n  \nb\r\n')).toBe(2);
  });
});

describe('repoStats', () => {
  it('reads the full history of this repository', () => {
    expect(repoStats).not.toBeNull();
    expect(repoStats!.commits).toBeGreaterThan(1);
    expect(repoStats!.linesOfCode).toBeGreaterThan(0);
    expect(Date.parse(repoStats!.firstCommitIso)).toBeLessThan(Date.parse(repoStats!.lastCommitIso));
  });
});
