/*
 * The terminal is English-only by design: its commands are English words, and
 * German help text wrapped around `ls` and `cd` reads as neither one language
 * nor the other. The `lang` prop still drives which search index is fetched
 * and where `cd` navigates, so a German page's terminal still moves around
 * the German site — only the chrome is English.
 *
 * That is why this is a plain module rather than anything locale-aware: it is
 * imported by the component for the parts rendered on the server (the chips,
 * the intro line, the resting prompt) and by the client shell for the rest.
 */
export const copy = {
  // Who you are before and after `su`. The locked identity is the one
  // rendered on the server, so a visitor with no JS is guest.
  promptUser: 'guest@drnhfr',
  promptUserRoot: 'root@drnhfr',
  introLine: 'type "help" or "?" for a list of commands.',
  reloading: 'reloading …',
  restarting: 'restarting …',
  whoami:
    'christian dirnhofer. builds distributed systems for a living, actors and circuit boards for fun.',
  emptyLs: '(empty)',
  cmdNotFoundSuffix: 'command not found',
  helpHeading: 'available commands:',
  catMissing: 'cat: missing operand',
  catNotFoundPrefix: 'cat: no such file: ',
  catNoDescription: 'no description available.',
  cdNotFoundPrefix: 'cd: no such directory: ',
  suMissing: 'su: please supply the root password',
  suWrong: 'su: authentication failure. nice try.',
  suSuccess: 'access granted. you are root.',
  suHintPrefix: 'the cv is mounted and listed in the nav — or: cd ',
  cvDescription: 'the cv. root only.',
  exitDone: 'back to guest. cv locked.',
  exitIdle: 'already guest.',
  chips: [
    { label: 'ls', run: 'ls' },
    { label: 'cd blog', run: 'cd blog' },
    { label: 'help', run: 'help' },
  ],
} as const;
