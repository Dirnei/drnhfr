---
title: Das Terminal — Christian Dirnhofer
description: Wie man das Terminal dieser Seite benutzt, mit cat, curl und base64.
heading: Das Terminal
---

Unten auf jeder Seite, direkt über dem Footer, sitzt ein kleines Terminal mit
einer Eingabezeile. Es ist kein echtes Linux, sondern ein Stück JavaScript, das
ein paar Befehle so nachbaut, wie man sie aus einer Shell kennt. Kaputt machen
kann man damit nichts. Es erscheint erst ab Tablet-Breite, auf dem Handy gibt
es das Terminal nicht.

## Bedienung

Ein Klick auf die Eingabezeile, `/` oder Strg+K irgendwo auf der Seite setzt
den Cursor hinein. Dann tippt man einen Befehl und drückt Enter. Die Ausgabe
klappt darüber auf, und Esc klappt sie wieder zu.

`help` listet alle Befehle. Mit den Pfeiltasten hoch und runter holt man
frühere Eingaben zurück, und Tab ergänzt einen angefangenen Befehl oder
Seitennamen. Die Ausgaben sind auf Englisch, so wie in einer echten Shell.

In den Beispielen unten steht vor dem Befehl ein `$`. Den tippt man nicht mit,
er markiert nur, was Eingabe ist. Was darunter steht, ist die Ausgabe.

## cat

`cat` heißt eigentlich concatenate und gibt den Inhalt von Dateien aus. Hier
sind die Seiten der Website die Dateien, und `cat` zeigt die kurze
Beschreibung einer Seite. `ls` listet, was es gibt.

```
$ cat projekte
Übersicht laufender und abgeschlossener Projekte.
```

Ohne Namen, aber mit einer Pipe davor (siehe unten), gibt `cat` einfach weiter,
was hereinkommt.

## curl

Ein echtes `curl` schickt eine HTTP-Anfrage an eine Adresse und druckt die
Antwort, mit `-I` nur die Header. Ein Browser darf das aus einer Seite heraus
nicht für beliebige Adressen, deshalb öffnet `curl` hier eine öffentliche
Adresse in einem neuen Tab. Das kann eine ganze URL sein oder ein Pfad auf
dieser Seite.

```
$ curl /de/projekte/
--> https://www.dirnhofer.net/de/projekte/  (new tab)
```

`wget` macht dasselbe.

## base64

Base64 schreibt beliebige Bytes mit nur 64 Zeichen: Groß- und
Kleinbuchstaben, Ziffern, `+` und `/`. So übersteht Binäres jeden Weg, der
eigentlich nur Text kennt, etwa eine E-Mail. Verschlüsselt ist dabei nichts,
jeder kann es zurückrechnen. Am Ende stehen oft ein oder zwei `=`, die
füllen nur auf.

Ohne Option kodiert `base64` den Text dahinter:

```
$ base64 hallo
aGFsbG8=
```

Mit `-d` dekodiert es wieder:

```
$ base64 -d aGFsbG8=
hallo
```

## Pipes

Ein `|` zwischen zwei Befehlen schickt die Ausgabe des ersten als Eingabe in
den zweiten. `echo` gibt einfach aus, was dahinter steht, und zusammen mit
einer Pipe ist das der übliche Weg, etwas zu dekodieren:

```
$ echo aGFsbG8= | base64 -d
hallo
```

Das geht auch über mehrere Stufen hintereinander, und andere Befehle wie
`grep` oder `sort` lesen ebenso, was aus einer Pipe kommt.
