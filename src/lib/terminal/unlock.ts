export const UNLOCK_KEY = 'cv-unlocked';
export const INTRO_KEY = 'intro-played';

export function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    // Storage blocked: treat as locked, which is the safe default.
    return false;
  }
}

export function setUnlocked(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(UNLOCK_KEY, '1');
    else sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    // Not fatal either way: worst case the cv re-locks on the next visit.
  }
}

export function clearSessionFlags(): void {
  try {
    sessionStorage.removeItem(INTRO_KEY);
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* private mode or blocked storage: nothing to clear, reload anyway */
  }
}

/**
 * The unlock code, computed client-side from wall-clock time. The formula
 * lives in plain sight on purpose — this is a toy, not access control.
 *
 * Write the clock as YYMMDDHH and mirror the whole thing:
 *   2026-09-21 10:xx  ->  26092110  ->  "01129062"
 *
 * One operation, rather than three-with-an-exception: the rule before this
 * mirrored the month, the day and the year but left the hour alone, which is
 * four things to notice and a reason for none of them.
 *
 * The hour is the finest unit, so one code holds for the whole hour, and `su`
 * also accepts the code from a minute ago, which covers typing it out across
 * an hour boundary.
 */
export function codeFor(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp =
    pad(date.getFullYear() % 100) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours());
  return stamp.split('').reverse().join('');
}

/** True for the current hour's code and the one a minute ago. */
export function codeMatches(candidate: string, now = new Date()): boolean {
  const previousMinute = new Date(now.getTime() - 60000);
  return candidate === codeFor(now) || candidate === codeFor(previousMinute);
}
