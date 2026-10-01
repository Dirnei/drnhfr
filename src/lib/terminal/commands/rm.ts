import { isPageType, nameFromHref } from '../fs';
import type { Command, SearchEntry } from '../types';

const ROOTS = new Set(['/', '/*']);

export function parseRm(arg: string): { flags: Set<string>; targets: string[] } {
  const flags = new Set<string>();
  const targets: string[] = [];
  for (const token of arg.trim().split(/\s+/).filter(Boolean)) {
    if (token === '--no-preserve-root') continue;
    if (token.startsWith('-') && token.length > 1) {
      for (const flag of token.slice(1)) flags.add(flag.toLowerCase());
    } else {
      targets.push(token);
    }
  }
  return { flags, targets };
}

function shown(entry: SearchEntry): string {
  return nameFromHref(entry.href) + (isPageType(entry.type) ? '/' : '');
}

export default {
  name: 'rm',
  usage: 'rm [-rv] <target>',
  summary: 'remove <target>, until you reload',
  order: 4,
  completesEntries: true,
  run(arg, ctx) {
    const { flags, targets } = parseRm(arg);
    if (targets.length === 0) {
      ctx.printError('rm: missing operand');
      return;
    }
    const recursive = flags.has('r');
    const verbose = flags.has('v');

    if (targets.some((target) => ROOTS.has(target))) {
      if (!recursive) {
        ctx.printError("rm: cannot remove '/': Is a directory");
        return;
      }
      ctx.wipe();
      return;
    }

    for (const target of targets) {
      const entry = ctx.find(target);
      if (!entry) {
        ctx.printError(`rm: cannot remove '${target}': No such file or directory`);
        continue;
      }
      const inside = ctx
        .entries()
        .filter((other) => other.href !== entry.href && other.href.startsWith(entry.href));
      if (inside.length > 0 && !recursive) {
        ctx.printError(`rm: cannot remove '${shown(entry)}': Is a directory`);
        continue;
      }
      for (const gone of [...inside, entry]) {
        ctx.remove(gone.href);
        if (verbose) ctx.print(`removed '${shown(gone)}'`);
      }
    }
  },
} satisfies Command;
