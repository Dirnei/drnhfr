## MODIFIED Requirements

### Requirement: CTF main page content

The CTF main page SHALL explain, in both languages: where capture the flag competitions come from and the usual formats; how Christian came to know them; and a first overview of tools that are generally useful in CTFs, aimed at someone who has never played one. In the tool overview, the ASCII table entry links to the site's own ASCII table page, and the base64, curl and cat entries link to their sections of the terminal guide. It ends with how to play this game: flags look like `drnhfr{...}`, are entered with `submit`, and `hint` helps; this section links to the terminal guide and the ASCII table in the page's language. The part about Christian is a placeholder until he writes it.

#### Scenario: Reading the main page

- **WHEN** a visitor opens the CTF main page in either language
- **THEN** it shows sections on the history of CTFs, Christian's own story, general CTF tools, and how to play this game

#### Scenario: Tool overview for beginners

- **WHEN** a visitor new to CTFs reads the tool overview
- **THEN** each tool is named with one plain sentence on what it is for, and the page says that this game needs nothing beyond a browser

#### Scenario: Reaching the help pages

- **WHEN** a visitor on the German CTF main page follows the links in "So funktioniert dieses Spiel"
- **THEN** they reach `/de/ctf/terminal/` and `/de/ctf/ascii/`, and the ASCII table entry in the tool list leads to `/de/ctf/ascii/` as well, and the base64, curl and cat entries to `#base64`, `#curl` and `#cat` on `/de/ctf/terminal/`
