---
title: 'E3DC.NET'
summary: 'Eine .NET-Bibliothek für das RSCP-Protokoll von E3DC, um die Daten vom S10 Hauskraftwerk lokal abzufragen.'
role: 'Autor und Maintainer'
period: '2026 – heute'
stack: ['.NET', 'C#', 'Akka.NET']
featured: true
order: 50
links:
  repo: 'https://github.com/Leberkas-org/e3dc.net'
  docs: 'https://e3dc.leberkas.org/'
---

E3DC.NET spricht RSCP, das binäre Protokoll, über das ein E3DC S10 im lokalen
Netzwerk seine Daten rausgibt. Damit bekommt man PV-Leistung, Batteriestand,
Netzbezug und Hausverbrauch direkt vom Gerät, ohne Umweg über das Portal von
E3DC.

Ich hab selbst ein S10 und wollte die Daten für mein eigenes
Dashboard und für Automatisierungen haben. Einen .NET-Client gab es schon, der
war aber nicht das, was ich wollte.

Das Fundament ist Akka.Streams. Die Verbindung zum Speicher ist ein Stream, der
sich nach einem Abbruch selbst wieder verbindet und mit Backpressure umgehen
kann. Wer mit Streams nichts am Hut hat, kann trotzdem ganz normal mit
async/await oder über Channels arbeiten. Ein Beispiel-Dashboard gibt es als
Docker-Container dazu.
