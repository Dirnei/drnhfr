export interface Command {
  name: string;
  aliases?: string[];
  usage: string;
  summary: string;
  /** Position in `help`; must be unique. */
  order: number;
  /** Kept out of `help` and tab completion, always. */
  hidden?: boolean;
  listed?(ctx: CommandContext): boolean;
  /** Tab-completes its argument against the visible filesystem. */
  completesEntries?: boolean;
  run(arg: string, ctx: CommandContext): void | Promise<void>;
}

export interface Drawing {
  update(text: string): void;
  end(): void;
}

export interface SearchEntry {
  href: string;
  type: string;
  kind?: string;
  title?: string;
  description?: string;
}

export interface TerminalConfig {
  lang: string;
  cvHref: string;
  otherHomeHref: string;
  searchHref: string;
  introFallbackMs: number;
  /** ISO timestamp of the last commit, or null if git could not say. */
  lastCommit: string | null;
}

export interface CommandContext {
  readonly config: TerminalConfig;
  /** Base for resolving anything relative the visitor types. */
  readonly origin: string;
  print(text: string): void;
  printArt(text: string): void;
  /** Error output. Also lights the ✗ segment in the status line. */
  printError(text: string): void;
  clearScreen(): void;
  entries(): SearchEntry[];
  find(name: string): SearchEntry | undefined;
  commands(): Command[];
  isUnlocked(): boolean;
  setUnlocked(value: boolean): void;
  draw(): Drawing;
  /** How many characters fit across the log right now, measured not guessed. */
  columns(): number;
  charWidth(sample: string): number;
  reducedMotion(): boolean;
  uptimeMs(): number;
  history(): readonly string[];
  interrupted(): Promise<void>;
  navigate(href: string): void;
  openTab(href: string): boolean;
  /** full = also clear the session flags, so the boot sequence replays. */
  reboot(full: boolean): void;
}
