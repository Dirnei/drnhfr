---
title: Capture the Flag — Christian Dirnhofer
description: Five encrypted doors and the flags that open them.
heading: Capture the Flag
doorTitle: Locked door — Christian Dirnhofer
locked:
  command: $ cat door
  error: 'cat: door: encrypted (AES-256-GCM)'
  line: This door is still shut. If you have not started the game yet, type ctf in the terminal first. After that, the right flag opens the door with submit, and hint helps if you are stuck.
mobile: The game runs in the terminal, which only shows from tablet width up.
progress:
  label: doors open
  unknown: '?????'
download: Download
finishedIn: Your time
---

## Where it comes from

Capture the flag started as an outdoor game in which two teams try to bring
the other team's flag back to their own base. In IT security it became a
competition format. The best known competition has run at DEF CON in Las
Vegas since 1996.

Most CTFs today use the jeopardy format. There is a list of challenges,
sorted into categories such as web, cryptography, forensics or reverse
engineering. Solving a challenge turns up a flag, a string in a fixed
format, and that earns points. In the attack-defense format, every team runs
the same vulnerable services instead, patches its own and attacks the
others.

For beginners there are competitions like picoCTF, aimed at school and
university students. CTFtime keeps an overview of running CTFs and the teams
behind them.

## How I got into it

PLACEHOLDER: When and where I first heard of CTFs, what my first one was and
what got me hooked.

## Tools

If you have never played a CTF, you need surprisingly little. A browser is
enough for this game. For other CTFs these tools are a good start:

- The browser's **developer tools** (F12) and **view source** (Ctrl+U) show
  what a page really delivers, including what is not displayed.
- **CyberChef** is a web application that converts encodings such as base64
  or hex and can chain many steps one after another.
- **curl** sends HTTP requests from the command line and also shows the
  response headers.
- **strings** and **file** tell you what is inside an unknown file.
- **Wireshark** opens recordings of network traffic and takes them apart
  packet by packet.
- A **hex editor** shows the raw bytes of a file.
- An **ASCII table** turns numbers into characters and back.

## How this game works

Behind five doors are stories about things I built. Every door is
encrypted, and the flag is the key. The first flag is somewhere on every
page, every other one behind the door before it.

Flags look like `drnhfr{...}` and are entered in the terminal with
`submit`. `hint` gives you a nudge in the right direction, and `ctf` shows
how long you have been at it.
