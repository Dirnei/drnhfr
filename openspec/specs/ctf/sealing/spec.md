# ctf/sealing Specification

## Purpose

Defines how the capture the flag content is authored, encrypted and shipped, so that neither the public repository nor the built site reveals a flag or a locked story.

## Requirements

### Requirement: Door source is committed encrypted

The plaintext of every door (flag, story text in German and English, hints for the next door, and any terminal data or downloadable file the door contributes) SHALL be committed only in SOPS-encrypted form, one file per door, encrypted to an age recipient declared in the repository. Field names MAY stay readable; field values MUST NOT.

#### Scenario: Repository contains no plaintext flag

- **WHEN** the repository is searched for each of the game's five flags
- **THEN** no committed file contains any of them

#### Scenario: Editing a door

- **WHEN** the owner runs `sops edit` on a door file with the age key present
- **THEN** the decrypted content opens in the editor and is re-encrypted on save, with no plaintext copy left on disk

### Requirement: Sealing produces per-door ciphertext

A seal command SHALL decrypt each door source, render its stories from Markdown to HTML, and write one sealed file per door containing only a nonce and an AES-GCM ciphertext of the door payload. The key for each door MUST be derived from that door's flag with PBKDF2-SHA256 using a single salt shared by all doors, so that one key derivation can test a flag against every door.

#### Scenario: Seal output for all doors

- **WHEN** the owner runs the seal command with the age key available
- **THEN** a sealed file exists for each of the five doors and every one of them decrypts with its door's flag

#### Scenario: Seal without tooling

- **WHEN** the seal command runs and `sops` is not installed or the age key is missing
- **THEN** it stops with a message naming what is missing and leaves the existing sealed files untouched

### Requirement: The build needs no secret

The site build SHALL read only the committed sealed files and the public entry hint. It MUST NOT require SOPS, the age key or any flag.

#### Scenario: CI build

- **WHEN** the deploy workflow builds the site on a runner without SOPS or the age key
- **THEN** the build succeeds and the five doors are playable on the deployed site

### Requirement: The built site leaks no flag or locked story

The build output SHALL contain no flag in plain text and no plaintext of any story. The only flag present in any form is the first one, which appears base64-encoded in the home page source as the start of the game. Text that describes the flag format, such as `drnhfr{...}`, is allowed.

#### Scenario: Searching the output

- **WHEN** every file in the build output is searched for a complete flag, `drnhfr{` followed by at least 16 characters and `}`
- **THEN** there are no matches

#### Scenario: Locked page source

- **WHEN** a visitor views the source of a locked story page
- **THEN** it shows the locked placeholder and ciphertext, and none of the story text
