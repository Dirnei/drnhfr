# Spec Delta

## Purpose

Defines how a visitor plays the capture the flag game: entering flags, opening doors, asking for hints, and seeing progress across pages within one browser session.

## ADDED Requirements

### Requirement: Submitting a flag

The terminal SHALL offer a `submit <flag>` command. Surrounding whitespace is ignored, and the `drnhfr{...}` wrapper may be left out, so `submit example-flag-content` counts the same as `submit drnhfr{example-flag-content}`; the flag is otherwise matched exactly. A flag opens whichever locked door it decrypts, regardless of the order in which doors are solved.

#### Scenario: Correct flag

- **WHEN** a visitor submits the flag of a locked door
- **THEN** the terminal names the door that opened and how to get there, the door is recorded as solved, and the CTF menu shows it without a reload

#### Scenario: Flag without the wrapper

- **WHEN** a visitor submits only the part between the braces of a locked door's flag
- **THEN** the door opens exactly as if the full flag had been submitted

#### Scenario: Wrong flag

- **WHEN** a visitor submits text that opens no door
- **THEN** the terminal prints an error saying no door opens with it, and nothing is recorded

#### Scenario: Flag already used

- **WHEN** a visitor submits the flag of a door that is already solved
- **THEN** the terminal says which door that flag already opened

#### Scenario: No WebCrypto

- **WHEN** the page runs in a context without `crypto.subtle`
- **THEN** `submit` prints an error that the browser cannot check flags here, instead of failing silently

### Requirement: Progress lives in sessionStorage only

Solved doors SHALL be remembered in `sessionStorage` and nowhere else. On every page load the site re-opens each remembered door without deriving its key again, so navigating stays fast. If storage is unavailable, a submitted flag still opens its door for the current page.

#### Scenario: Navigating after solving

- **WHEN** a visitor solves a door and then navigates to another page in the same tab
- **THEN** the door is still solved there

#### Scenario: Storage blocked

- **WHEN** `sessionStorage` throws on access and a visitor submits a correct flag
- **THEN** the door opens on the current page and the terminal adds one line saying the progress will not carry over to the next page

#### Scenario: Terminal restart

- **WHEN** a visitor runs `restart` in the terminal
- **THEN** every door is locked again after the reboot, together with the cv

#### Scenario: New session

- **WHEN** the visitor opens the site in a new tab or after closing the browser
- **THEN** every door is locked again

### Requirement: Hints

The terminal SHALL offer a `hint` command that gives a nudge for the lowest-numbered locked door. Each door has up to two hint levels; calling `hint` again for the same door gives the next level, and after the last level repeats it. Hints for door N+1 become available only once door N is solved, except the hints for the first door, which are public.

#### Scenario: First hint

- **WHEN** a visitor with no solved doors runs `hint`
- **THEN** the terminal prints the first hint for the first door

#### Scenario: Escalating hint

- **WHEN** the visitor runs `hint` again without solving anything
- **THEN** the terminal prints the second, more specific hint for the same door

#### Scenario: Everything solved

- **WHEN** all five doors are solved and the visitor runs `hint`
- **THEN** the terminal says there is nothing left to find

### Requirement: Story pages

Each door SHALL have a page in both languages. Until solved, it shows a locked placeholder that points to the terminal. Once solved, it shows the story in the page's language, styled like the rest of the site. Story pages MUST carry `noindex` and MUST NOT appear in the sitemap or the terminal search index.

#### Scenario: Visiting a locked door directly

- **WHEN** a visitor opens the URL of an unsolved door
- **THEN** the page shows the locked placeholder and a pointer to `submit` and `hint`

#### Scenario: Visiting a solved door

- **WHEN** a visitor opens the URL of a solved door
- **THEN** the story is shown in the page's language

#### Scenario: Language switch on a door

- **WHEN** a visitor on a solved door switches language
- **THEN** the same door opens in the other language without asking for the flag again

### Requirement: CTF menu in the nav

Once at least one door is solved, the nav SHALL show a single CTF entry that opens a menu listing all doors in door order. Solved doors appear by title as links; locked doors appear as `?????`. Activating a locked entry shows the word LOCKED in its place, animated in and faded out within about a second (only faded with reduced motion), and navigates nowhere. Before the first door is solved, the CTF entry MUST NOT appear. The menu closes on a click outside it and on Escape.

#### Scenario: First door solved

- **WHEN** a visitor solves the first door
- **THEN** a CTF entry appears in the nav, and its menu lists that door by title and four `?????` entries

#### Scenario: Clicking a locked door

- **WHEN** the visitor activates a `?????` entry
- **THEN** LOCKED appears in that row only, fades out, and the page does not change

#### Scenario: Nothing solved

- **WHEN** no door is solved
- **THEN** the nav shows no CTF entry

### Requirement: Home page write-up

The home page SHALL show a write-up about the game. It MUST NOT list the doors; the CTF menu in the nav is where solved doors are reached. Below tablet width, where the terminal is hidden, the write-up is followed by a note that the game needs a wider screen.

#### Scenario: Fresh visitor

- **WHEN** a visitor opens the home page
- **THEN** the write-up is shown and no list of doors

### Requirement: Privacy pages describe the storage

The privacy pages in both languages SHALL describe the `sessionStorage` entry that holds solved flags: what it contains, that it never leaves the browser, and that it is gone when the session ends.

#### Scenario: Reading the privacy page

- **WHEN** a visitor reads the storage section of the privacy page in either language
- **THEN** the CTF progress entry is listed alongside the existing entries
