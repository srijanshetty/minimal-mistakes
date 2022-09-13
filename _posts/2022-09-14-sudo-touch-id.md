---
layout: post
title: Using TouchId for sudo in Mac OSX
modified:
categories: technical
excerpt: "Using TouchId for sudo in Mac OSX"
tags: [sudo, linux, mac, osx, touchId, cli, commands]
image:
  feature:
comments: true
date: 2022-09-14T00:41:54+05:30
---

This one is short, I wanted to use TouchId for sudo in Mac OSX.

{% highlight bash %}
# Edit pam.d
sudo vi /etc/pam.d/sudo

# Add the following as the first line
auth sufficient pam_tid.so
{%endhighlight%}

Works like a charm.
