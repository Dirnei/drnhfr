---
title: 'Edict'
summary: 'Eine YAML-Spezifikation um CLI oder RCON Commands zu beschreiben.'
role: 'Entwurf und Umsetzung'
period: '2026 – heute'
stack: ['YAML']
featured: true
order: 20
translationKey: 'edict'
links:
  docs: 'https://edict.leberkas.org/'
---

Edict beschreibt Kommandos in einer YAML-Datei: wie sie heißen, welche
Parameter sie nehmen, was sie zurückgeben. Aus dieser einen Beschreibung
bedienen sich die Kommandozeile und die RCON-Konsole, über die Spieleserver
ferngesteuert werden.

Ohne so eine Beschreibung werden beide Seiten getrennt gepflegt, einmal im
Argument-Parser und einmal im RCON-Handler. Ab der zweiten Änderung laufen
sie auseinander.
