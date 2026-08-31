---
layout: post
title: "The Shapes of AI Code"
modified:
categories: technical
excerpt: "How to think about writing code with AI"
tags: [technical, ai, llms, agents]
image:
  feature:
comments: true
date: 2026-08-29T00:30:00-04:00
---

In the last six months, I have realized that I have three modes of writing code with AI:

### Pristine Core:
This is the critical section of the code. When I ask AI to make changes (in auto mode), I know which parts of the codebase will be touched and what the shape of the final output will be.<br/><br/>
The sessions are usually long with multiple prompts till the code is in a shape I like, followed by adversial reviews and a lot of E2E testing (we have setup an extensive E2E testing harness which makes life easy for us) which continues in the same session till E2E tests pass. The agent drives the E2E test, monitors the result and ensures that the tests behave as expected.

### Slop Shell:
This is code in the same repo as the critical section, but it's slop that surrounds the core - E2E testing, custom debuggers, custom harnesses, one-off scripts and tools.<br/><br/>
Since this code doesn't run in production and doesn't impact the critical section boundary, I let the AI do it's thing and I don't care about what the code is doing here.

### Side Stuff:
Nothing critical here, so AI breaks all hell lose.<br/><br/>
I don't see the code, I just care about the outcome and if it succeeds in getting it across the line.<br/><br/>
My usual workflow has been defining the test cases first and then letting the AI fit the code to match the test cases.<br/><br/>
This seems like a pragmatic approach which allows enough bandwidth to go crazy with AI without going on an all out rampage with business critical code.
