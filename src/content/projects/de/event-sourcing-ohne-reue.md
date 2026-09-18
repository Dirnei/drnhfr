---
title: 'Event Sourcing ohne Reue'
summary: 'Ein Aggregat, 40 Millionen Events, und was ich beim zweiten Anlauf anders gemacht habe.'
role: 'Architektur und Umsetzung'
period: '2024 – 2026'
stack: ['.NET', 'Akka.NET', 'PostgreSQL']
featured: true
order: 10
translationKey: 'event-sourcing'
links:
  repo: 'https://github.com/Dirnei/drnhfr'
---

Das erste Modell hat funktioniert, bis die Projektionen länger brauchten
als das Fachteam Geduld hatte. Der zweite Anlauf hat die Aggregatgrenzen
verschoben, statt die Datenbank schneller zu machen.
