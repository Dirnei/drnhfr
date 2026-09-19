export interface BootTiming {
  lineStepMs: number;
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

/**
 * Pure choreography arithmetic for the boot intro. Both BootIntro (to drive
 * the actual sequence) and DecodeText (to derive a safety-timeout fallback)
 * need the same numbers, so this is the one place they are computed —
 * `boot.json`'s timing block stays the single source of truth for how long
 * the intro takes.
 */
export function computeBootSchedule(timing: BootTiming, lineCount: number): BootSchedule {
  const lineRevealMs = lineCount * timing.lineStepMs;
  const assemblyStart = lineRevealMs + timing.logoHoldMs;
  const condenseStart = assemblyStart + timing.fadeMs;
  const finishAt = condenseStart + timing.fadeMs;
  return { lineRevealMs, assemblyStart, condenseStart, finishAt };
}

/**
 * Margin added on top of the worst-case computed schedule for DecodeText's
 * safety-timeout fallback, so a decode that somehow never receives
 * `intro:finished` still starts shortly after the intro would have ended
 * rather than being hard-coded to a value that boot.json edits can silently
 * outgrow.
 */
export const DECODE_FALLBACK_MARGIN_MS = 250;
