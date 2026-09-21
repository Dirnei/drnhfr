export interface BootTiming {
  lineStepMinMs: number;
  lineStepMaxMs: number;
  logoHoldMs: number;
  fadeMs: number;
}

export interface BootSchedule {
  /** When the last boot line has finished revealing. */
  lineRevealMs: number;
  /** When the boot log fades and the logo tile starts assembling. */
  assemblyStart: number;
  /** When the assembled logo starts condensing (scaling down) before exit. */
  condenseStart: number;
  /** When the whole sequence is done and finish() should fire. */
  finishAt: number;
}

export function computeBootSchedule(timing: BootTiming, lineCount: number): BootSchedule {
  const lineRevealMs = lineCount * timing.lineStepMaxMs;
  const assemblyStart = lineRevealMs + timing.logoHoldMs;
  const condenseStart = assemblyStart + timing.fadeMs;
  const finishAt = condenseStart + timing.fadeMs;
  return { lineRevealMs, assemblyStart, condenseStart, finishAt };
}

export function rollLineStepMs(minMs: number, maxMs: number): number {
  return Math.round(minMs + Math.random() * (maxMs - minMs));
}

export const DECODE_FALLBACK_MARGIN_MS = 250;
