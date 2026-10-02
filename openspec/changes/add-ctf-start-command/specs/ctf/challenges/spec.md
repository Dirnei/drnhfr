# Spec Delta

## MODIFIED Requirements

### Requirement: Challenge 1, recon

Once the game is started, every page in both languages SHALL show the first flag base64-encoded as visible text, as specified in `ctf/start`. The home page source no longer carries it in an HTML comment.

#### Scenario: Decoding the visible string

- **WHEN** a visitor who has started the game base64-decodes the string shown on any page
- **THEN** the result is the flag for the site door

#### Scenario: Viewing source

- **WHEN** a visitor views the home page source
- **THEN** no HTML comment holds the first flag, and the flag is reached only through the visible string after starting the game
