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

/**
 * Pure choreography arithmetic for the boot intro. Both BootIntro (to drive
 * the actual sequence) and DecodeText (to derive a safety-timeout fallback)
 * need the same numbers, so this is the one place they are computed —
 * `boot.json`'s timing block stays the single source of truth for how long
 * the intro takes.
 *
 * Each line's actual reveal delay is a random value rolled at runtime (see
 * `rollLineStepMs`), so the real duration varies per run. This function
 * intentionally computes the WORST CASE — every line taking `lineStepMaxMs`
 * — not the average and not a sample roll. DecodeText arms a safety-timeout
 * fallback from this schedule to guarantee headings still decode if
 * `intro:finished` never arrives; if that fallback were based on anything
 * shorter than the worst case, a run that happened to roll long could trip
 * the fallback while the intro is still genuinely playing, decoding the
 * headings underneath the still-visible overlay. Do not "optimise" this to
 * the mean.
 */
export function computeBootSchedule(timing: BootTiming, lineCount: number): BootSchedule {
  const lineRevealMs = lineCount * timing.lineStepMaxMs;
  const assemblyStart = lineRevealMs + timing.logoHoldMs;
  const condenseStart = assemblyStart + timing.fadeMs;
  const finishAt = condenseStart + timing.fadeMs;
  return { lineRevealMs, assemblyStart, condenseStart, finishAt };
}

/**
 * Rolls one line's reveal delay, uniformly distributed within
 * [minMs, maxMs]. Each call is independent — BootIntro rolls a fresh value
 * per line, which is what gives the boot log its irregular, "a machine
 * doing work" rhythm instead of a mechanical constant step.
 *
 * Pulled out as its own pure function so the distribution is unit-testable
 * without a browser. BootIntro.astro's reveal script is intentionally a
 * non-module inline script (see the comment there on why), so it cannot
 * import this function and duplicates the same formula inline — keep both
 * in sync if this ever changes.
 */
export function rollLineStepMs(minMs: number, maxMs: number): number {
  return Math.round(minMs + Math.random() * (maxMs - minMs));
}

/**
 * Margin added on top of the worst-case computed schedule for DecodeText's
 * safety-timeout fallback, so a decode that somehow never receives
 * `intro:finished` still starts shortly after the intro would have ended
 * rather than being hard-coded to a value that boot.json edits can silently
 * outgrow.
 */
export const DECODE_FALLBACK_MARGIN_MS = 250;
