import { ctf } from '../ctf/client';
import { doorHref, pick } from '../ctf/paths';
import { playBoot } from './boot-log';
import { copy } from './copy';
import { runPipeline, splitPipeline } from './pipeline';
import { findIn, nameFromHref } from './fs';
import { renderHelp } from './help-text';
import { readState, writeState, type SavedLine } from './session';
import { commands, completionNames, findCommand } from './registry';
import { clearSessionFlags, isUnlocked, setUnlocked } from './unlock';
import type { CommandContext, SearchEntry, TerminalConfig } from './types';

export function boot(): void {
  const configEl = document.getElementById('terminal-config');
  const section = document.getElementById('terminal');
  const log = document.getElementById('terminal-log');
  const form = document.getElementById('terminal-form') as HTMLFormElement | null;
  const input = document.getElementById('terminal-input') as HTMLInputElement | null;
  const body = document.getElementById('terminal-body');
  const toggle = document.getElementById('terminal-toggle');
  const resizer = document.getElementById('terminal-resize');
  if (!configEl || !section || !log || !form || !input || !body || !toggle || !resizer) return;
  if (getComputedStyle(section).display === 'none') return;

  const config = JSON.parse(configEl.textContent ?? '{}') as TerminalConfig;

  let entries: SearchEntry[] = [];
  let entriesPromise: Promise<SearchEntry[]> | null = null;
  const loadEntries = () =>
    (entriesPromise ??= fetch(config.searchHref)
      .then((response) => response.json())
      .then((data: unknown) => {
        entries = Array.isArray(data) ? (data as SearchEntry[]) : [];
        return entries;
      })
      .catch(() => {
        entries = [];
        return entries;
      }));

  const isOpen = () => section.dataset.open !== undefined;
  const setOpen = (open: boolean) => {
    if (open) section.dataset.open = '';
    else delete section.dataset.open;
    body.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) log.scrollTop = log.scrollHeight;
  };

  const cvEntry: SearchEntry = {
    href: config.cvHref,
    type: 'page',
    aliases: config.cvAliases,
    description: copy.cvDescription,
  };
  const removed = new Set<string>();
  const doorEntries = (): SearchEntry[] =>
    ctf.opened().map(({ door, payload }) => ({
      href: doorHref(config.lang, door),
      type: 'page',
      aliases: [`ctf/${door}`],
      description: pick(payload.title, config.lang),
    }));
  const visibleEntries = (): SearchEntry[] =>
    [...entries, ...(isUnlocked() ? [cvEntry] : []), ...doorEntries()].filter(
      (entry) => !removed.has(entry.href),
    );

  const remove = (href: string) => {
    removed.add(href);
    document.querySelectorAll<HTMLAnchorElement>(`a[href="${CSS.escape(href)}"]`).forEach((link) => {
      (link.closest('li') ?? link).hidden = true;
    });
  };

  const appendLine = (text: string, className: string) => {
    const el = document.createElement('p');
    el.className = `line ${className}`;
    el.textContent = text;
    log.append(el);
    log.scrollTop = log.scrollHeight;
  };

  const echo = (raw: string) => {
    const el = document.createElement('p');
    el.className = 'line echo';
    const promptSpan = document.createElement('span');
    promptSpan.className = 'prompt-mini';
    promptSpan.setAttribute('aria-hidden', 'true');
    promptSpan.textContent = '$';
    el.append(promptSpan, raw);
    log.append(el);
    log.scrollTop = log.scrollHeight;
  };

  let lastFailed = false;
  let halted = false;

  const draw = () => {
    const el = document.createElement('p');
    el.className = 'line draw';
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return {
      update(text: string) {
        el.textContent = text;
        log.scrollTop = log.scrollHeight;
      },
      end() {
        el.remove();
      },
    };
  };

  const measureAdvance = (sample: string) => {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    probe.textContent = sample;
    log.append(probe);
    const width = probe.getBoundingClientRect().width / sample.length;
    probe.remove();
    return width;
  };

  const columns = () => {
    const width = measureAdvance('0'.repeat(100));
    if (!width) return 80;
    return Math.max(20, Math.floor(log.clientWidth / width));
  };

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clockEl = document.getElementById('terminal-clock');
  const lockEl = document.getElementById('terminal-lock');
  const statusEl = document.getElementById('terminal-status');
  const hostEl = document.getElementById('terminal-host');

  const stampClock = () => {
    if (!clockEl) return;
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const refreshStatus = (failed: boolean) => {
    if (statusEl) statusEl.hidden = !failed;
    const unlocked = isUnlocked();
    if (lockEl) lockEl.hidden = !unlocked;
    if (hostEl) hostEl.textContent = unlocked ? copy.promptUserRoot : copy.promptUser;
    const navCv = document.getElementById('nav-cv');
    if (navCv) navCv.hidden = !unlocked;
  };

  const wipe = () => {
    halted = true;
    const mark = document.querySelector('.site-header svg')?.cloneNode(true);
    const ground = document.createElement('div');
    ground.style.cssText =
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--ink)';
    if (mark instanceof SVGElement) {
      mark.setAttribute('width', '160');
      mark.setAttribute('height', '160');
      ground.append(mark);
    }
    document.body.replaceChildren(ground);
  };

  const reboot = (full: boolean) => {
    halted = true;
    if (full) clearSessionFlags();
    appendLine(full ? copy.restarting : copy.reloading, 'out');
    input.disabled = true;
    const settle = reducedMotion() ? 0 : 450;
    window.setTimeout(() => window.location.reload(), settle);
  };

  const ctx: CommandContext = {
    config,
    origin: window.location.origin,
    path: window.location.pathname.replace(/\/?$/, '/'),
    stdin: null,
    print: (text) => appendLine(text, 'out'),
    printArt: (text) => appendLine(text, 'art'),
    printError: (text) => {
      lastFailed = true;
      appendLine(text, 'err');
    },
    clearScreen: () => log.replaceChildren(),
    entries: visibleEntries,
    find: (name) => findIn(visibleEntries(), name),
    commands: () => commands,
    isUnlocked,
    setUnlocked,
    draw,
    columns,
    charWidth: measureAdvance,
    reducedMotion,
    uptimeMs: () => Math.round(performance.now()),
    history: () => history,
    interrupted: () => new Promise<void>((resolve) => interruptWaiters.push(resolve)),
    navigate: (href) => {
      window.location.href = href;
    },
    openTab: (href) => {
      if (navigator.userActivation && !navigator.userActivation.isActive) return false;
      const link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.append(link);
      link.click();
      link.remove();
      return true;
    },
    reboot,
    remove,
    wipe,
    ctf: () => ctf,
  };

  const execute = async (raw: string) => {
    const stages = splitPipeline(raw);
    if (!stages) {
      ctx.printError(copy.pipeSyntax);
      return;
    }
    const missing = stages.find((stage) => !findCommand(stage.name, ctx));
    if (missing) {
      ctx.printError(`${missing.name}: ${copy.cmdNotFoundSuffix}`);
      ctx.print(renderHelp(commands, ctx));
      return;
    }
    const resolved = stages.map((stage) => ({ ...stage, command: findCommand(stage.name, ctx)! }));
    const hadFocus = document.activeElement === input;
    input.disabled = true;
    try {
      await runPipeline(resolved, ctx);
    } finally {
      releaseInterrupt();
      if (!halted) {
        input.disabled = false;
        if (hadFocus) input.focus();
      }
    }
  };

  let focused = false;

  const MIN_LOG_HEIGHT = 128;
  let logHeight: number | null = null;
  const setHeight = (height: number | null) => {
    const max = Math.max(MIN_LOG_HEIGHT, window.innerHeight - 160);
    logHeight = height === null ? null : Math.round(Math.min(max, Math.max(MIN_LOG_HEIGHT, height)));
    if (logHeight === null) section.style.removeProperty('--log-height');
    else section.style.setProperty('--log-height', `${logHeight}px`);
  };

  const save = () => {
    if (halted || section.dataset.boot !== undefined) return;
    const lines: SavedLine[] = [];
    for (const el of Array.from(log.children)) {
      if (!(el instanceof HTMLElement) || el.matches('.motd, .draw, .boot')) continue;
      const kind = ['echo', 'err', 'art', 'hint'].find((name) => el.classList.contains(name)) ?? 'out';
      const text = (el.textContent ?? '').slice(kind === 'echo' ? 1 : 0);
      lines.push({ kind, text });
    }
    writeState({
      open: isOpen(),
      focused,
      failed: lastFailed,
      motd: log.querySelector('.motd') !== null,
      history,
      lines,
      height: logHeight,
    });
  };

  const restore = () => {
    const state = readState();
    if (!state) return false;
    if (!state.motd) log.querySelectorAll('.motd').forEach((el) => el.remove());
    for (const line of state.lines) {
      if (line.kind === 'echo') echo(line.text);
      else appendLine(line.text, line.kind);
    }
    history.push(...state.history);
    historyCursor = history.length;
    lastFailed = state.failed;
    setHeight(state.height);
    return state.focused && state.open;
  };

  const run = async (raw: string) => {
    echo(raw);
    if (!raw.trim()) {
      save();
      return;
    }
    await loadEntries();
    lastFailed = false;
    await execute(raw);
    stampClock();
    refreshStatus(lastFailed);
    save();
  };

  let interruptWaiters: Array<() => void> = [];
  const releaseInterrupt = () => {
    const waiting = interruptWaiters;
    interruptWaiters = [];
    for (const resolve of waiting) resolve();
  };
  document.addEventListener('keydown', () => {
    if (interruptWaiters.length > 0) releaseInterrupt();
  });

  const history: string[] = [];
  let historyCursor = 0;
  let draft = '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    setOpen(true);
    const raw = input.value;
    input.value = '';
    if (raw.trim()) {
      history.push(raw);
      historyCursor = history.length;
    }
    void run(raw);
  });

  input.addEventListener('focus', () => {
    focused = true;
    void loadEntries();
    if (!isOpen()) setOpen(true);
  });
  input.addEventListener('blur', () => {
    if (!input.disabled) focused = false;
  });
  window.addEventListener('pagehide', save);

  section.addEventListener(
    'wheel',
    (event) => {
      if (!isOpen() || event.ctrlKey) return;
      if (event.target instanceof Node && log.contains(event.target)) {
        const atTop = log.scrollTop <= 0;
        const atBottom = log.scrollTop + log.clientHeight >= log.scrollHeight - 1;
        if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) return;
      }
      event.preventDefault();
    },
    { passive: false },
  );

  resizer.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    resizer.setPointerCapture(event.pointerId);
    const startY = event.clientY;
    const startHeight = log.clientHeight;
    const move = (moved: PointerEvent) => setHeight(startHeight + startY - moved.clientY);
    const stop = () => {
      resizer.removeEventListener('pointermove', move);
      resizer.removeEventListener('pointerup', stop);
      resizer.removeEventListener('pointercancel', stop);
      save();
    };
    resizer.addEventListener('pointermove', move);
    resizer.addEventListener('pointerup', stop);
    resizer.addEventListener('pointercancel', stop);
  });
  resizer.addEventListener('dblclick', () => {
    setHeight(null);
    save();
  });
  resizer.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    setHeight(log.clientHeight + (event.key === 'ArrowUp' ? 32 : -32));
    save();
  });

  toggle.addEventListener('click', () => {
    setOpen(!isOpen());
    save();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      input.blur();
      setOpen(false);
      save();
    } else if (event.key === 'ArrowUp') {
      if (history.length === 0) return;
      event.preventDefault();
      if (historyCursor === history.length) draft = input.value;
      historyCursor = Math.max(0, historyCursor - 1);
      input.value = history[historyCursor];
      input.setSelectionRange(input.value.length, input.value.length);
    } else if (event.key === 'ArrowDown') {
      if (history.length === 0) return;
      event.preventDefault();
      historyCursor = Math.min(history.length, historyCursor + 1);
      input.value = historyCursor === history.length ? draft : history[historyCursor];
      input.setSelectionRange(input.value.length, input.value.length);
    } else if (event.key === 'Tab') {
      const pipeIndex = input.value.lastIndexOf('|');
      const head = pipeIndex === -1 ? '' : `${input.value.slice(0, pipeIndex + 1)} `;
      const value = input.value.slice(pipeIndex + 1).trimStart();
      const spaceIndex = value.indexOf(' ');
      if (spaceIndex === -1) {
        const typed = value.toLowerCase();
        const matches = completionNames(ctx).filter(
          (candidate) => typed.length > 0 && candidate.startsWith(typed),
        );
        if (matches.length === 1) {
          event.preventDefault();
          input.value = `${head}${matches[0]} `;
        }
        return;
      }
      const name = value.slice(0, spaceIndex).toLowerCase();
      if (!findCommand(name, ctx)?.completesEntries) return;
      const lastSpace = value.lastIndexOf(' ');
      const partial = value.slice(lastSpace + 1).toLowerCase();
      const startsWith = (names: string[]) =>
        names.filter(
          (candidate, index, all) =>
            all.indexOf(candidate) === index && candidate.toLowerCase().startsWith(partial),
        );
      const own = startsWith(visibleEntries().map((entry) => nameFromHref(entry.href)));
      const matches =
        own.length > 0 ? own : startsWith(visibleEntries().flatMap((entry) => entry.aliases ?? []));
      if (matches.length === 1) {
        event.preventDefault();
        input.value = `${head}${value.slice(0, lastSpace + 1)}${matches[0]}`;
      }
    }
  });

  section.addEventListener('click', (event) => {
    if (input.disabled) return;
    const target = event.target;
    if (target instanceof Element && target.closest('.term-titlebar')) return;
    if (!(window.getSelection()?.isCollapsed ?? true)) return;
    input.focus();
  });

  document.addEventListener('keydown', (event) => {
    const bare = !event.metaKey && !event.ctrlKey && !event.altKey;
    const isSlash = event.key === '/' && bare;
    const isK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
    if (!isSlash && !isK) return;
    if (isSlash && isOpen()) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]')) return;
    if (input.disabled) return;
    event.preventDefault();
    input.focus();
  });

  const focusAtEnd = () => {
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  };

  document.addEventListener('keydown', (event) => {
    if (input.disabled || !isOpen()) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable], .term-resize')) return;
    const modified = event.metaKey || event.ctrlKey || event.altKey;
    if (modified) {
      if (event.key.toLowerCase() === 'v') focusAtEnd();
      return;
    }
    if (event.key.length === 1) {
      focusAtEnd();
      return;
    }
    const idle = document.activeElement === document.body || section.contains(document.activeElement);
    if (event.key === 'Backspace') {
      event.preventDefault();
      focusAtEnd();
      input.value = input.value.slice(0, -1);
    } else if (idle && event.key === 'Enter') {
      event.preventDefault();
      focusAtEnd();
      form.requestSubmit();
    } else if (idle && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      focusAtEnd();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: event.key, bubbles: true, cancelable: true }));
    }
  });

  const enable = () => {
    input.disabled = false;
  };

  stampClock();

  if (section.dataset.boot === undefined) {
    const refocus = restore();
    refreshStatus(lastFailed);
    setOpen(isOpen());
    enable();
    if (refocus) input.focus({ preventScroll: true });
    return;
  }
  refreshStatus(false);
  setOpen(true);
  const motd = log.querySelector('.motd');
  void playBoot(log, motd, config.boot, section, reducedMotion()).then(() => {
    delete section.dataset.boot;
    setOpen(false);
    enable();
  });
}
