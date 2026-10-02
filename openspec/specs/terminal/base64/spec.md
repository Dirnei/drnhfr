# terminal/base64 Specification

## Purpose

Defines the terminal's `base64` command, which encodes text to base64 and decodes base64 back to text, from its argument or from a pipe.

## Requirements

### Requirement: Encoding

`base64 <text>` SHALL print the standard base64 encoding (RFC 4648 alphabet, with `=` padding) of the UTF-8 bytes of `<text>`, on one line with no wrapping. Leading and trailing whitespace of the argument is not part of the text. No newline is appended to the input before encoding.

#### Scenario: ASCII text

- **WHEN** the visitor runs `base64 hallo`
- **THEN** the terminal prints `aGFsbG8=`

#### Scenario: Non-ASCII text

- **WHEN** the visitor runs `base64 Grüße`
- **THEN** the terminal prints `R3LDvMOfZQ==`

#### Scenario: Long input

- **WHEN** the visitor encodes text whose encoding is longer than 76 characters
- **THEN** the encoding is printed as a single line with no line breaks inserted

### Requirement: Decoding

`base64 -d <text>` and `base64 --decode <text>` SHALL decode `<text>` from base64 and print the result as UTF-8 text. Decoding MUST ignore whitespace and line breaks inside the input, MUST accept input with the `=` padding missing, and MUST accept the URL-safe alphabet (`-` and `_` in place of `+` and `/`).

#### Scenario: Decoding a value

- **WHEN** the visitor runs `base64 -d aGFsbG8=`
- **THEN** the terminal prints `hallo`

#### Scenario: Long option

- **WHEN** the visitor runs `base64 --decode R3LDvMOfZQ==`
- **THEN** the terminal prints `Grüße`

#### Scenario: Missing padding

- **WHEN** the visitor runs `base64 -d aGFsbG8`
- **THEN** the terminal prints `hallo`

#### Scenario: URL-safe alphabet

- **WHEN** the visitor decodes input that uses `-` and `_`
- **THEN** it decodes to the same text as the same input written with `+` and `/`

### Requirement: Piped input

When the argument holds no text, `base64` SHALL read the text from the previous stage of a pipe. Text in the argument takes precedence over piped input. Piped input with several lines is encoded as one text with the lines joined by newlines; when decoding, the line breaks are ignored like any other whitespace.

#### Scenario: Encoding from a pipe

- **WHEN** the visitor runs `echo hallo | base64`
- **THEN** the terminal prints `aGFsbG8=`

#### Scenario: Round trip

- **WHEN** the visitor runs `echo Grüße | base64 | base64 -d`
- **THEN** the terminal prints `Grüße`

#### Scenario: Argument wins

- **WHEN** the visitor runs `echo other | base64 hallo`
- **THEN** the terminal prints `aGFsbG8=`

### Requirement: Errors

`base64` SHALL print an error, and nothing else, when there is no input, when the input to `-d` is not base64, when it decodes to bytes that are not valid UTF-8, or when an option other than `-d` and `--decode` is given. Each error message MUST say what went wrong and show an example that works.

#### Scenario: No input

- **WHEN** the visitor runs `base64` with no argument and nothing piped in
- **THEN** an error is printed that shows an example such as `echo hallo | base64`

#### Scenario: Not base64

- **WHEN** the visitor runs `base64 -d not*base64`
- **THEN** an error is printed saying the input is not base64

#### Scenario: Binary result

- **WHEN** the visitor decodes base64 whose bytes are not valid UTF-8, such as `base64 -d //79`
- **THEN** an error is printed saying the result is not text

#### Scenario: Unknown option

- **WHEN** the visitor runs `base64 -x hallo`
- **THEN** an error is printed naming `-x` and the supported `-d`

### Requirement: Listed in help

`base64` SHALL appear in `help` with its usage and a one-line summary, and SHALL complete with Tab like every other listed command.

#### Scenario: Help

- **WHEN** the visitor runs `help`
- **THEN** the listing includes `base64` with a usage that shows the `-d` option
