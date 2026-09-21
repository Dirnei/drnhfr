import { copy } from './copy';
import type { Command } from './types';

/*
 * Rendered from the registry rather than written out by hand. The old help
 * text was a literal array that had to be edited in lockstep with the command
 * switch and the tab-completion list, and nothing checked that the three
 * agreed.
 *
 * Kept out of registry.ts so the help command can import it without importing
 * the registry that imports the help command.
 */
export function renderHelp(commands: Command[]): string {
  const visible = commands.filter((command) => !command.hidden);
  // Widen if a command needs more room, so a long usage string cannot shove
  // its summary out of the column the others share.
  const width = Math.max(20, ...visible.map((command) => command.usage.length + 2));
  const rows = visible.map((command) => command.usage.padEnd(width) + command.summary);
  return [copy.helpHeading, ...rows].join('\n');
}
