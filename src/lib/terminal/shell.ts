import { copy } from './copy';
import { findIn, nameFromHref } from './fs';
import { renderHelp } from './help-text';
import { commands, completionNames, findCommand } from './registry';
import { clearSessionFlags, isUnlocked, setUnlocked } from './unlock';
import type { CommandContext, SearchEntry, TerminalConfig } from './types';

/*
 * TerminalShortcut sets this when "/" or Ctrl+K is pressed on another page,
 * right before sending the visitor here. Focus has to wait until the prompt is
 * actually enabled, which is why it hangs off the intro handover below rather
 * than running at script load.
 */
const FOCUS_KEY = 'focus-terminal';

/**
 * Wires the markup Terminal.astro rendered to the commands in ./commands/.
 * Everything the server knows arrives through the #terminal-config JSON blob;
 * everything a command can do arrives through the CommandContext built here.
 */
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

  // ---------------------------------------------------------- filesystem
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

  /*
   * The cv is not in the search index — it is unlisted by design — so the
   * terminal splices it in as a virtual entry, and only once `su` has run.
   * Everything that walks the filesystem goes through visibleEntries(), so
   * ls, cd, cat and tab completion agree about what exists.
   */
  const cvEntry: SearchEntry = {
    href: config.cvHref,
    type: 'page',
    description: copy.cvDescription,
  };
  const visibleEntries = (): SearchEntry[] => (isUnlocked() ? [...entries, cvEntry] : entries);

  // -------------------------------------------------------------- output
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
    // Scrollback mirrors the prompt that ran the command, and that prompt is
    // the bare $ under the powerline.
    promptSpan.textContent = '$';
    el.append(promptSpan, raw);
    log.append(el);
    log.scrollTop = log.scrollHeight;
  };

  let lastFailed = false;
  /* A command that reboots is on its way out; do not hand the prompt back. */
  let halted = false;

  /*
   * A block the command owns and repaints, rather than a line per frame.
   * Removed again on end(), so an animation leaves the scrollback as it found
   * it — after `sl` the log shows the prompt and nothing else, which is the
   * whole joke.
   */
  const draw = () => {
    const el = document.createElement('p');
    el.className = 'line draw';
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return {
      update(text: string) {
        el.textContent = text;
        /*
         * Follow the tail on every repaint, not just when the block is
         * created. At creation it is still empty and 0px tall, so scrolling
         * then puts nothing in view: the first frame grew it to ten rows and
         * the log stayed exactly where it was. Invisible on a fresh terminal,
         * where the log does not scroll at all, and a train hidden below the
         * fold as soon as anything had been printed before it.
         */
        log.scrollTop = log.scrollHeight;
      },
      end() {
        el.remove();
      },
    };
  };

  /*
   * Measured, not assumed: the log is a fluid width and the monospace face is
   * whatever survived font loading, so a hard-coded 80 would either wrap the
   * art or leave it adrift. One probe, read once per call.
   */
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

  // --------------------------------------------------------- status line
  const clockEl = document.getElementById('terminal-clock');
  const lockEl = document.getElementById('terminal-lock');
  const statusEl = document.getElementById('terminal-status');
  const hostEl = document.getElementById('terminal-host');

  /*
   * Stamped when a prompt is drawn, not ticked on a timer — which is what a
   * real shell does: the prompt shows the time it was printed. No interval,
   * nothing mutating the DOM while the page sits idle.
   */
  const stampClock = () => {
    if (!clockEl) return;
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  /* The strip reports real state: whether the last command failed, and who you
     are this session. `su` promotes guest to root, `exit` demotes again, and
     the prompt has to say so — that is the point of a prompt. */
  const refreshStatus = (failed: boolean) => {
    if (statusEl) statusEl.hidden = !failed;
    const unlocked = isUnlocked();
    if (lockEl) lockEl.hidden = !unlocked;
    if (hostEl) hostEl.textContent = unlocked ? copy.promptUserRoot : copy.promptUser;
    // The header is rendered by SiteNav, which reveals this on page load.
    // su and exit have to keep it honest without a reload.
    const navCv = document.getElementById('nav-cv');
    if (navCv) navCv.hidden = !unlocked;
  };

  /*
   * Both reload and restart print a line first and pause briefly so the
   * message is actually readable before the page goes — except under reduced
   * motion, where the pause is pointless theatre.
   */
  const reboot = (full: boolean) => {
    halted = true;
    if (full) clearSessionFlags();
    appendLine(full ? copy.restarting : copy.reloading, 'out');
    input.disabled = true;
    const settle = reducedMotion() ? 0 : 450;
    window.setTimeout(() => window.location.reload(), settle);
  };

  // ------------------------------------------------------------- context
  const ctx: CommandContext = {
    config,
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
    navigate: (href) => {
      window.location.href = href;
    },
    reboot,
  };

  // ---------------------------------------------------------------- repl
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
      /*
       * A command may take time and animate while it does — see sl. Block the
       * prompt for the duration the way a real shell does, so keystrokes do
       * not queue up behind it, and hand focus back afterwards because
       * disabling an element drops it.
       */
      const hadFocus = document.activeElement === input;
      input.disabled = true;
      try {
        await command.run(rest, ctx);
      } finally {
        if (!halted) {
          input.disabled = false;
          if (hadFocus) input.focus();
        }
      }
    } else {
      // Still an error, so the status segment lights up — but a dead end with
      // no way out is worse than a dead end that hands you the map.
      ctx.printError(`${name}: ${copy.cmdNotFoundSuffix}`);
      ctx.print(renderHelp(commands));
    }
    stampClock();
    refreshStatus(lastFailed);
  };

  // ------------------------------------------------------------- history
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
        const matches = completionNames().filter(
          (candidate) => typed.length > 0 && candidate.startsWith(typed),
        );
        if (matches.length === 1) {
          event.preventDefault();
          input.value = `${matches[0]} `;
        }
        return;
      }
      // Argument completion is opt-in per command rather than a hard-coded
      // list of "cd" and "cat", so a new command gets it by declaring it.
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

  // --------------------------------------------------------------- focus
  chipButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (input.disabled) return;
      input.value = button.dataset.run ?? '';
      form.requestSubmit();
    });
  });

  // Clicking anywhere in the terminal focuses the input, unless the click
  // already landed on something interactive (a chip) that handles itself.
  section.addEventListener('click', (event) => {
    if (input.disabled) return;
    const target = event.target;
    if (target instanceof Element && target.closest('.chip')) return;
    input.focus();
  });

  // Deliberately no autofocus on load: that would pop the keyboard on mobile
  // unprompted and steal a screen-reader user's position. Instead, typing
  // anywhere with nothing else focused focuses the input and lets the
  // keystroke land there.
  document.addEventListener('keydown', (event) => {
    if (input.disabled) return;
    if (document.activeElement !== document.body) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.length !== 1) return;
    // '/' and ctrl/cmd+k belong to TerminalShortcut, which focuses this prompt
    // from anywhere on the site. Leave them alone.
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

  // The prompt only becomes available once the boot intro is done playing —
  // see BootIntro.astro. If the intro isn't running at all (already seen this
  // session, or prefers-reduced-motion), enable immediately.
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
