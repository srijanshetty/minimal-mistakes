---
layout: post
title: How to Train Your Python - 2.7
modified:
categories: technical
excerpt: "Walking the dependency hell of python to install plottable jupyter"
tags: [python, jupyter, plot, matplotlib, error, dependency, pyenv, tkinter, pip, data]
image:
  feature:
comments: true
date: 2018-08-17T00:41:54+05:30
---

The travails of the noble warriors who've tried to walk the path of the dependency hell of python have been immortalized in the travelogues of the internet. From [mosaics](https://xkcd.com/1987/) ornamenting the holy shrines of [xkcd](https://xkcd.com/1987/), to gospels written in the blogosphere; we've been plagued with tales of valour. And yet, python like the heads of the hydra grows two more if you've managed to chop one off.<br/><br/>
Our hero, chose the path of pyenv - a recondite cult who claim to have conquered the versions of python. While all was the well in the land of pyenv's python-2.7.9, until one day when he had to tackle a new villan in town - data visualizations. His best bet was to use jupyter - no, ipython wasn't enough - and so he embarked on a perilous path. In his first attempt he used the incantation of:

{% highlight bash %}
$ pip install jupyter
{%endhighlight%}

Things worked well and a kernel appeared to fulfil his commands until asked to plot, when kernel came crashing down.

{% highlight bash %}
ModuleNotFoundError: No module named '_tkinter' #_ This comment preserves formatting in vim
{%endhighlight%}

The helpful folks from the land of stackoverflow suggested a spell to resusicate the kernel.

{% highlight bash %}
$ pip uninstall jupyter numpy pandas matplotlib
$ sudo apt-get install tk-dev
$ pip install jupyter numpy pandas matplotlib
{%endhighlight%}

And viola, and darkness took over and python-2.7.9. Scared and lonely in the world of the internet, our hero did the only logical thing.

{% highlight bash %}
$ pyenv uninstall 2.7.9
{%endhighlight%}

He took over the responsibility of the python world and anihilated it. Sometimes you have to let go of the past. Kill it if you have to. So he did, only to create a new one like the Oracle in Matrix. But this time he was determined, he went throught the valleys of medium, the hills of stackoverflow and the plains of github to learn of the one true spell.

{% highlight bash %}
$ pyenv install 2.7.9
$ pip install --upgrade pip
$ pip uninstall enum enum34
$ pip install enum34 --upgrade
$ pip install cryptography
$ pip install numpy
$ pip install pandas
$ pip install matplotlib
$ pip install jupyter
{%endhighlight%}

And in the moment he saw the reflection of the one true UNIX kernel. He had done it, he had vanquished data visualizations and walked the fiery dependency hell of python.
