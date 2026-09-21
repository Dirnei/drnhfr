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
  /** Kept out of `help` and tab completion. */
  hidden?: boolean;
  /** Tab-completes its argument against the visible filesystem. */
  completesEntries?: boolean;
  run(arg: string, ctx: CommandContext): void | Promise<void>;
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
}

/**
 * What a command is handed. Commands never touch the DOM directly — they
 * print, navigate or flip state through here, which is what makes them
 * testable without a browser.
 */
export interface CommandContext {
  readonly config: TerminalConfig;
  /** Normal output. Multi-line strings are fine; the log preserves newlines. */
  print(text: string): void;
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
  navigate(href: string): void;
  /** full = also clear the session flags, so the boot sequence replays. */
  reboot(full: boolean): void;
}
