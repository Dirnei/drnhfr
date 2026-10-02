import { copy } from '../copy';
import type { Command, CommandContext } from '../types';

const HOME = new Set(['', '/', '~', '~/']);

function parentOf(path: string, home: string): string {
  if (path === home) return home;
  const parent = path.replace(/[^/]+\/$/, '');
  return parent.length < home.length ? home : parent;
}

function target(arg: string, ctx: CommandContext): string | null {
  if (HOME.has(arg)) return ctx.config.homeHref;
  if (arg === '.') return ctx.path;
  if (arg === '..') return parentOf(ctx.path, ctx.config.homeHref);
  return ctx.find(arg)?.href ?? null;
}

export default {
  name: 'cd',
  usage: 'cd <target>',
  summary: 'move to <target>, ".." goes up, "~" and "/" go home',
  order: 2,
  completesEntries: true,
  run(arg, ctx) {
    const trimmed = arg.trim();
    const href = target(trimmed, ctx);
    if (href === null) {
      ctx.printError(copy.cdNotFoundPrefix + trimmed);
      return;
    }
    if (href !== ctx.path) ctx.navigate(href);
  },
} satisfies Command;
