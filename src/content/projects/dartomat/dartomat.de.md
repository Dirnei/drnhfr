---
title: 'Dartomat'
summary: 'Ein selbst gebauter Dartautomat, seit 2013 gewachsen, heute mit Online-Multiplayer und eigenen Spielmodi.'
role: 'Idee, Hardware und Software'
period: '2013 – heute'
stack: ['Arduino', 'ESP32', 'Raspberry Pi', 'Akka.NET', 'React']
featured: true
order: 5
links:
  demo: 'https://cloud.dartomat.com'
---

2013 habe ich eine billige Dartscheibe auseinandergenommen und mit einem Arduino
ausgelesen, um zu verstehen, wie das funktioniert. Seitdem ich das herausfand, ist
es eskaliert.

Über die Jahre und sehr viele Iterationen ist es mit meinen gewachsenen Erfahrungen
immer weiter verbessert worden. Aus nur einem Arduino, der an einem Windows-PC hing,
wurde dann UWP am Raspberry mit Windows IoT. Danach mal ein ESP32 mit MQTT, bis es
jetzt eine Raspberry-Pi-HAT-Platine ist, mit eigenem Real-Time-Prozessor, der über
I2C mit Linux kommuniziert.

Heute hängt der Automat online im Akka.NET-Cluster, damit man mit Freunden über das
Internet spielen kann. Abgeschlossen ist das Projekt dennoch nicht.