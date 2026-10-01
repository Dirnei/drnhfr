---
title: 'E3DC.NET'
summary: 'A .NET library for the E3DC RSCP protocol, to read the data of the S10 home battery system locally.'
role: 'Author and maintainer'
---

E3DC.NET speaks RSCP, the binary protocol an E3DC S10 uses to hand out its
data on the local network. That gets you solar output, battery level, grid
import and house consumption straight from the device, without going through
the E3DC portal.

I have an S10 myself and wanted the data for my own dashboard
and for automations. There already was a .NET client, but it was not what I
wanted.

The foundation is Akka.Streams. The connection to the battery is a stream that
reconnects on its own after a drop and handles backpressure. If streams are not
your thing, you can still work with plain async/await or through channels. A
sample dashboard comes with it as a Docker container.
