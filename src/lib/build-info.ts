import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CODE_FILE = /\.(astro|ts|mjs|js|css)$/;

function git(args: string): string {
  return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 })
    .toString()
    .trim();
}

export const lastCommitIso: string | null = (() => {
  try {
    const iso = git('log -1 --format=%cI');
    return iso.length > 0 ? iso : null;
  } catch {
    return null;
  }
})();

export interface RepoStats {
  commits: number;
  linesOfCode: number;
  firstCommitIso: string;
  lastCommitIso: string;
}

export function countLines(text: string): number {
  return text.split('\n').filter((line) => line.trim().length > 0).length;
}

export const repoStats: RepoStats | null = (() => {
  try {
    // A shallow clone knows only its tip, so every count would be wrong.
    if (git('rev-parse --is-shallow-repository') === 'true') return null;
    const dates = git('log --format=%cI').split('\n');
    const linesOfCode = git('ls-files')
      .split('\n')
      .filter((path) => CODE_FILE.test(path))
      .reduce((sum, path) => sum + countLines(readFileSync(path, 'utf8')), 0);
    return {
      commits: dates.length,
      linesOfCode,
      firstCommitIso: dates[dates.length - 1],
      lastCommitIso: dates[0],
    };
  } catch {
    return null;
  }
})();
