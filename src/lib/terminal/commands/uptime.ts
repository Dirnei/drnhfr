import { humanise, humaniseCoarse } from '../duration';
import type { Command } from '../types';

export default {
  name: 'uptime',
  usage: 'uptime',
  summary: 'how long this tab, and this site, have been up',
  order: 12,
  run(_arg, ctx) {
    ctx.print(`up ${humanise(ctx.uptimeMs())}, 1 user`);

    const { lastCommit } = ctx.config;
    if (!lastCommit) return;
    const age = Date.now() - new Date(lastCommit).getTime();
    if (Number.isNaN(age) || age < 0) return;
    ctx.print(`last commit ${humaniseCoarse(age)} ago`);
  },
} satisfies Command;
