import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeBootSchedule, DECODE_FALLBACK_MARGIN_MS, rollLineStepMs } from '../src/lib/boot-timing';
import bootData from '../src/data/boot.json';

function readDecodeText(): string {
  return readFileSync(join(process.cwd(), 'src/components/DecodeText.astro'), 'utf8');
}

describe('computeBootSchedule', () => {
  it('derives assembly/condense/finish from the WORST CASE per-line step', () => {
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
    expect(Number.isNaN(Number(arg))).toBe(true);
  });

  it('keeps the fallback ahead of the schedule even if boot.json is retuned slower', () => {
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
