---
layout: post
title: Custom DNS Using Pihole
modified:
categories: technical
excerpt: custom DNS routes on pihole
tags: [privacy, dns, pihole, ad blocking, routes]
image:
  feature:
comments: true
date: 2020-07-18T14:23:15+05:30
---

I finally managed to setup custom DNS routes at my home server (a repurposed laptop with a bust screen, a post for
another day).<br/><br/>
I installed [pihole](https://pi-hole.net) on my local server and was struggling with setting up custom
routes for my local router, and some AWS and GCP boxes that I run. My first attempt was modifying
`/etc/pihole/local.list` with the following values:

```text
0.0.0.1 test.lan
```

This configuration worked, until pihole updated gravity database and `/etc/pihole/local.list` was cleaned up.<br/><br/>
After searching the rabbit hole of the internet, I was stuck with the epiphany of modifying `dnsmasq` to add the
entries. The following configuration did the trick:<br/><br/>

```text
address=/test.lan/0.0.0.1
```

My only pet-peeve is the default behaviour of browsers like firefox and chrome to interpret `.lan` entries as search
queries instead of domain names.
