---
title: Capture the Flag — Christian Dirnhofer
description: Fünf verschlüsselte Türen und die Flaggen, die sie öffnen.
heading: Capture the Flag
doorTitle: Verschlossene Tür — Christian Dirnhofer
locked:
  command: $ cat tuer
  error: 'cat: tuer: verschlüsselt (AES-256-GCM)'
  line: Diese Tür ist noch zu. Wer das Spiel noch nicht gestartet hat, tippt zuerst ctf ins Terminal. Danach öffnet die passende Flagge die Tür mit submit, und hint hilft weiter.
mobile: Das Spiel läuft im Terminal, und das gibt es erst ab Tablet-Breite.
progress:
  label: Türen offen
  unknown: '?????'
download: Herunterladen
finishedIn: Deine Zeit
---

## Woher das kommt

Capture the Flag ist ursprünglich ein Geländespiel, bei dem zwei Teams
versuchen, die Fahne des anderen ins eigene Lager zu holen. In der
IT-Sicherheit ist daraus ein Wettbewerbsformat geworden. Der bekannteste
Wettbewerb läuft seit 1996 auf der DEF CON in Las Vegas.

Die meisten CTFs sind heute im Jeopardy-Format. Es gibt eine Liste von
Aufgaben, sortiert nach Kategorien wie Web, Kryptografie, Forensik oder
Reverse Engineering. Wer eine Aufgabe löst, findet eine Flagge, also eine
Zeichenkette in einem festen Format, und bekommt dafür Punkte. Beim
Attack-Defense-Format betreibt dagegen jedes Team dieselben verwundbaren
Dienste, flickt die eigenen und greift die der anderen an.

Für den Einstieg gibt es Wettbewerbe wie picoCTF, die sich an Schüler und
Studenten richten. Eine Übersicht über laufende CTFs und die Teams dahinter
führt CTFtime.

## Wie ich dazu gekommen bin

PLATZHALTER: Wann und wo ich das erste Mal von CTFs gehört habe, was mein
erstes war und was mich daran gepackt hat.

## Werkzeuge

Wer noch nie ein CTF gespielt hat, kommt mit erstaunlich wenig aus. Für
dieses Spiel reicht ein Browser. Für andere CTFs sind diese Werkzeuge ein
guter Anfang:

- **Entwicklerwerkzeuge im Browser** (F12) und **Quelltext anzeigen**
  (Strg+U) zeigen, was eine Seite wirklich ausliefert, auch das, was nicht
  angezeigt wird.
- [**base64**](/de/ctf/terminal/#base64) kodiert Text als Base64 und
  dekodiert ihn wieder. Das Terminal dieser Seite hat den Befehl auch.
- [**curl**](/de/ctf/terminal/#curl) schickt HTTP-Anfragen von der
  Kommandozeile und zeigt auch die Header der Antwort. Das Terminal dieser
  Seite hat eine einfache Version davon.
- **strings** und **file** verraten, was in einer unbekannten Datei steckt,
  und [**cat**](/de/ctf/terminal/#cat) gibt ihren Inhalt aus.
- **Wireshark** öffnet Mitschnitte von Netzwerkverkehr und zerlegt sie in
  einzelne Pakete.
- Ein **Hex-Editor** zeigt die rohen Bytes einer Datei.
- Eine [**ASCII-Tabelle**](/de/ctf/ascii/) übersetzt Zahlen in Zeichen und zurück.

## So funktioniert dieses Spiel

Hinter fünf Türen stehen Geschichten über Dinge, die ich gebaut habe. Jede
Tür ist verschlüsselt, und die Flagge ist der Schlüssel. Die erste Flagge
steht irgendwo auf jeder Seite, jede weitere hinter der Tür davor.

Flaggen sehen aus wie `drnhfr{...}` und werden im Terminal mit `submit`
eingegeben. `hint` gibt einen Schubs in die richtige Richtung, und `ctf`
zeigt, wie lange du schon dabei bist.

Wer noch nie mit einem Terminal gearbeitet hat, findet unter
[Das Terminal](/de/ctf/terminal/) eine Anleitung zu `cat`, `curl` und
`base64`. Zum Nachschlagen von Zeichencodes gibt es die
[ASCII-Tabelle](/de/ctf/ascii/).
