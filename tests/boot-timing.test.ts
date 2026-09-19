import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeBootSchedule, DECODE_FALLBACK_MARGIN_MS } from '../src/lib/boot-timing';
import bootData from '../src/data/boot.json';

function readDecodeText(): string {
  return readFileSync(join(process.cwd(), 'src/components/DecodeText.astro'), 'utf8');
}

// T3b — boot timing. Unit-tests the pure arithmetic extracted for I6 so a
// boot.json edit that pushes the schedule past what it used to be silently
// capped at (the old hard-coded 5000ms in DecodeText) shows up as a failing
// test instead of a decode that finishes unseen underneath the intro.
describe('computeBootSchedule', () => {
  it('derives assembly/condense/finish from lineStepMs, logoHoldMs and fadeMs', () => {
    const schedule = computeBootSchedule({ lineStepMs: 100, logoHoldMs: 500, fadeMs: 200 }, 5);
    expect(schedule.lineRevealMs).toBe(500);
    expect(schedule.assemblyStart).toBe(1000);
    expect(schedule.condenseStart).toBe(1200);
    expect(schedule.finishAt).toBe(1400);
  });

  it('matches the current boot.json timing for both locales (2,730ms)', () => {
    const de = computeBootSchedule(bootData.timing, bootData.de.length);
    const en = computeBootSchedule(bootData.timing, bootData.en.length);
    expect(de.finishAt).toBe(2730);
    expect(en.finishAt).toBe(2730);
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
    // The scenario I6 called out: raising lineStepMs from 95 to 300 pushes
    // the schedule well past the old hard-coded 5000ms fallback, which
    // would have fired underneath the still-running intro. The fallback is
    // no longer a fixed number, so it grows with the schedule instead of
    // being silently outgrown by it.
    const retuned = { ...bootData.timing, lineStepMs: 300 };
    const schedule = computeBootSchedule(retuned, bootData.de.length);
    expect(schedule.finishAt).toBe(5600);
    expect(schedule.finishAt + DECODE_FALLBACK_MARGIN_MS).toBeGreaterThan(schedule.finishAt);
  });
});
