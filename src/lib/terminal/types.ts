/**
 * The contract a terminal command implements.
 *
 * Adding a command means adding one file to ./commands/ that default-exports
 * this shape. The registry picks it up with import.meta.glob, and `help` and
 * tab completion both derive from the registry — so there is no second place
 * to register it and nothing that can drift out of sync.
 */
export interface Command {
  /** What you type. Lower case; input is lower-cased before dispatch. */
  name: string;
  /** Extra names that dispatch to the same command, e.g. "?" for help. */
  aliases?: string[];
  /** Left column of `help`, e.g. "cd <target>". Aliases belong in here too. */
  usage: string;
  /** Right column of `help`. One line, lower case, no trailing period. */
  summary: string;
  /** Curated position in `help`. Alphabetical order reads worse than this. */
  order: number;
  /** Kept out of `help` and tab completion, always. */
  hidden?: boolean;
  /**
   * Kept out of `help` and tab completion unless this says otherwise — for
   * commands that only make sense in a particular state. It still dispatches
   * when typed in full: hiding a command is about not cluttering the list,
   * not about refusing to run it.
   */
  listed?(ctx: CommandContext): boolean;
  /** Tab-completes its argument against the visible filesystem. */
  completesEntries?: boolean;
  run(arg: string, ctx: CommandContext): void | Promise<void>;
}

/**
 * A block of the log a command owns and can repaint, for anything that is not
 * a line of text you print once: an animation, a progress bar, a game. Held
 * open until end(), which removes it again.
 */
export interface Drawing {
  update(text: string): void;
  end(): void;
}

/** One row of /{lang}/search.json, plus the CV which is spliced in locally. */
export interface SearchEntry {
  href: string;
  type: string;
  kind?: string;
  title?: string;
  description?: string;
}

/** Everything the server knows and the client cannot work out for itself. */
export interface TerminalConfig {
  lang: string;
  cvHref: string;
  otherHomeHref: string;
  searchHref: string;
  introFallbackMs: number;
  /** ISO timestamp of the last commit, or null if git could not say. */
  lastCommit: string | null;
}

/**
 * What a command is handed. Commands never touch the DOM directly — they
 * print, navigate or flip state through here, which is what makes them
 * testable without a browser.
 */
export interface CommandContext {
  readonly config: TerminalConfig;
  /** Base for resolving anything relative the visitor types. */
  readonly origin: string;
  /** Normal output. Multi-line strings are fine; the log preserves newlines. */
  print(text: string): void;
  /**
   * Preformatted output that must not be re-wrapped: ASCII art, tables,
   * anything where a column means something. Stays in the scrollback, unlike
   * a Drawing, and scrolls sideways rather than folding if it is too wide.
   */
  printArt(text: string): void;
  /** Error output. Also lights the ✗ segment in the status line. */
  printError(text: string): void;
  clearScreen(): void;
  /** The filesystem as it currently appears — the CV only once unlocked. */
  entries(): SearchEntry[];
  /** Resolve a bare name like "blog" to an entry, or undefined. */
  find(name: string): SearchEntry | undefined;
  /** Every registered command, for `help`. */
  commands(): Command[];
  isUnlocked(): boolean;
  setUnlocked(value: boolean): void;
  /** A repaintable block of the log. See Drawing. */
  draw(): Drawing;
  /** How many characters fit across the log right now, measured not guessed. */
  columns(): number;
  /**
   * The rendered advance width of a sample string, in pixels per character.
   * Lets a command check that a glyph really is cell-compatible before it
   * builds a grid out of it — the font that actually renders is whatever
   * survived font-display: optional, not necessarily the one we asked for.
   */
  charWidth(sample: string): number;
  /** True when the visitor asked for less motion — animate nothing. */
  reducedMotion(): boolean;
  /** Milliseconds since the page was opened. */
  uptimeMs(): number;
  /** Commands entered this session, oldest first. */
  history(): readonly string[];
  /**
   * Resolves on the next keypress. A long-running command awaits this to let
   * the visitor out — without it, anything that loops would hold the prompt
   * hostage until it decided to stop on its own.
   */
  interrupted(): Promise<void>;
  navigate(href: string): void;
  /**
   * Opens a URL in a new tab. Returns false if the browser refused — usually
   * a popup blocker, which the caller should report rather than swallow.
   */
  openTab(href: string): boolean;
  /** full = also clear the session flags, so the boot sequence replays. */
  reboot(full: boolean): void;
}
