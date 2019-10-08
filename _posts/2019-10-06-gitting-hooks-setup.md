---
layout: post
title: Gitting Hooks setups
modified:
categories:
excerpt: Perfect workflow for setting up git hooks
tags: [git, devops, tooling, hooks, commit, lint, node, npm]
image:
  feature:
comments: true
date: 2019-10-06T23:31:27+05:30
---

I've always loved the concept of `git hooks`, but it's setup has always troubled me as being `snowflaky`.
Sharing hooks across a development team was awkward and there was no [Ubiquitous
Language](https://www.martinfowler.com/bliki/UbiquitousLanguage.html).<br/><br/>
After struggling with bespoke solutions in the lingua franca of bash,
I rolled my own solutions which has been lost (fortunately) to Father Time.
My Eureka moment happened last week when I came across [commitlint](https://commitlint.js.org/#/guides-local-setup)
and the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) spec 
(an admirable way to manage releases and make commits more readable).
In trying to integrate Conventional Commits to my [website](https://github.com/srijanshetty/minimal-mistakes), 
I've come across a solution that works perfect for me.<br/><br/>
The current setup uses `husky` as a dev-dependency in `package.json` which sets up a `commit-msg` hook as follows:

{% highlight bash %}
$ npm init
$ npm install --save-dev husky
{% endhighlight %}

{% highlight json %}
{
    "...": "other parameters",
    "commitlint": {
      "extends": [ "@commitlint/config-conventional" ],
      "rules": {
          "type-enum": [1, "always", [ "feat", "fix", "docs", "build", "refactor", "revert", "post" ] ]
      }
    },
    "husky": {
      "hooks": {
          "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
      }
    }
}
{% endhighlight %}

The great part of this setup is that it ties everything into a single `package.json` file. 
The npm eco-system is a cesspool when it comes to security but it does make developer tooling a breeze.
The community converging on using a single `package.json` is a god-send, over the alternative of a bunch of .rc files spewed all across; adding `git hooks` is the natural evolution to the puzzle.<br/><br/>
It's great how sometimes your problems solve themselves if you let them be for years.
