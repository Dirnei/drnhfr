import type { Command } from './types';

/*
 * Every file in ./commands/ that default-exports a Command is a command.
 * Dropping a file in there is the entire installation step — there is no list
 * to append to here, in the help text, or in tab completion, because all
 * three read from this array.
 *
 * eager so the commands are part of the bundle rather than eleven extra
 * requests, which matters on a site that makes none.
 */
const modules = import.meta.glob<{ default: Command }>('./commands/*.ts', { eager: true });

export const commands: Command[] = Object.values(modules)
  .map((module) => module.default)
  // Curated order, not alphabetical: `help` first and the destructive pair
  // last reads better than cat/cd/clear/exit/help/…
  .sort((a, b) => a.order - b.order);

export function findCommand(name: string): Command | undefined {
  const needle = name.toLowerCase();
  return commands.find(
    (command) => command.name === needle || command.aliases?.includes(needle),
  );
}

/**
 * What Tab offers. Primary names only — completing "?" to "?" helps nobody,
 * and hidden commands stay hidden.
 */
export function completionNames(): string[] {
  return commands.filter((command) => !command.hidden).map((command) => command.name);
}
