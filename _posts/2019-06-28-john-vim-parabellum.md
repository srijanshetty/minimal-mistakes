---
layout: post
title: John Vim - Parabellum
modified:
categories: technical
excerpt: Compling vim from source
tags: [vim, development, compile, install, js, go, vim8, vim8.1]
image:
  feature:
comments: true
date: 2019-06-28T09:21:32+05:30
---

I would be digressing but the parallels between John Wick and Vim are too many.
Both of them are fine craftsmen of their meteir, surgical and deliberate at every
step, at their prime all their actions are well thought of and are operatic. It's
not what they do, but how they accomplish their raison d'etre that makes them what
they are today.<br/><br/>
Vim8 was a big bang release unleashing a wealth of goodies to all us vim enthusiasts.
But trying the latest vim out was challenging, because I was circumscribe by my choice
of linux distribution. A PPA is definitely a way out of my quagmire, but I prefer not to
use a random PPA for the lack of trust. Vim8 was a dream that I forgot about until my
laptop crashed and I bought an OTC Ubuntu 18.04 laptop.<br/><br/>
8.1 is a minor release but I couldn't wait another laptop cycle to get my hands on. So,
I decided to chose the [red pill](https://en.wikipedia.org/wiki/Red_pill_and_blue_pill)
and compile vim from source.<br/><br/>
Theoretically compiling vim from source should be simple:<br/>

{% highlight bash %}
$ git clone https://github.com/vim && cd vim
$ ./configure
$ make && make install
{% endhighlight %}

But the devil is in the details. Here's the exact steps that one needs to follow:<br/><br/>

{% highlight bash %}
$ git clone https://github.com/vim && cd vim
$ ./configure \
--with-features=huge \
--enable-multibyte \
--enable-rubyinterp=yes \
--enable-python3interp=yes \
--with-python3-config-dir=/usr/lib/python3.6/config-3.6m-x86_64-linux-gnu/ \
--enable-perlinterp=yes \
--enable-luainterp=yes \
--enable-gui=gtk \
--enable-cscope \
--prefix=${local_bin} \
$ make && make install
{% endhighlight %}

Some salient points in this setup are:

1. I tried using pyenv's path for python3-config-dir, it does not work.
2. Python 2 and 3 cannot interop in ubuntu as explained
   [here](https://stackoverflow.com/questions/23023783/vim-compiled-with-python-support-but-cant-see-sys-version)

Hopefully, this helps a forlorn developer searching for the oasis.
