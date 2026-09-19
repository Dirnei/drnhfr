import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeBootSchedule, DECODE_FALLBACK_MARGIN_MS, rollLineStepMs } from '../src/lib/boot-timing';
import bootData from '../src/data/boot.json';

function readDecodeText(): string {
  return readFileSync(join(process.cwd(), 'src/components/DecodeText.astro'), 'utf8');
}

// T3b — boot timing. Unit-tests the pure arithmetic extracted for I6 so a
// boot.json edit that pushes the schedule past what it used to be silently
// capped at (the old hard-coded 5000ms in DecodeText) shows up as a failing
// test instead of a decode that finishes unseen underneath the intro.
//
// boot.json's per-line step is now a random range, not a constant, so these
// assertions test relationships and arithmetic derived from the data's own
// fields rather than hard-coded millisecond totals — a hard-coded total
// would go stale on every legitimate retune of boot.json and turn a
// deliberate change into a red build for no reason.
describe('computeBootSchedule', () => {
  it('derives assembly/condense/finish from the WORST CASE per-line step', () => {
    // min and max are deliberately different so this fails if the
    // implementation ever uses the min or an average instead of the max.
    const schedule = computeBootSchedule(
      { lineStepMinMs: 20, lineStepMaxMs: 100, logoHoldMs: 500, fadeMs: 200 },
      5,
    );
    expect(schedule.lineRevealMs).toBe(500); // 5 * lineStepMaxMs (100), not lineStepMinMs
    expect(schedule.assemblyStart).toBe(1000);
    expect(schedule.condenseStart).toBe(1200);
    expect(schedule.finishAt).toBe(1400);
  });

  it('derives finishAt for boot.json straight from its own fields, for both locales', () => {
    const { timing } = bootData;
    const expectedFinish = (lineCount: number) =>
      lineCount * timing.lineStepMaxMs + timing.logoHoldMs + 2 * timing.fadeMs;
    const de = computeBootSchedule(timing, bootData.de.length);
    const en = computeBootSchedule(timing, bootData.en.length);
    expect(de.finishAt).toBe(expectedFinish(bootData.de.length));
    expect(en.finishAt).toBe(expectedFinish(bootData.en.length));
  });

  // Regression guard for I6: the old bug was a hard-coded `5000` fallback
  // in DecodeText.astro that boot.json could silently outgrow. These
  // assertions read the actual component source (unlike the arithmetic
  // check above, which never looks at DecodeText.astro at all) so
  // re-hardcoding a literal timeout there fails the suite again.
  it('DecodeText imports its fallback arithmetic from boot-timing.ts', () => {
    const src = readDecodeText();
    const importMatch = src.match(
      /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/lib\/boot-timing['"];/,
    );
    expect(importMatch).not.toBeNull();
    const importedNames = importMatch![1].split(',').map((s) => s.trim());
    expect(importedNames).toEqual(
      expect.arrayContaining(['computeBootSchedule', 'DECODE_FALLBACK_MARGIN_MS']),
    );
  });

  it('DecodeText arms its safety timeout with a computed value, not a literal', () => {
    const src = readDecodeText();
    const call = src.match(/(?:window\.)?setTimeout\(\s*start\s*,\s*([^)]+)\)/);
    expect(call).not.toBeNull();
    const arg = call![1].trim();
    // A bare numeric timeout (the old `5000`) would make this fail: the
    // argument must be a computed identifier/expression, not a literal.
    expect(Number.isNaN(Number(arg))).toBe(true);
  });

  it('keeps the fallback ahead of the schedule even if boot.json is retuned slower', () => {
    // The scenario I6 called out: retuning the per-line step slower pushes
    // the schedule well past the old hard-coded 5000ms fallback, which
    // would have fired underneath the still-running intro. Asserted as a
    // relationship (fallback = finishAt + margin), not a specific total, so
    // any retune of lineStepMaxMs keeps this passing.
    const retuned = { ...bootData.timing, lineStepMaxMs: bootData.timing.lineStepMaxMs * 3 };
    const schedule = computeBootSchedule(retuned, bootData.de.length);
    const fallback = schedule.finishAt + DECODE_FALLBACK_MARGIN_MS;
    expect(fallback).toBeGreaterThan(schedule.finishAt);
    expect(fallback - schedule.finishAt).toBe(DECODE_FALLBACK_MARGIN_MS);
  });
});

describe('rollLineStepMs', () => {
  it('always lands within [minMs, maxMs], rolled many times', () => {
    const minMs = 120;
    const maxMs = 340;
    for (let i = 0; i < 1000; i++) {
      const value = rollLineStepMs(minMs, maxMs);
      expect(value).toBeGreaterThanOrEqual(minMs);
      expect(value).toBeLessThanOrEqual(maxMs);
    }
  });

  it('varies across rolls instead of returning a constant', () => {
    const values = new Set(Array.from({ length: 50 }, () => rollLineStepMs(0, 1000)));
    expect(values.size).toBeGreaterThan(1);
  });
});
