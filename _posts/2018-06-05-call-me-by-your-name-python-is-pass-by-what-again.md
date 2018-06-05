---
layout: post
title: "Call (Me) by (Your) Name: Python Is Pass by What Again?"
modified: 2018-06-05T10:14:37+05:30
categories: technical
excerpt: "Python is neither call-by-value nor call-by-reference"
tags: [python, call-by-value, call-by-reference, call-by-object, java, js, c, languages]
comments: true
date: 2018-06-05T10:14:37+05:30
---

Full disclosure, I haven't read the book or watched the film, but the name (pun intended)
gets across the point I want to make about python **names**. (Note how I use the term **names**
and not **variables** or **references**, which will strike a chord in a few minutes).<br/><br/>
On the C side of things, you have *call-by-value*, and on the Java/ECMAScript side of the world,
you have *call-by-reference*. But python, is sly, and while on the surface you'll think python is
*call-by-reference*, it's a different barnacled monstrosity. Python is what you might call,
*[call-by-name](https://jeffknupp.com/blog/2012/11/13/is-python-callbyvalue-or-callbyreference-neither/)*.<br/><br/>
Here's an innocuous piece of code, which for some inexplicable reason doesn't produce the expected
output:

{% highlight python %}
def mutate(ls):
    ls = []
    ls.append(1)

def main():
    arr = [1,2]
    mutate(arr)
    print(arr)

main()
{% endhighlight %}

Despite the code being synthetic, it underscores an important point. In this particular example,
the output on the console is **[1,2]** and not **[1]**. How on earth is that possible, you ask?
Well, the answer to this mystery lies in the fact that python is *call-by-name.*<br/><br/>
In the *call-by-name* model, a name (or a variable in common parlance) is bound to an object. In the *main*,
**arr** is bound to the object **[1,2]**. Initially in mutate, **ls** is bound to the same object **[1,2]**
- note, how we say bound to an object and not a reference to a memory location, unlike C/Java/ECMAscript
- but, on the very first line of *mutate*, we bind ls to a new object **[]**, and hence forth the binding
of **[1,2]** is hidden from *mutate*. Any changes to **ls** will not be reflected back to **arr** as they are bound
to different objects.<br/><br/>
While this might seem pedantic, and left to language purists. This erudite fact can manifest in hard to
find bugs. For example, the following code has a surprising output:

{% highlight python %}
def mutate(ls):
    if len(ls) < 5:
        ls.append(2)
    else:
        ls = []

    ls.append(6)

arr = [1,2,3,4]
mutate(arr)
print(arr)
mutate(arr)
print(arr)
{% endhighlight %}

The output of this code is as follows:

{% highlight bash %}
$ python test.py
[1, 2, 3, 4, 2, 6]
[1, 2, 3, 4, 2, 6]
{% endhighlight %}

The second conditional becomes a no-op as **arr** won't be mutated once it's length is greater than 5. Ipso facto,
*call-by-name* is evident right now, but in longer methods its to discern and impossible to debug.<br/><br/>
So, next time recall that python does call (me) by (your) name.

