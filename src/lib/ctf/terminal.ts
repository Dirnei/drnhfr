import type { Ctf, CtfFile, CtfHost } from './doors';

export function dotfiles(ctf: Ctf): CtfFile[] {
  return ctf.opened().flatMap(({ payload }) => payload.terminal.files);
}

export function findDotfile(ctf: Ctf, name: string): CtfFile | undefined {
  const needle = name.replace(/^(\.\/|~\/)/, '');
  return dotfiles(ctf).find((file) => file.name === needle);
}

const PRIVATE = [/^10\.\d+\.\d+\.\d+$/, /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, /^192\.168\.\d+\.\d+$/];

export function privateHost(target: string): string | null {
  const host = target
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, '')
    .toLowerCase();
  if (PRIVATE.some((pattern) => pattern.test(host)) || host.endsWith('.lan')) return host;
  return null;
}

export function findHost(ctf: Ctf, host: string): CtfHost | undefined {
  return ctf
    .opened()
    .flatMap(({ payload }) => payload.terminal.hosts)
    .find((entry) => entry.host === host);
}

const REASONS: Record<number, string> = {
  200: 'OK',
  301: 'Moved Permanently',
  302: 'Found',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
};

export function formatResponse(host: CtfHost): string {
  const lines = [`HTTP/1.1 ${host.status} ${REASONS[host.status ?? 0] ?? ''}`.trimEnd()];
  for (const [name, value] of Object.entries(host.headers ?? {})) lines.push(`${name}: ${value}`);
  lines.push('');
  if (host.body) lines.push(host.body);
  return lines.join('\n');
}
