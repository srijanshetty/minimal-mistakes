---
layout: post
title: "Safely Storing GPG Keys"
modified: Sat May 23 17:24:35 IST 2015
categories: technical
excerpt: An easy way to store GPG Keys
tags: [blackbox, encryption, security, GPG]
image:
  feature:
date: Sat May 23 16:59:33 IST 2015
comments: true
---

> TL;DR: The next few paragraphs are mindless rants on the chicken-egg safety problem,
any sane person - you I presume - is better off not reading them and directly going to
[here](#encryption)

I'm very paranoid when it comes to managing private information like GPG Keys, SSH Keys, and
other sensitive information. (What I call private information is essentially arbitrary, I tend to
use the thumb rule that any kind of key, its meta-data and other information that I wouldn't want
people reading is private). At the same time, I'm also paranoid of my beloved computer crashing on
me - I know, the thought itself is terrifying but a harsh reality that we need to face. A very nice
quote which is vaguely relevant to this topic by Leslie Lamport:

> You know you have a distributed system when the crash of a computer you’ve never
heard of stops you from getting any work done.

After a lot of soul searching -- on Google lasting for 10 minutes, I found
**[blackbox](https://github.com/StackExchange/blackbox)**, a set of git hooks used by the holy
monks of StackExchange to encrypt all data using GPG Keys before adding it version control.
I suddenly felt complete, I was in bliss; I created a git repo, loaded it with all the
private information I wanted and pushed it to git (a private git hosting service and not
GitHub, just for an extra bit of security). I thought that I was done for life, and then
it suddenly struck me, the problem of encryption is essentially a chicken-egg problem. I
still needed a way to secure my GPG Keys and make copies.<br><br>
Detested, I went in for another round of soul searching and now I just AES256 encrypt my GPG Keys,
Base64 encode it (to make them look all nice and clean) and store them in LastPass. (Still stuck in
the chicken-egg problem). The steps have bee illustrated below for the curious.<br><br>

## Encryption

{% highlight bash %}

# copy all the relevant information
$ cp ~/.gnupg/pubring.gpg gpgkeys/
$ cp ~/.gnupg/secring.gpg gpgkeys/
$ cp ~/.gnupg/trustdb.gpg gpgkeys/

# or, instead of backing up trustdb ..
$ gpg --export-ownertrust > gpgkeys/srijanshetty-ownertrust-gpg.txt

# tar the folder
$ tar cvzf gpgkeys.tar.gz gpgkeys

# encrypt and base64 encode
$ openssl aes-256-cbc -in gpgkeys.tar.gz -out gpgkeys.tar.gz.enc -a

{%endhighlight%}

## Decryption

{% highlight bash %}

# decypt and base64 decode
$ openssl aes-256-cbc -d -in gpgkeys.tar.gz.enc -out gpgkeys.tar.gz -a

# untar
$ tar xvzf gpgkeys.tar.gz.enc

# copy back to gnupg folder
$ cp gpgkeys/*.gpg ~/.gnupg/

# or, if you exported the ownertrust
$ gpg --import-ownertrust srijanshetty-ownertrust-gpg.txt

{%endhighlight%}