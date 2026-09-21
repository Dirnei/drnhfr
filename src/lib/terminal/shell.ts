import { copy } from './copy';
import { findIn, nameFromHref } from './fs';
import { renderHelp } from './help-text';
import { commands, completionNames, findCommand } from './registry';
import { clearSessionFlags, isUnlocked, setUnlocked } from './unlock';
import type { CommandContext, SearchEntry, TerminalConfig } from './types';

const FOCUS_KEY = 'focus-terminal';

export function boot(): void {
  const configEl = document.getElementById('terminal-config');
  const section = document.getElementById('terminal');
  const log = document.getElementById('terminal-log');
  const form = document.getElementById('terminal-form') as HTMLFormElement | null;
  const input = document.getElementById('terminal-input') as HTMLInputElement | null;
  const chipsRow = document.getElementById('terminal-chips');
  if (!configEl || !section || !log || !form || !input || !chipsRow) return;

  const config = JSON.parse(configEl.textContent ?? '{}') as TerminalConfig;
  const chipButtons = Array.from(chipsRow.querySelectorAll<HTMLButtonElement>('.chip'));

  let entries: SearchEntry[] = [];
  const entriesPromise = fetch(config.searchHref)
    .then((response) => response.json())
    .then((data: unknown) => {
      entries = Array.isArray(data)
        ? (data as SearchEntry[]).filter((entry) => entry.href !== `/${config.lang}/`)
        : [];
      return entries;
    })
    .catch(() => {
      entries = [];
      return entries;
    });

  const cvEntry: SearchEntry = {
    href: config.cvHref,
    type: 'page',
    description: copy.cvDescription,
  };
  const visibleEntries = (): SearchEntry[] => (isUnlocked() ? [...entries, cvEntry] : entries);

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
  };

  const parse = (raw: string): [string, string] => {
    const trimmed = raw.trim();
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) return [trimmed, ''];
    return [trimmed.slice(0, spaceIndex), trimmed.slice(spaceIndex + 1)];
  };

  const run = async (raw: string) => {
    echo(raw);
    if (!raw.trim()) return;
    await entriesPromise;
    const [name, rest] = parse(raw);
    lastFailed = false;
    const command = findCommand(name);
    if (command) {
      const hadFocus = document.activeElement === input;
      input.disabled = true;
      try {
        await command.run(rest, ctx);
      } finally {
        releaseInterrupt();
        if (!halted) {
          input.disabled = false;
          if (hadFocus) input.focus();
        }
      }
    } else {
      ctx.printError(`${name}: ${copy.cmdNotFoundSuffix}`);
      ctx.print(renderHelp(commands, ctx));
    }
    stampClock();
    refreshStatus(lastFailed);
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
    const raw = input.value;
    input.value = '';
    if (raw.trim()) {
      history.push(raw);
      historyCursor = history.length;
    }
    void run(raw);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
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
      const value = input.value;
      const spaceIndex = value.indexOf(' ');
      if (spaceIndex === -1) {
        const typed = value.toLowerCase();
        const matches = completionNames(ctx).filter(
          (candidate) => typed.length > 0 && candidate.startsWith(typed),
        );
        if (matches.length === 1) {
          event.preventDefault();
          input.value = `${matches[0]} `;
        }
        return;
      }
      const name = value.slice(0, spaceIndex).toLowerCase();
      if (!findCommand(name)?.completesEntries) return;
      const partial = value.slice(spaceIndex + 1).toLowerCase();
      const matches = visibleEntries()
        .map((entry) => nameFromHref(entry.href))
        .filter(
          (candidate, index, all) =>
            all.indexOf(candidate) === index && candidate.toLowerCase().startsWith(partial),
        );
      if (matches.length === 1) {
        event.preventDefault();
        input.value = `${name} ${matches[0]}`;
      }
    }
  });

  chipButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (input.disabled) return;
      input.value = button.dataset.run ?? '';
      form.requestSubmit();
    });
  });

  section.addEventListener('click', (event) => {
    if (input.disabled) return;
    const target = event.target;
    if (target instanceof Element && target.closest('.chip')) return;
    input.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (input.disabled) return;
    if (document.activeElement !== document.body) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.length !== 1) return;
    if (event.key === '/') return;
    input.focus();
  });

  const focusIfRequested = () => {
    let wanted = false;
    try {
      wanted = sessionStorage.getItem(FOCUS_KEY) === '1';
      sessionStorage.removeItem(FOCUS_KEY);
    } catch {
      // Storage blocked: nothing asked for focus, so nothing to do.
    }
    if (!wanted) return;
    input.scrollIntoView({ block: 'center' });
    input.focus();
  };

  const enable = () => {
    input.disabled = false;
    chipButtons.forEach((button) => button.removeAttribute('disabled'));
    focusIfRequested();
  };

  stampClock();
  refreshStatus(false);

  if (document.documentElement.dataset.intro === 'running') {
    let enabled = false;
    const enableOnce = () => {
      if (enabled) return;
      enabled = true;
      enable();
    };
    document.addEventListener('intro:finished', enableOnce, { once: true });
    window.setTimeout(enableOnce, config.introFallbackMs);
  } else {
    enable();
  }
}
