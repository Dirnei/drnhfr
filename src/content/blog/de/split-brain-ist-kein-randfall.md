---
title: 'Split-Brain ist kein Randfall'
description: 'Warum zwei gesunde Cluster-Hälften das eigentliche Problem sind — und welcher Konfigurationswert wirklich zählt.'
date: 2026-09-02
tags: ['akka.net', 'verteilte-systeme']
translationKey: 'split-brain'
---

Die meisten Cluster-Ausfälle, die ich gesehen habe, waren keine Ausfälle.
Es waren **zwei gesunde Hälften**, die beide überzeugt waren, die einzig
verbliebene zu sein.

## Das Problem

Ein Netzwerk-Hiccup von sieben Sekunden reicht. Der Failure Detector
schlägt an, beide Seiten bilden ein Quorum aus ihrer eigenen Sicht — und
ab dann schreiben zwei Singletons in dieselbe Projektion.

```hocon
split-brain-resolver {
  active-strategy = keep-majority
  stable-after = 20s
}
```

> Ein Timeout ist keine Diagnose.

Der Wert `stable-after` ist der eigentliche Hebel: zu klein, und jeder
GC-Pause-Ausreißer löst eine Neuwahl aus.
