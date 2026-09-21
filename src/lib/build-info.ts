import { execSync } from 'node:child_process';

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
