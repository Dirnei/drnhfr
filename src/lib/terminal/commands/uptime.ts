import type { Command } from '../types';

/** "4m 12s", or "9s" while it is still young. */
function humanise(ms: number): string {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

export default {
  name: 'uptime',
  usage: 'uptime',
  summary: 'how long this tab has been open',
  order: 12,
  run(_arg, ctx) {
    // Uptime of the page, not of any machine: nothing here runs on a server.
    ctx.print(`up ${humanise(ctx.uptimeMs())}, 1 user`);
  },
} satisfies Command;
