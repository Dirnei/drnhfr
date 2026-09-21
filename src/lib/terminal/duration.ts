/**
 * "9s", "4m 12s", "1h 2m 3s", "2d 7h 33m 20s" — every unit from the largest
 * non-zero one down. What `uptime` prints.
 */
export function humanise(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

/**
 * The same, truncated to the two largest units: "2d 7h", "1h 2m", "9s".
 * For ages, where "2d 7h 33m 20s ago" is more precision than anyone wanted.
 */
export function humaniseCoarse(ms: number): string {
  return humanise(ms).split(' ').slice(0, 2).join(' ');
}
