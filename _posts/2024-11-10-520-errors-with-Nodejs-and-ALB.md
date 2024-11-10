---
layout: post
title: "A curious case of 520 errors with Nodejs and ALB"
modified:
categories: technical
excerpt: "This post is a deep dive on how we solved intermittent 520 errors with our Nodejs application behind an AWS
ALB"
tags: [technical, api, aws, alb, http, errors, node, express, javascript, typescript]
image:
  feature:
comments: true
date: 2024-11-10T00:30:00-04:00
---
Sometimes you need to get your hands dirty and go down the rabbit hole.<br/><br/>
This was exactly what we had to do when we saw intermittent 502 errors on our API stack.<br/><br/>

<figure>
	<img src="/images/502_errors.png">
	<figcaption>502 errors on AWS ALB</figcaption>
</figure>

The initial hypothesis was restarts at night, but the frequency of the errors was higher than the number of automated restarts. So to dig deeper we accessed the access logs of ALB (which are stored in gzip and add a minor inconvenience).<br/><br/>
The logs were inconclusive or I was unable to make sense of the access logs, so it was time for some old fashioned googling. After going through dead end after dead ends, we came across an [article](https://repost.aws/knowledge-center/elb-alb-troubleshoot-502-errors), two things stood out for me on the article:<br/><br/>

> If the **elb_status_code** is "502" and the **target_status_code** is "-", then your load balancer is the source of the HTTP 502 errors. If the **elb_status_code** is "502" and the **target_status_code** is "502", then your target is the source of the errors.

> The target receives the request and starts to process it, but closes the connection to the load balancer too early. This usually occurs when the duration of the keep-alive timeout for the target is shorter than the idle timeout value of the load balancer. Make sure that the duration of the keep-alive timeout is greater than the idle timeout value.

> Check the values for the request_processing_time, target_processing_time and response_processing_time fields.

With this knowledge the most likely culprit was express on nodejs having a shorter timeout than ALB On checking it was clear that express had a timeout of 5s which ALB had 60s.<br/><br/>
On updating ALB keepalives to 4s, the errors no longer appeared.<br/><br/>
This was a fun little problem that we chanced upon while setting up our API infrastructure which had us going into the weeds of Nodejs, express and ALB.<br/><br/>

