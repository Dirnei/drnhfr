# Spec Delta

## MODIFIED Requirements

### Requirement: Progress lives in sessionStorage only

Solved doors SHALL be remembered in `sessionStorage` and nowhere else, in the same entry that holds whether the game is started and its timer. On every page load the site re-opens each remembered door without deriving its key again, so navigating stays fast. If storage is unavailable, a submitted flag still opens its door for the current page.

#### Scenario: Navigating after solving

- **WHEN** a visitor solves a door and then navigates to another page in the same tab
- **THEN** the door is still solved there

#### Scenario: Storage blocked

- **WHEN** `sessionStorage` throws on access and a visitor submits a correct flag
- **THEN** the door opens on the current page and the terminal adds one line saying the progress will not carry over to the next page

#### Scenario: Terminal restart

- **WHEN** a visitor runs `restart` in the terminal
- **THEN** after the reboot every door is locked again together with the cv, the game is no longer started, and its timer is gone

#### Scenario: New session

- **WHEN** the visitor opens the site in a new tab or after closing the browser
- **THEN** every door is locked again and the game is not started

### Requirement: Hints

The terminal SHALL offer a `hint` command, once the game is started, that gives a nudge for the lowest-numbered locked door. Each door has up to two hint levels; calling `hint` again for the same door gives the next level, and after the last level repeats it. Hints for door N+1 become available only once door N is solved, except the hints for the first door, which are public. The hints for the first door point to the visible base64 string, not to the page source.

#### Scenario: First hint

- **WHEN** a visitor who has started the game and solved no door runs `hint`
- **THEN** the terminal prints the first hint for the first door, which points towards the visible string on the page

#### Scenario: Escalating hint

- **WHEN** the visitor runs `hint` again without solving anything
- **THEN** the terminal prints the second, more specific hint for the same door

#### Scenario: Everything solved

- **WHEN** all five doors are solved and the visitor runs `hint`
- **THEN** the terminal says there is nothing left to find

### Requirement: Home page write-up

The home page SHALL show a short paragraph that names the capture the flag game and says it is started by typing `ctf` in the terminal. It MUST NOT explain the game further, MUST NOT list the doors, and MUST NOT contain the first flag in any form. Below tablet width, where the terminal is hidden, the paragraph is followed by a note that the game needs a wider screen.

#### Scenario: Fresh visitor

- **WHEN** a visitor opens the home page
- **THEN** a short paragraph names the game and the `ctf` command, and no list of doors is shown

#### Scenario: Source of the home page

- **WHEN** a visitor views the home page source
- **THEN** it contains no HTML comment holding the first flag

### Requirement: Privacy pages describe the storage

The privacy pages in both languages SHALL describe the CTF `sessionStorage` entry: that it holds whether the game is started, the start and finish timestamps of a run, a key derived from each solved flag and the hint count; that it never leaves the browser; and that it is gone when the session ends.

#### Scenario: Reading the privacy page

- **WHEN** a visitor reads the storage section of the privacy page in either language
- **THEN** the CTF entry is listed alongside the existing entries, including the started flag and the timestamps
