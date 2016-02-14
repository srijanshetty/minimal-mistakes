---
layout: post
title: Installing Scikit and Numpy in Ubuntu
categories: technical
excerpt: a consolidated set of steps for installing scipy on Ubuntu
tags: [ shell, data, scipy, python, numpy, ubuntu, elementary, freya, 14.04]
comments: true
date: 2016-02-14T21:15:35+05:30
---

After sifting through multiple stack-overflow answers and blog posts, here is a list of consolidated steps to install scipy stack on Ubuntu 14.04. (I'm currently using Elementary OS Freya which is a derivative of Ubuntu 14.04).

{% highlight bash %}
$ sudo apt-get install python-pip python-setuptools python-dev
$ sudo apt-get install libjpeg-dev zlib1g-dev # Pillow build dependencies
$ sudo apt-get install libblas-dev libatlas-dev liblapack-dev gfortran # Scipy dependencies
$ sudo apt-get install g++ # Sciki-lean dependency
$ sudo apt-get install cython # Scikit-image dependency
$ sudo apt-get install libenchant-dev # PyEnchant dependency
$ pip install scipy numpy (use pyenv, not sudo)
{% endhighlight %}
