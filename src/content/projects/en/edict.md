---
title: 'Edict'
summary: 'A YAML specification for describing CLI and RCON commands.'
role: 'Design and implementation'
period: '2026–present'
stack: ['YAML']
featured: true
order: 20
translationKey: 'edict'
links:
  docs: 'https://edict.leberkas.org/'
---

Edict describes commands in a YAML file: name, parameters and return value.
Both the command line and the RCON console used to control game servers
remotely work from that one description.

Without it, the two sides are maintained separately, once in the argument
parser and once in the RCON handler. By the second change they have drifted
apart.
