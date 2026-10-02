# Spec Delta

## MODIFIED Requirements

### Requirement: Challenge 1, recon

The source of every page in both languages SHALL contain an HTML comment holding the first flag base64-encoded, as specified in `ctf/start`, not only the home page. The comment MUST survive the production build.

#### Scenario: Viewing source

- **WHEN** a visitor views the source of any page and base64-decodes the comment
- **THEN** the result is the flag for the site door
