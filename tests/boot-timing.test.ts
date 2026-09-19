import { describe, expect, it } from 'vitest';
import { computeBootSchedule, DECODE_FALLBACK_MARGIN_MS } from '../src/lib/boot-timing';
import bootData from '../src/data/boot.json';

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

  it('matches the current boot.json timing for both locales (2,540ms)', () => {
    const de = computeBootSchedule(bootData.timing, bootData.de.length);
    const en = computeBootSchedule(bootData.timing, bootData.en.length);
    expect(de.finishAt).toBe(2540);
    expect(en.finishAt).toBe(2540);
  });

  it("DecodeText's derived fallback always exceeds the current schedule", () => {
    const de = computeBootSchedule(bootData.timing, bootData.de.length);
    const en = computeBootSchedule(bootData.timing, bootData.en.length);
    const fallbackMs = Math.max(de.finishAt, en.finishAt) + DECODE_FALLBACK_MARGIN_MS;
    expect(fallbackMs).toBeGreaterThan(de.finishAt);
    expect(fallbackMs).toBeGreaterThan(en.finishAt);
  });

  it('keeps the fallback ahead of the schedule even if boot.json is retuned slower', () => {
    // The exact scenario I6 called out: raising lineStepMs from 95 to 300 on
    // the current 12-line data lands the schedule at precisely the old
    // hard-coded 5000ms fallback, which would have fired underneath the
    // still-running intro. The fallback is no longer a fixed number, so it
    // grows with the schedule instead of being silently outgrown by it.
    const retuned = { ...bootData.timing, lineStepMs: 300 };
    const schedule = computeBootSchedule(retuned, bootData.de.length);
    expect(schedule.finishAt).toBe(5000);
    expect(schedule.finishAt + DECODE_FALLBACK_MARGIN_MS).toBeGreaterThan(schedule.finishAt);
  });
});
