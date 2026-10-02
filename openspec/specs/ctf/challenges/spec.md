# ctf/challenges Specification

## Purpose

Defines the five challenges of the capture the flag chain and the site behaviour each one relies on, so that every flag is findable with a browser and the site's own terminal on any operating system.

## Requirements

### Requirement: Flag format and chain order

Every flag SHALL have the form `drnhfr{...}`. The doors open in this order: site, homelab, laser, dartomat, smarthome. The flag for the first door is found on the public site; the flag for each later door is found through the previous door's story. Smarthome is the finale and contains no flag.

#### Scenario: Finale

- **WHEN** a visitor opens the smarthome door
- **THEN** the story ends the game and points to the contact page, and no further flag is hidden in it

### Requirement: Challenge 1, recon

The source of every page in both languages SHALL contain an HTML comment holding the first flag base64-encoded, as specified in `ctf/start`, not only the home page. The comment MUST survive the production build.

#### Scenario: Viewing source

- **WHEN** a visitor views the source of any page and base64-decodes the comment
- **THEN** the result is the flag for the site door

### Requirement: Challenge 2, hidden file

Once the site door is solved, the terminal's `ls -a` SHALL list a dotfile that plain `ls` does not show, and `cat` on that dotfile SHALL print the flag for the homelab door. Before the site door is solved, the dotfile does not exist.

#### Scenario: Listing hidden files

- **WHEN** the site door is solved and the visitor runs `ls -a`
- **THEN** the listing includes the dotfile

#### Scenario: Plain ls

- **WHEN** the visitor runs `ls` without `-a`
- **THEN** the dotfile is not listed

#### Scenario: Before solving the site door

- **WHEN** the site door is locked and the visitor runs `cat` on the dotfile's name
- **THEN** `cat` reports that the file does not exist

### Requirement: Challenge 3, homelab network

The homelab story SHALL show a network diagram with hosts and private IP addresses, one of which stands out. Once the homelab door is solved, `curl` to that host's address SHALL print a fake HTTP response in the terminal whose headers carry the flag for the laser door. Other hosts on the diagram answer with plausible responses without a flag. `curl` to any private address that the fake network does not know, or to any private address while the homelab door is locked, SHALL print `curl: (7) Failed to connect` and MUST NOT open a tab.

#### Scenario: Querying the odd host

- **WHEN** the homelab door is solved and the visitor runs `curl` with the odd host's address
- **THEN** the terminal prints a response with status line, headers and body, and one header carries the laser flag

#### Scenario: Locked network

- **WHEN** the homelab door is locked and the visitor runs `curl` with that address
- **THEN** the terminal prints `curl: (7) Failed to connect` and no tab opens

#### Scenario: Public URLs unchanged

- **WHEN** the visitor runs `curl` with a public URL
- **THEN** it opens in a new tab as before

### Requirement: Challenge 4, G-code

The laser story SHALL offer a G-code file for download. Rendered as a toolpath in a common G-code viewer, the file draws the flag for the dartomat door in legible characters. The download MUST be generated in the browser from the decrypted door and MUST NOT make a network request.

#### Scenario: Downloading the file

- **WHEN** the visitor clicks the download on the solved laser page
- **THEN** the browser saves a `.gcode` file without any network request

#### Scenario: Reading the toolpath

- **WHEN** the file is opened in a G-code viewer
- **THEN** the toolpath spells out the dartomat flag

### Requirement: Challenge 5, game log

The dartomat story SHALL include a dart game log whose scores encode the flag for the smarthome door as character codes, optionally with a fixed shift that the story hints at. It MUST be solvable with pencil and paper.

#### Scenario: Decoding the log

- **WHEN** a visitor converts the scores to characters using the rule the story hints at
- **THEN** the result is the smarthome flag
