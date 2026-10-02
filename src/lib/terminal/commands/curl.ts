import { findHost, formatResponse, privateHost } from '../../ctf/terminal';
import type { Command } from '../types';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export type Resolved = { ok: true; href: string } | { ok: false; reason: string };

export function resolveTarget(input: string, base: string): Resolved {
  const raw = input.trim();
  if (!raw) return { ok: false, reason: 'curl: try a url' };

  let url: URL;
  try {
    // A bare "example.com" is a host, not a path, but "/de/projekte/" is a path.
    const looksAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(raw);
    const looksLikeHost = !looksAbsolute && !raw.startsWith('/') && raw.includes('.');
    url = new URL(looksLikeHost ? `https://${raw}` : raw, base);
  } catch {
    return { ok: false, reason: `curl: (3) URL rejected: ${raw}` };
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: `curl: (1) unsupported protocol: ${url.protocol}` };
  }
  return { ok: true, href: url.href };
}

export default {
  name: 'curl',
  aliases: ['wget'],
  usage: 'curl <url>',
  summary: 'open a url in a new tab',
  order: 5,
  run(arg, ctx) {
    const input = arg.trim().split(/\s+/).find((token) => !token.startsWith('-')) ?? '';
    const host = privateHost(input);
    if (host) {
      const answer = findHost(ctx.ctf(), host);
      if (!answer) ctx.printError(`curl: (7) Failed to connect to ${host} port 80: Connection refused`);
      else if (answer.error) ctx.printError(answer.error);
      else ctx.print(formatResponse(answer));
      return;
    }
    const target = resolveTarget(input, ctx.origin);
    if (!target.ok) {
      ctx.printError(target.reason);
      return;
    }
    if (!ctx.openTab(target.href)) {
      ctx.printError('curl: the browser blocked the new tab');
      return;
    }
    ctx.print(`--> ${target.href}  (new tab)`);
  },
} satisfies Command;
