---
title: 'Edict'
summary: 'A YAML specification for describing CLI and RCON commands.'
role: 'Design and implementation'
period: '2026–present'
stack: ['YAML']
featured: true
order: 20
links:
  docs: 'https://edict.leberkas.org/'
---

Edict tries to describe CLI apps with a YAML file, in the way OpenAPI does it
for REST. That makes it possible not only to build one consistent UI for the
documentation (Swagger UI), but also to drive CLIs programmatically. For
RCON-capable game servers in particular, a really interesting thing.

The origin was the inconsistent documentation of the available RCON commands
across games like Minecraft, Project Zomboid or Ark SE.
