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

export function codeFor(date: Date): string {
  const rev = (value: number) => String(value).padStart(2, '0').split('').reverse().join('');
  return (
    rev(date.getMonth() + 1) +
    rev(date.getDate()) +
    rev(date.getFullYear() % 100) +
    rev(date.getHours())
  );
}

/** True for the current hour's code and the one a minute ago. */
export function codeMatches(candidate: string, now = new Date()): boolean {
  const previousMinute = new Date(now.getTime() - 60000);
  return candidate === codeFor(now) || candidate === codeFor(previousMinute);
}
