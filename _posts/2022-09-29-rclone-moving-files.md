---
layout: post
title: Moving 4 TB across cloud storage providers for free
modified:
categories: hacks
excerpt: "rclone - the swiss army knife of cloud storage"
tags: [linux, mac, osx, cli, rclone, drive, dropbox, google, storage, aws, storage]
image:
  feature:
comments: true
date: 2022-09-29T00:41:54+05:30
---

Ever run into the problem of maxing out your cloud capacity in one provider (most possibly on the free tier) and being
left with no other solution but to upgrade because you can't move your data?<br/><br/>
Or got into the solution of migrating data from a work account to a backup?<br/><br/>
I got into somewhat of a fix lately as I had to transfer over 4TB of data from AWS to a Google Drive account (with
infinite free storage, courtesty my alma mater). What makes matters worse is that I have only 4TB of metered usuage in
my broadband network, post which I'm downgraded on speed (and we obviously don't like slow networks).<br/><br/>
The final solution that I came up with didn't drain by broadband quota and didn't cost me in time or money, which I
think is a great outcome.<br/><br/>
The trick is to run the transfer on a VPS solution like [digitalocean](https://digitalocean.com), with `tmux` to resume
sessions. This allows you to use the bandwidth of the VPS providers and not your home network!<br/><br/>
Let's get everything setup:

1. Get a free digital ocean account using this [link](https://m.do.co/c/c7d0b328194e)
2. Spin up a basic Ubuntu instance on Digital Ocean.
3. Install [rclone](https://rclone.org/install/) using the following command.

{% highlight bash %}
$ sudo -v ; curl https://rclone.org/install.sh | sudo bash
{%endhighlight%}

`rclone` is the swiss army knife of transferring files between different service providers, unlike `scp` it does allow
you to transfer between two different hosts and doesn't have a `one local node` policy. With rclone setup, the rest is
easy.<br/><br/>
Install the cloud providers that you want to transfer files between.

{% highlight bash %}
$ rclone config

Name                 Type
====                 ====
dropbox              dropbox
s3                   s3

e) Edit existing remote
n) New remote
d) Delete remote
r) Rename remote
c) Copy remote
s) Set configuration password
q) Quit config
e/n/d/r/c/s/q>
{%endhighlight%}

Once you have the source and destination providers setup, the transfer is easy.

{% highlight bash %}
$ rclone copy s3:bucket.name/ dropbox:backup/ --ignore-existing
{%endhighlight%}

Running with `--ignore-existing` makes the process idempotent in case the SSH connection fails. I prefer running the
command in a `tmux` session so that I can reattach the session in a few days when the transfer might have
completed.<br/><br/>
Until the next post!
