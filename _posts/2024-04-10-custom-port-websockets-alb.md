---
layout: post
title: "Heath Checks on a Custom Port for Websockets with ALB"
modified:
categories: technical
excerpt: "How to setup health checks on a custom port for websockets with Application Load Balancer"
tags: [technical, aws, alb, websockets, health, checks, http, tcp, custom, port]
image:
  feature:
comments: true
date: 2024-04-09T10:23:00-04:00
---
This blog has been written because there wasn't any good comprehensive guide to run a websocket server using AWS Load Balancer where the health check runs on a different port.<br/><br/>
In theory (and practice) you can run health checks on the same port as your web socket server, but unfortunately ALB does not support native WS communications. In fact all communications are using HTTP 1.1 with your Origin Server.<br/><br/>
The websocket server at Fuze is a single binary which runs an express server for health checks. (There is an argument to be made that it isn't a true health check but we digress).<br/><br/>
This setup worked well for bare metal EC2 instances which we use in development, but our production servers which use ECS didn't play along. We had two choices:
- Change the code to run the health check on the same port as the web socket server. Which would be complicated as we would have to handle two different protocols on the same port and would require code changes.
- Figure out if ALB can be persuaded to perform health checks on a different port. Which from a cursory check felt not possible.

We chose the former because `Programmer Time is Expensive`.<br/><br/>
As mentioned above, most guides explicitly mentioned that this isn't possible. But while experimenting, we found an escape hatch.

<figure>
	<img src="/images/post-ws-stackexchange-question.png">
	<figcaption>Stack Exchange isn't of much help in this case</figcaption>
</figure>

For the uninitiated, the first step in attaching an origin server to ALB requires setting up `Target Group` with the port of the server.

<figure>
	<img src="/images/post-aws-target-group.png">
	<figcaption>Setting up a target group in AWS</figcaption>
</figure>

In the next step, where we setup the Health Check, we saw an undocumented feature of overriding the Health Check Port.

<figure>
	<img src="/images/post-aws-health-check.png">
	<figcaption>Override the health check port to the port of the express server</figcaption>
</figure>

And viola, we're all done.
