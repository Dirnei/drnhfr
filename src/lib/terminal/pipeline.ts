import type { Command, CommandContext } from './types';

export interface Stage {
  name: string;
  arg: string;
}

export interface ResolvedStage extends Stage {
  command: Command;
}

export function parseStage(raw: string): Stage {
  const trimmed = raw.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) return { name: trimmed, arg: '' };
  return { name: trimmed.slice(0, spaceIndex), arg: trimmed.slice(spaceIndex + 1) };
}

/** Null when a stage is empty, as in `fortune |` or `| cowsay`. */
export function splitPipeline(raw: string): Stage[] | null {
  const stages = raw.split('|').map(parseStage);
  return stages.some((stage) => !stage.name) ? null : stages;
}

/** Every stage but the last prints into a buffer, which the next stage reads as `ctx.stdin`. */
export async function runPipeline(stages: ResolvedStage[], ctx: CommandContext): Promise<void> {
  let stdin = ctx.stdin;
  for (const [index, stage] of stages.entries()) {
    if (index === stages.length - 1) {
      await stage.command.run(stage.arg, { ...ctx, stdin });
      return;
    }
    const captured: string[] = [];
    const capture = (text: string) => void captured.push(text);
    await stage.command.run(stage.arg, { ...ctx, stdin, print: capture, printArt: capture });
    stdin = captured.join('\n');
  }
}

/** The piped-in text split into lines, or null when nothing was piped in. */
export function stdinLines(ctx: CommandContext): string[] | null {
  if (ctx.stdin === null) return null;
  return ctx.stdin === '' ? [] : ctx.stdin.split('\n');
}

/** Accepts `-n 3`, `-n3` and `-3`, like head and tail do. */
export function parseLineCount(arg: string, fallback = 10): number | null {
  const trimmed = arg.trim();
  if (!trimmed) return fallback;
  const match = trimmed.match(/^(?:-n\s*|-)(\d+)$/);
  return match ? Number(match[1]) : null;
}
