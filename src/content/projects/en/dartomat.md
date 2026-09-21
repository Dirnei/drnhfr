---
title: 'Dartomat'
summary: 'A self-built dart machine, growing since 2013, today with online multiplayer and your own game modes.'
role: 'Idea, hardware and software'
period: '2013–present'
stack: ['Arduino', 'ESP32', 'Raspberry Pi', 'Akka.NET', 'React']
featured: true
order: 5
translationKey: 'dartomat'
links:
  demo: 'https://cloud.dartomat.com'
---

In 2013 I took a cheap dartboard apart and read it out with an Arduino, just to
understand how it works. Since I figured that out it has escalated.

Over the years and a great many iterations it kept getting better along with my
own experience. A single Arduino hanging off a Windows PC turned into UWP on a
Raspberry with Windows IoT. After that an ESP32 with MQTT, until today it is a
Raspberry Pi HAT of its own, with a real-time processor that talks to Linux over
I2C.

Today the machine hangs online in an Akka.NET cluster so you can play with
friends over the internet. The project is not finished even so.
