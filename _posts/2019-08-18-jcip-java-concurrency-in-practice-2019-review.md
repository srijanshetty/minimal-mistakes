---
layout: post
title: JCIP - Java Concurrency in Practice 2019 Review
modified:
categories: technical
excerpt: Is JCIP relevant in 2019?
tags: [java, java13, java6, jcip, concurrency, scalable, review, book]
image:
  feature:
comments: true
date: 2019-08-18T17:50:38+05:30
---

As of writing, `Java 13` has a release candidate and JCIP still refers to `Java 6` as the latest and greatest of Java. It's no wonder that Java forums are replete with questions on the relevance of JCIP - full disclosure, I posed the same question when I emailed Heinz Kabutz. After spending 6 months with the books (you read that right, and this wasn't the only book I was reading), I've realized how wrong my Java programs have been. <br/><br/>
In the age of fast paced evolution of programming languages, most programming language books age badly. JCIP is not in that ilk, the fundamental point of contention in JCIP is writing highly scalable and correct concurrent code and not Java. JCIP excels in imparting a fundamental understanding of concurrency, and dissecting core issues a developer might face when architecting concurrent programs.<br/><br/>
Caveat emptor. It's a dense read, ideas are succinct and compact and rarely prolix. Which makes it easy to read and hard to grasp. There have been times wherein I've spent hours understanding the implication of concepts such as `Initialization safety`, `safe publication`, `happens-before relationships`; these concepts have inexorably changed my mental model of concurrent programming for the better.<br/><br/>
I would definitely urge serious Java programmers to try and work through JCIP, and maybe have an epiphany of their own.
