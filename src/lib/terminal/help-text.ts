import { copy } from './copy';
import type { Command, CommandContext } from './types';

/** Shown in help and offered by Tab: not hidden, and listed for this state. */
export function isListed(command: Command, ctx: CommandContext): boolean {
  if (command.hidden) return false;
  return command.listed?.(ctx) ?? true;
}

/*
 * Rendered from the registry rather than written out by hand. The old help
 * text was a literal array that had to be edited in lockstep with the command
 * switch and the tab-completion list, and nothing checked that the three
 * agreed.
 *
 * Kept out of registry.ts so the help command can import it without importing
 * the registry that imports the help command.
 */
export function renderHelp(commands: Command[], ctx: CommandContext): string {
  const visible = commands.filter((command) => isListed(command, ctx));
  // Widen if a command needs more room, so a long usage string cannot shove
  // its summary out of the column the others share.
  const width = Math.max(20, ...visible.map((command) => command.usage.length + 2));
  const rows = visible.map((command) => command.usage.padEnd(width) + command.summary);
  return [copy.helpHeading, ...rows].join('\n');
}
