# ctf/help Specification

## Purpose

Defines the CTF help pages: an ASCII table and an explanation of the site's terminal and its `cat`, `curl` and `base64` commands, so that a visitor who has never used either can play without getting stuck on the tools.

## Requirements

### Requirement: Help pages under the CTF main page

The site SHALL offer two help pages in both languages as children of the CTF main page: an ASCII table at `/de/ctf/ascii/` and `/en/ctf/ascii/`, and a terminal guide at `/de/ctf/terminal/` and `/en/ctf/terminal/`. Each page links to its counterpart in the other language through the language switch. Neither page depends on the game being started or on any door being solved, and neither uses storage or JavaScript to show its content. A help page's address MUST NOT coincide with a door's address.

#### Scenario: Opening a help page without playing

- **WHEN** a visitor who has never run `ctf` opens `/de/ctf/ascii/`
- **THEN** the full ASCII table is shown

#### Scenario: Switching language

- **WHEN** a visitor on `/en/ctf/terminal/` uses the language switch
- **THEN** the browser opens `/de/ctf/terminal/`

#### Scenario: No collision with doors

- **WHEN** the site is built
- **THEN** no help page slug equals a door slug, and the build fails if one does

### Requirement: Help pages stay out of indexes

The help pages SHALL carry `noindex` and MUST NOT appear in the sitemap or in either search index, like every other page under `/ctf/`.

#### Scenario: Built site

- **WHEN** the site is built
- **THEN** each help page has a robots `noindex` meta tag, and neither the sitemap nor `search.json` in either language contains its address

### Requirement: ASCII table

The ASCII page SHALL list every code from 0 to 127, each with its decimal value, its hexadecimal value, its eight-digit binary value and the character. Control characters (0 to 31 and 127) are shown by their usual abbreviation, such as `NUL`, `LF` or `DEL`, and the space by `SP`, so that no cell looks empty. The page has a short text in the page's language saying what ASCII is and how to read a row. The table is readable at phone width without the page scrolling sideways.

#### Scenario: Looking up a letter

- **WHEN** a visitor looks for the row with decimal 65
- **THEN** that row shows hexadecimal `41`, binary `01000001` and the character `A`

#### Scenario: Control characters

- **WHEN** a visitor looks at codes 0, 10 and 127
- **THEN** they read `NUL`, `LF` and `DEL` instead of an empty or invisible cell

#### Scenario: Phone width

- **WHEN** the page is shown 375 pixels wide
- **THEN** all 128 rows are reachable by scrolling down and the page has no horizontal scroll

### Requirement: Terminal guide

The terminal page SHALL explain, in the page's language, how to open the site's terminal and that it only shows from tablet width up, and then `cat`, `curl` and `base64` as they behave in this terminal, each with at least one example a visitor can type and the output it gives. It explains the pipe `|` with an example that feeds `echo` into `base64`, because decoding base64 from a pipe is the common case. For `curl` it says that a public address opens in a new tab here, where a real `curl` prints the response.

#### Scenario: base64 examples

- **WHEN** a visitor types the page's examples `base64 hallo`, `base64 -d aGFsbG8=` and `echo aGFsbG8= | base64 -d` into the terminal
- **THEN** the terminal prints exactly the output the page shows for each

#### Scenario: curl example

- **WHEN** a visitor types the page's `curl` example with a public address
- **THEN** that address opens in a new tab, as the page says

#### Scenario: cat example

- **WHEN** a visitor types the page's `cat` example with a page name such as `cat projekte`
- **THEN** the terminal prints that page's short description

### Requirement: Help does not give away a challenge

The help pages SHALL explain tools only. They MUST NOT mention hidden files, `ls -a`, private network addresses, any host of the fake homelab network, any flag or part of a flag, or which tool solves which door.

#### Scenario: Reading the terminal guide after the game

- **WHEN** someone who has solved every door reads the terminal guide
- **THEN** no example or sentence on it is a step of a challenge
