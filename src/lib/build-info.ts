import { execSync } from 'node:child_process';

/**
 * When the site last changed, as an ISO timestamp — resolved once, at build
 * time, on the server. Never imported by client code: this reaches for
 * child_process, and the value travels to the browser through the terminal's
 * config blob like everything else the server knows.
 *
 * null when git cannot answer — a tarball, a shallow export, a machine with
 * no git. Callers say so rather than inventing a date, because a wrong
 * "last changed" is worse than an absent one.
 */
export const lastCommitIso: string | null = (() => {
  try {
    const iso = execSync('git log -1 --format=%cI', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return iso.length > 0 ? iso : null;
  } catch {
    return null;
  }
})();
