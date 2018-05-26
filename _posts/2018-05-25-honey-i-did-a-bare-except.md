---
layout: post
title: Honey, I Did a Bare Except
modified: 2018-05-25T11:10:19+05:30
categories: technical
excerpt: Don't even think about using bare excepts or exceptions in python
tags: [linux, signal, sigalrm, python, try, idiomatic, code, computers]
comments: true
date: 2018-05-25T11:10:19+05:30
---

So, what you might ask? In fact you might have seen this blasphemy time and time again:

{% highlight python %}
try:
    # Some code
except Exception as e:
    print(e)
{% endhighlight %}

Or this variation written by another apostate (me, a few days ago):

{% highlight python %}
try:
    # Some code
except:
    print(e)
{% endhighlight %}

While we may be blinded in the present, at some point your future-self will want to travel back in time
and smack you for your idiocy, like I wanted to, for this mea cupla.<br/><br/>
The fundamental issue with **bare excepts** as they're called in *idiomatic python* is, - as mentioned earlier -
these gremlins come back and bite you. <br/><br/>
While trying to automate file uploads from my laptop to a cloud storage, I had a rogue IO function which
once, stalled indefinitely. Since I was uploading multiple files in sequence, this would halt the entire
program; (yes, I could use threads but that discussion is best left for another day).
Since this was all wrapped up in a busy loop which watched for changes, I was okay with one off failures.
In an attempt to tame the function I decided to use *SIGALRM* and this is when my foolishness dawned upon
me.<br/><br/>

{% highlight python %}
import signal
import time

class ProcessTimeoutException(Exception):
    pass

def timeout():
    raise ProcessTimeoutException()

def db_call():
    try:
        time.sleep(100)
    except Exception as e:
        print("I'm going to eat the error")
        print(e)

def main():
    signal.signal(signal.SIGALRM, lambda x, y: timeout())

    signal.alarm(5)
    try:
        db_call()
    except ProcessTimeoutException as e:
        print('Never reaches')

if __name__ == "__main__":
    main()
{% endhighlight %}


Can you notice what's wrong with the above snippet? **db_call** ends up eating *all* exceptions, which renders
my timeout logic ineffective.<br/><br/>
The solution, you ask? Well, there's little that we can do without using *threads* or a *monitor process* which
kills this script when it notices there's no progress (the monitor in turn ascertain progress using the OS
or IPC flags).<br/><br/>
So, as a favour to your future self, kindly avoid going bare (with exceptions).
