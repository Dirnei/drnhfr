---
title: 'Edict'
summary: 'Ein YAML-Vertrag, der ein Kommando genau einmal beschreibt — für die CLI und für die RCON-Konsole.'
role: 'Entwurf und Umsetzung'
period: 'PLATZHALTER: Zeitraum'
stack: ['YAML']
featured: true
order: 20
translationKey: 'edict'
links:
  docs: 'https://edict.leberkas.org/'
---

Eine Kommandozeile und eine Remote-Konsole sind dieselbe Sache mit zwei
Gesichtern: ein Name, ein paar Parameter, eine Antwort. Beschrieben werden
sie trotzdem zweimal — einmal im Argument-Parser, einmal im RCON-Handler —
und spätestens ab der zweiten Änderung laufen die beiden auseinander.

Edict dreht das um. Die Kommandos stehen in einer YAML-Datei, und zwar genau
einmal: wie sie heißen, welche Parameter sie nehmen, was sie zurückgeben.
Der Vertrag ist die Quelle, die Oberflächen sind Konsumenten — gleich ob
jemand das Kommando im Terminal tippt oder über RCON an einen Spielserver
schickt.
