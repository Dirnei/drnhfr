# ctf/start Specification

## Purpose

Defines how the capture the flag game is started from the terminal, how long a run takes, and what the CTF main page tells a visitor who has never played a CTF before.

## Requirements

### Requirement: Starting the game with ctf

The terminal SHALL offer a `ctf` command, listed in `help` for every visitor. Running it when no game is in progress marks the game as started, records the start time, and navigates to the CTF main page in the page's language. Running it while a game is in progress navigates to the CTF main page and prints the time elapsed so far, without restarting the timer.

#### Scenario: First start

- **WHEN** a visitor who has not started the game runs `ctf`
- **THEN** the game is marked as started, the timer starts, and the browser opens the CTF main page

#### Scenario: Running ctf again

- **WHEN** a visitor with a game in progress runs `ctf`
- **THEN** the terminal prints the elapsed time, the browser opens the CTF main page, and the start time is unchanged

#### Scenario: Running ctf after finishing

- **WHEN** a visitor who has solved all five doors runs `ctf`
- **THEN** the terminal prints the final time and the browser opens the CTF main page

### Requirement: Game commands exist only after the start

Before the game is started, `submit` and `hint` SHALL NOT exist for the visitor: they are not listed in `help`, not offered by tab completion, and typing them prints `command not found` exactly as for an unknown command. Once the game is started they behave as specified in `ctf/play`.

#### Scenario: submit before the start

- **WHEN** a visitor who has not run `ctf` types `submit anything`
- **THEN** the terminal prints `submit: command not found`, followed by the usual help listing, which does not include `submit` or `hint`

#### Scenario: Commands appear after the start

- **WHEN** the visitor runs `ctf` and then `help`
- **THEN** `submit` and `hint` are listed

### Requirement: Timing a run

The time between starting the game and submitting the flag that opens the last unsolved door SHALL be measured with wall-clock timestamps kept in the CTF `sessionStorage` entry, so it survives navigation and counts time spent away from the site. Submitting the final flag stops the timer and the terminal prints the total time. The finale page shows the same total. Restarting the terminal with `restart` ends the game and discards the timer.

#### Scenario: Finishing the chain

- **WHEN** a visitor submits the flag that opens the fifth and last locked door
- **THEN** the terminal prints the door that opened followed by the total time in hours, minutes and seconds, and the timer stops

#### Scenario: Time on the finale page

- **WHEN** a visitor who has finished opens the smarthome door
- **THEN** the page shows the total time of the run

#### Scenario: Navigation during a run

- **WHEN** a visitor starts the game, navigates through several pages and reloads one
- **THEN** the elapsed time printed by `ctf` still counts from the original start

#### Scenario: Restart

- **WHEN** a visitor runs `restart` during or after a run
- **THEN** the game is no longer started, the timer is gone, and `submit` and `hint` no longer exist

### Requirement: First flag in every page source

Every page in both languages SHALL contain an HTML comment holding the base64 encoding of the first flag, whether or not the game is started. Nothing of it is shown on the rendered page.

#### Scenario: Viewing any page source

- **WHEN** a visitor views the source of any page and base64-decodes the comment
- **THEN** the result is the flag for the site door

#### Scenario: Nothing on screen

- **WHEN** a visitor looks at any page in the browser
- **THEN** no base64 string is displayed

### Requirement: CTF main page content

The CTF main page SHALL explain, in both languages: where capture the flag competitions come from and the usual formats; how Christian came to know them; and a first overview of tools that are generally useful in CTFs, aimed at someone who has never played one. It ends with how to play this game: flags look like `drnhfr{...}`, are entered with `submit`, and `hint` helps. The part about Christian is a placeholder until he writes it.

#### Scenario: Reading the main page

- **WHEN** a visitor opens the CTF main page in either language
- **THEN** it shows sections on the history of CTFs, Christian's own story, general CTF tools, and how to play this game

#### Scenario: Tool overview for beginners

- **WHEN** a visitor new to CTFs reads the tool overview
- **THEN** each tool is named with one plain sentence on what it is for, and the page says that this game needs nothing beyond a browser
