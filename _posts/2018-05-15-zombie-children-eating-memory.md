---
layout: post
title: "Zombie Children Eating Memory"
modified:
categories: technical
excerpt: If you're not careful, you children can turn into zombies and eat your server
tags: [linux, python, psutil. os, zombie, orphan, process, memory, subprocess, child, wait, pid]
image:
  feature:
comments: true
date: 2018-05-15T10:58:38+05:30
---

Children have issues, especially when you try to kill them incorrectly and they come back as
zombies - just in case, I'm talking about process children in linux (don't arrest me please).

Here's a snipped of code that I was working for on a personal project:

{% highlight python %}
try:
    os.kill(child_pid, signal.SIGTERM)
    return True
except Exception as e:
    print(e)
{% endhighlight %}

Notice what's wrong with the above snippet? (Apart from the horrid error handling, and the fact that
I've ignored that the children have async-signal-safe signal handlers present)

You'll be leaving zombie children all over the OS!!

It took me a while to figure out the correct (mostly) way to handle killing your own (process')
children safely:

{% highlight python %}
os.kill(pid, signal.SIGTERM)

try:
    p = psutil.Process(pid)
    p.terminate()
    p.wait(timeout=45)
    msg = 'Wow. your children are really obedient'
except psutil.TimeoutExpired:
    # For a bad process this will ensure that we send it a sigkill
    p.send_signal(signal.SIGKILL)
    try:
        p.wait(timeout=10)
        msg = 'Close call, we need the big guns, but at least they're dead now'
    except psutil.TimeoutExpired:
        msg = 'Zombie children have escaped. I repeat zombie children have escaped'
{% endhighlight %}

Let me explain what's going on here. The first terminate sends a **SIGTERM** to the child and then we
do a blocking 45s wait on the child process. If all is well, we have successfully killed the child.
If not, we'll have to bring out the big guns of** SIGKILL**.

The second **SIGKILL** is where things get interesting, some process accept **SIGKILL** and terminate but
they still remain as zombies. Just like adolescent teens. The second wait with a shorter interval
reaps those processes. (You could ideally keep the timeout at 0, which will convert it to a non
blocking call as well.)

At this point if the zombies don't die, your only option is to wait for the apocalypse. Or you could
nuke the parent and hope the zombies don't become orphan zombies.
