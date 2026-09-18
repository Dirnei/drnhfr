---
title: 'Split-Brain Is Not an Edge Case'
description: 'Why two healthy cluster halves are the real failure mode — and which single setting actually controls it.'
date: 2026-09-02
tags: ['akka.net', 'distributed-systems']
project: en/event-sourcing-without-regret
translationKey: 'split-brain'
---

Most of the cluster incidents I have debugged were not outages at all.
They were **two perfectly healthy halves**, each one convinced it was
the only member left standing.

## The Problem

It only takes a seven-second network hiccup. The failure detector trips,
each side of the partition forms a quorum from its own point of view,
and from that moment on you have two singletons happily writing to the
same downstream projection — neither one aware the other exists.

```hocon
split-brain-resolver {
  active-strategy = keep-majority
  stable-after = 20s
}
```

> A timeout is not a diagnosis.

`stable-after` is the lever that actually matters here, and it is
almost always left at whatever the template shipped with. Set it too
low and any outlier GC pause looks identical to a real partition, so
the resolver fires on nodes that were never actually gone — they were
just slow. Set it too high and a genuine split lingers long enough for
both halves to do real damage before anyone downgrades to a minority.
The number is not a tuning knob you pick once; it has to be derived
from your actual pause-time tail, not from the sample config.
