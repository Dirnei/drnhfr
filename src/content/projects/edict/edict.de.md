---
title: 'Edict'
summary: 'Eine YAML-Spezifikation um CLI oder RCON Commands zu beschreiben.'
role: 'Entwurf und Umsetzung'
period: '2026 – heute'
stack: ['YAML']
featured: true
order: 20
links:
  docs: 'https://edict.leberkas.org/'
---

Edict versucht, mit einer YAML-Datei CLI-Apps zu beschreiben, ähnlich wie es
OpenAPI für REST macht. Das ermöglicht nicht nur, eine einheitliche UI für die
Doku zu erschaffen (Swagger UI), sondern ermöglicht es auch, programmatisch
CLIs zu verwenden. Vor allem für RCON-fähige Game-Server eine super
interessante Sache.

Ursprung war die nicht einheitliche Dokumentation von verfügbaren RCON-Commands
in verschiedenen Spielen wie Minecraft, Project Zomboid oder Ark SE.
