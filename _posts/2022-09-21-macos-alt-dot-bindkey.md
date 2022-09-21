---
layout: post
title: ZSH bindkey in MacOSX for Cmd
modified:
categories: hacks
excerpt: "Binding insert-last-word in ZSH to 'Cmd + .' in Mac OSX"
tags: [zsh, bindkey, cmd, linux, mac, osx, cli, commands, bash, iTerm]
image:
  feature:
comments: true
date: 2022-09-21T00:41:54+05:30
---

Another short one but very useful trick in my moving from Linux to Mac series.<br/><br/>
One of my most used shortcuts in the terminal is `Alt + .`, which I adapted from my `bash` workflow to my `zsh` workflow
when I started using zsh. It basically inserts the last word from the previous command. This turns out to be very handy
and I use it multiple times a day.<br/><br/>
There is no out of the box way to accomplish this on Mac, unless you use `iTerm`.<br/><br/>
The first step is opening up iTerm preferences and navigate to the keybindings section.

<figure>
    <a href="/images/mac_zsh_keybinding_1.png"><img src="/images/mac_zsh_keybinding_1.png"></a>
    <figcaption>iTerm > Preferences > Keybindings</figcaption>
</figure>

Once in the keybindings section:
1. Click `+`.
2. In the dialogue select any Keyboard Shortcut you want. I used `Cmd + .`.
3. Select `Action` as `Send Escape Sequence`.
4. Add `altdot` as the `Escape Sequence`.
5. Hit `Save` and we're done!

<figure>
    <a href="/images/mac_zsh_keybinding_2.png"><img src="/images/mac_zsh_keybinding_2.png"></a>
    <figcaption>Add Keyboard Shorcut with Send Escape Sequence</figcaption>
</figure>


The next step is configuring zsh keybindings to process the `Escape sequence`.
{% highlight zsh %}
# somewhere in your zsh config
bindkey "^[altdot" insert-last-word
{%endhighlight%}

And viola, now the keybindings work. This process works `mutatis mundis` for other keybindings that you want to import
from your workflow in bash/zsh from linux.
