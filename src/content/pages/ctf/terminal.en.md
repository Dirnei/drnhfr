---
title: The terminal — Christian Dirnhofer
description: How to use this site's terminal, with cat, curl and base64.
heading: The terminal
---

At the bottom of every page, just above the footer, sits a small terminal
with an input line. It is not a real Linux, it is a piece of JavaScript that
rebuilds a few commands the way you know them from a shell. You cannot break
anything with it. It only shows from tablet width up, there is no terminal on
a phone.

## Using it

Click the input line, or press `/` or Ctrl+K anywhere on the page, and the
cursor is in it. Type a command and press Enter. The output unfolds above the
line, and Esc folds it away again.

`help` lists every command. The up and down arrow keys bring back earlier
input, and Tab completes a command or page name you have started typing.

In the examples below the command has a `$` in front of it. You do not type
it, it only marks what is input. What follows below it is the output.

## cat

`cat` is short for concatenate and prints the contents of files. Here the
pages of the site are the files, and `cat` shows a page's short description.
`ls` lists what there is.

```
$ cat projects
Overview of past and current projects.
```

Without a name but with a pipe in front of it (see below), `cat` simply
passes on whatever comes in.

## curl

A real `curl` sends an HTTP request to an address and prints the response,
with `-I` only the headers. A browser will not let a page do that for any
address it likes, so `curl` here opens a public address in a new tab. That
can be a full URL or a path on this site.

```
$ curl /en/projects/
--> https://www.dirnhofer.net/en/projects/  (new tab)
```

`wget` does the same.

## base64

Base64 writes any bytes using only 64 characters: upper and lower case
letters, digits, `+` and `/`. That way binary data survives any channel that
only knows text, an email for instance. Nothing is encrypted, anyone can
turn it back. There are often one or two `=` at the end, which are only
padding.

Without an option, `base64` encodes the text after it:

```
$ base64 hallo
aGFsbG8=
```

With `-d` it decodes it again:

```
$ base64 -d aGFsbG8=
hallo
```

## Pipes

A `|` between two commands sends the output of the first into the second as
input. `echo` prints whatever follows it, and together with a pipe that is
the usual way to decode something:

```
$ echo aGFsbG8= | base64 -d
hallo
```

It also works over several stages in a row, and other commands such as
`grep` or `sort` read what comes out of a pipe as well.
