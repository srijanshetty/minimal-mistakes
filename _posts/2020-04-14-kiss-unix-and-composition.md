---
layout: post
title: KISS - UNIX and Composition
modified:
categories: technical
excerpt: UNIX way and KISS go hand in hand
tags: [unix, rule of composition, kiss, simple, httpie, fzf, fuzzy, python]
comments: true
date: 2020-04-14T14:51:36+05:30
---

As engineers, we go overboard with engineering. Consider a recent **bete noire** was the lack of a good API to get NAV
for mutual funds in India. [AMFI](https://www.amfiindia.com/), the association for mutual funds in India maintains a
text file containing all the NAVs at open [here](https://www.amfiindia.com/spages/NAVAll.txt). <br/><br/>
The first attempt I did to query the API was to write a python behemoth to which did a simple search after converting
the data into json, and is hosted [here](https://github.com/srijanshetty/amfitools).  Pleased with my prowess of python,
I decided to implement fuzzy-search as well. After spending a few minutes pondering the correct interface of the
commandline, I thought I should give bash a chance to solve the issue. [fzf](https://github.com/junegunn/fzf), is
already all over my zsh-fu and it seemed well versed to handle this task. All I needed was to massage the data returned
into something easily fed into **fzf**, after 10 minutes, I had the following:

```zsh
get-nav () {
        http https://www.amfiindia.com/spages/NAVAll.txt | cut -d';' -f4,5 | tr ';' '\t' | fzf
}
```

This zsh snippet makes use of [httpie](https://httpie.org/) to download the file, **cut and tr** to conver the output to
a format feedable to **fzf** and now I have generic fuzzy completion in a zsh one liner. Here's a demo of the same:

<figure>
	<img src="/images/nav.gif">
</figure>

The UNIX rule of composition and KISS have stood the test of time. It's easy to get overboard and reinvent the wheel
when you could create complex text munging in one liners of shell. 
