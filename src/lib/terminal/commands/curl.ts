import type { Command } from '../types';

/*
 * Only these. A terminal that will open whatever you type is a terminal that
 * will run `curl javascript:...` for anyone who can get a visitor to paste a
 * line — and `data:` URLs are a phishing surface for the same reason. Both
 * parse perfectly happily as URLs, so an allowlist is the check, not a
 * blocklist of the two that came to mind.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export type Resolved = { ok: true; href: string } | { ok: false; reason: string };

/**
 * Turns what was typed into something safe to open, or explains why not.
 * Pure, so the interesting cases are testable without a browser.
 */
export function resolveTarget(input: string, base: string): Resolved {
  const raw = input.trim();
  if (!raw) return { ok: false, reason: 'curl: try a url' };

  let url: URL;
  try {
    // A bare "example.com" is a host, not a path — but "/de/blog/" is a path.
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
  order: 4,
  run(arg, ctx) {
    const target = resolveTarget(arg, ctx.origin);
    if (!target.ok) {
      ctx.printError(target.reason);
      return;
    }
    if (!ctx.openTab(target.href)) {
      ctx.printError('curl: the browser blocked the new tab');
      return;
    }
    // Not what curl does, but it is what happened, and saying so is better
    // than pretending a page was fetched.
    ctx.print(`--> ${target.href}  (new tab)`);
  },
} satisfies Command;
