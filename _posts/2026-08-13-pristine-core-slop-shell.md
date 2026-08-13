---
layout: post
title: "Pristine Core. Slop Shell"
modified:
categories: technical
excerpt: "Embrace the slop - only if it protects your core."
tags: [technical, ai, llms, agents]
image:
  feature:
comments: true
date: 2026-08-13T00:30:00-04:00
---

To set context, I'm the co-founder CTO of a company with a flat hierarchy of 25 engineers reporting to me (everyone runs their own show so it's not that difficult). 

I've never felt more productive in my life. 

And before all the engineers wince at a co-founder writing slop code, let me preface that I don't mess around with the core feature set, I work in the periphery where I have always loved working - platforms, automations, devops.

> My core KPI in 2025 was how to make the engineers more productive.
> My core KPI this year is how to make the engineers (using agents) more productive.

In 2026, this translates to building safeguards and perimeters which provide fast feedback and prevent the system from collapsing under the new 'velocity'.

> My mantra is pristine core. Slop shell.

Having agents at my disposal to build to build slop guard-rails gives me glorious purpose.

The things I've been able to build to ensure that we keep shipping without falling under the weight of agent velocity feels unreal - custom audit logging agents, perf agents, PII scanners, debuggers, E2E testers - you think it and we have some kind of implementation of the same.

I want to give some examples of agents which were not possible when writing code wasn't effective cheap, and I would never spend time in writing throwaway code.

#### Stress Test Agent
Everyone loves stress tests, but setting up the environment was very tedious back in the day. You needed to know k6, string together multiple calls for workflows and the infrastructure might not be provisioned properly to stress tested. Now it's merely asking an agent to write a parallel workload using REST APIs - all done within an hour.

#### PII Scanner
Just the other day, I wanted to ensure that there is no PII in our slack as an internal policy. Instead of hooking up a DLP service, I asked Claude to spin up a loop which used Slack MCP to check for PII in every channel that I'm present. This took a few minutes from thought to implementation.

#### Perf and Audit Agent
If you aduit your logs every month for PII, perf issues or anomalies, you can now do it realtime. Engineers can try their best at trying to audit logs and figure out anamolies, but they will never be great at it due to the monotonous nature of the work. So, I wrote a small loop read only signoz access and now Claude monitors the logs and suggests improvements for slow queries, PIIs and other class of issues with PRs and git blame attribution.

> The core code is always free from slop. It's the safeguards, auditors, debuggers, E2E tests that has slop and this is okay, because they don't run in production.

I'm not advocating writing slop, I'm advocating writing a class of code which was very expensive to write 6 months ago, but is essentially free today. A class of code which makes sure that the actual code keeps running at a pace which is inline with business expectation and a class of code you would be foolish not to use to make you a better programmer.
