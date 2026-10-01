import type { BootLine, BootTiming } from '../../data/boot';
import { INTRO_KEY } from './unlock';

export interface BootConfig extends BootTiming {
  lines: BootLine[];
}

export function tagWidth(lines: readonly BootLine[]): number {
  const tags = lines.flatMap((line) => (line.tag ? [line.tag] : []));
  return tags.length > 0 ? Math.max(...tags.map((tag) => tag.length)) + 2 : 0;
}

export function padTag(tag: string, width: number): string {
  const gap = Math.max(0, width - tag.length);
  return `[${' '.repeat(Math.ceil(gap / 2))}${tag}${' '.repeat(Math.floor(gap / 2))}]`;
}

export function rollLineStepMs(minMs: number, maxMs: number): number {
  return Math.round(minMs + Math.random() * (maxMs - minMs));
}

export function markBootPlayed(): void {
  try {
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    // Not fatal: worst case the boot log replays on the next load.
  }
}

interface Row {
  el: HTMLElement;
  hold: boolean;
  park(): void;
  settle(): void;
}

function renderLine(line: BootLine, width: number): Row {
  const el = document.createElement('p');
  el.className = 'line boot';
  el.setAttribute('aria-hidden', 'true');
  if (!line.tag) {
    el.textContent = line.text;
    return { el, hold: false, park: () => {}, settle: () => {} };
  }
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.dataset.tag = line.tag;
  tag.textContent = padTag(line.tag, width);
  el.append(tag, ` ${line.text}`);
  if (!line.holdUntilVisible) return { el, hold: false, park: () => {}, settle: () => {} };

  const cue = document.createElement('span');
  cue.className = 'wait-cue';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('i');
    dot.textContent = '.';
    cue.append(dot);
  }
  return {
    el,
    hold: true,
    park: () => el.append(cue),
    settle() {
      cue.remove();
      tag.dataset.tag = 'OK';
      tag.textContent = padTag('OK', width);
    },
  };
}

/** Prints the boot lines, then clears them and resolves; any key or a click on `skipTarget` cuts it short. */
export function playBoot(
  log: HTMLElement,
  before: Element | null,
  boot: BootConfig,
  skipTarget: HTMLElement,
  instant: boolean,
): Promise<void> {
  const width = tagWidth(boot.lines);
  const rows = boot.lines.map((line) => renderLine(line, width));

  return new Promise((resolve) => {
    let index = 0;
    let timer = 0;
    let skipped = instant;
    let parked: Row | null = null;

    const append = (row: Row) => {
      if (before) before.before(row.el);
      else log.append(row.el);
      log.scrollTop = log.scrollHeight;
    };

    const unpark = () => {
      if (!parked) return;
      parked.settle();
      parked = null;
      document.removeEventListener('visibilitychange', onVisible);
    };

    const onVisible = () => {
      if (document.hidden) return;
      unpark();
      next();
    };

    const skip = () => {
      if (skipped) return;
      skipped = true;
      window.clearTimeout(timer);
      unpark();
      next();
    };

    const next = () => {
      while (index < rows.length) {
        const row = rows[index++];
        append(row);
        if (row.hold && document.hidden && !skipped) {
          parked = row;
          row.park();
          document.addEventListener('visibilitychange', onVisible);
          return;
        }
        if (!skipped) {
          const last = index === rows.length;
          const delay = last ? boot.lineStepMaxMs : rollLineStepMs(boot.lineStepMinMs, boot.lineStepMaxMs);
          timer = window.setTimeout(next, delay);
          return;
        }
      }
      document.removeEventListener('keydown', skip);
      skipTarget.removeEventListener('click', skip);
      rows.forEach((row) => row.el.remove());
      markBootPlayed();
      resolve();
    };

    document.addEventListener('keydown', skip);
    skipTarget.addEventListener('click', skip);
    next();
  });
}
