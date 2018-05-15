---
layout: post
title: "Zombie Children Eating Memory"
modified:
categories: technical
excerpt: If you're not careful, your children can turn into zombies and eat your server
tags: [linux, python, psutil. os, zombie, orphan, process, memory, subprocess, child, wait, pid]
image:
  feature:
comments: true
date: 2018-05-15T10:58:38+05:30
---

Children have issues, especially when you try to kill them incorrectly and they come back as
zombies - just in case, I'm talking about process children in linux (don't arrest me please).<br/><br/>
Here's a snippet of code from a personal project:

{% highlight python %}
try:
    os.kill(child_pid, signal.SIGTERM)
    return True
except Exception as e:
    print(e)
{% endhighlight %}

Can you notice what's wrong with the above snippet? (Apart from the horrid error handling,
and the fact that I've ignored that the children must have async-signal-safe signal handlers
present.)<br/><br/>
You'll be leaving zombies all over the OS!<br/><br/>
It took me a while to figure out the (mostly) correct way to handle killing your own (process')
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

Let me explain what's going on here. The first *terminate* sends a **SIGTERM** to the child and then we
do a blocking 45 seconds wait on the child process in order to reap it. If all goes according to plan,
we would have successfully killed the process. But if the powers that be conspire, we might have to bring out
the big guns with **SIGKILL**.<br/><br/>
The second **SIGKILL** is where things get interesting, all process accept **SIGKILL** and shold terminate
in an ideal worldbut they still might remain as zombies - those beautiful adolescent teen years.
The second wait with a shorter interval tries reaps such processes. (You could ideally keep the timeout at 0,
which will convert it to a non blocking call.)<br/><br/>
At this point if the zombies don't die, your only option is to wait for the apocalypse. Or you could
nuke the parent and hope the zombies don't become orphan zombies. (Yikes)
