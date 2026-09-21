---
title: 'Edict'
summary: 'A YAML contract that describes a command exactly once — for the CLI and for the RCON console.'
role: 'Design and implementation'
period: '2026–present'
stack: ['YAML']
logo: '../../../assets/projects/edict.png'
featured: true
order: 20
translationKey: 'edict'
links:
  docs: 'https://edict.leberkas.org/'
---

A command line and a remote console are the same thing wearing two faces: a
name, a few parameters, an answer. They still get described twice — once in
the argument parser, once in the RCON handler — and by the second change the
two have already drifted apart.

Edict turns that around. The commands live in a YAML file, exactly once: what
they are called, which parameters they take, what they return. The contract is
the source and the surfaces are consumers — whether someone types the command
into a terminal or sends it over RCON to a game server.
