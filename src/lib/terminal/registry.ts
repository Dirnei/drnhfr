import { isListed } from './help-text';
import type { Command, CommandContext } from './types';

const modules = import.meta.glob<{ default: Command }>('./commands/*.ts', { eager: true });

export const commands: Command[] = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => a.order - b.order);

export function findCommand(name: string): Command | undefined {
  const needle = name.toLowerCase();
  return commands.find(
    (command) => command.name === needle || command.aliases?.includes(needle),
  );
}

export function completionNames(ctx: CommandContext): string[] {
  return commands.filter((command) => isListed(command, ctx)).map((command) => command.name);
}
