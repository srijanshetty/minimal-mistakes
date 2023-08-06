---
layout: post
title: "OARS, SQL Injections and Paper Backups"
modified:
categories: write-ups
excerpt: "OARS - thread dread of IITK and how paper backups are secure"
tags: [write-ups, technical, sql, injections, professors, iitk, kanpur, iit]
image:
  feature:
comments: true
date: 2023-08-01T10:30:00-04:00
---
OARS - Four letters that could fill any graduate of IIT Kanpur from 2009 to 2015 with abject horror.<br/><br/>
While presented as a system to register for courses for the next semester, it was a machine of widespread torture by crushing your hopes and your soul at the exact moment that they are the highest. The beauty of OARS was that it was universally hated by both students and professors, a common themes across most of IIT Kanpur.<br/><br/>
An apocryphal story states that OARS was cobbled together by a few undergraduates over a summer, and things turned for the worst when it gained sentience. Probably some reader might shed light on the real origin story of OARS.<br/><br/>
This story is not about the origins of OARs though, it's about how a close friend found out an SQL injection attack that gave them root access to OARS - I would have loved to take credit, but alas that would be a lie. The said friend had access to the academic records of every student on the campus, and since they were honour bound they never did anything more with it (or did they?).<br/><br/>
Professor Sanghi was the Dean of Academic Affairs and obviously knew about the shortcomings of OARS - he was also the professor who eventually slayed the demon of OARS to another demon, which I've heard doesn't give students cold sweats a day before registrations. When we approached him with the potential vulnerability, he responded with absolutely no change in expression - "That means that what I've been teaching in computer security has been useful to you lot. Also, having access doesn't really make much difference, we have paper records and emails are triggered on every change. You're bound by the honour code, so the best you can do is swoop around but that you could do anyway because some of the data on the network in unencrypted."<br/><br/>
We were dumbfounded, for not only did he sign us to a honour contract at the spot, but also told us that we could have a field day because data on our network was unencrypted. It was akin to giving kids unrestricted access to the candy shop.<br/><br/>
This was a defining moment because you have to admit that sometimes plain old paper records are a secure format and all our fancy dandy security might fall short. A professor arm twisted young students to be bound by an imaginary honor contract, and three all we did was use our access to build an API so that students could search OARS in a better manner and get to know the top 10 students in each year.
