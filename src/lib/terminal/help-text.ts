import { copy } from './copy';
import type { Command, CommandContext } from './types';

export function isListed(command: Command, ctx: CommandContext): boolean {
  if (command.hidden) return false;
  return command.listed?.(ctx) ?? true;
}

export function renderHelp(commands: Command[], ctx: CommandContext): string {
  const visible = commands.filter((command) => isListed(command, ctx));
  const width = Math.max(20, ...visible.map((command) => command.usage.length + 2));
  const rows = visible.map((command) => command.usage.padEnd(width) + command.summary);
  return [copy.helpHeading, ...rows].join('\n');
}
