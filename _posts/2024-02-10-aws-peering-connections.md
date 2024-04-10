---
layout: post
title: "Setting up AWS Peering Connections for Wazuh and ECS"
modified:
categories: technical
excerpt: "How to setup AWS Peering Connections for Wazuh and ECS in a secure manner"
tags: [technical, security, open source, wazuh, aws, ecs, peering, vpc, routing, tables]
image:
  feature:
comments: true
date: 2024-02-10T10:30:00-04:00
---
As I've written before Fuze is a security company as much as it is a finance and technology company. In addition to having a strong testing culture at Fuze, we also have a strong security culture by including security in the SLDC supply chain.<br/><br/>

<figure>
	<img src="/images/aws_ecs.png">
	<figcaption>AWS ECS</figcaption>
</figure>

At Fuze, we used AWS ECS to deploy our production infrastructure and CI/CD is run through GitHub Actions. The only difference between our development and production infrastructure is that for simplicity we run development on EC2 with TailScale to enforce strong ACL. No one has access to production without a break glass procedure. (We have two separate accounts for production and development to enforece strict security)

<figure>
	<img src="/images/wazuh.png">
	<figcaption>Wazuh</figcaption>
</figure>

Another core pillar of our infrastructure is self host as much as possible. We recently started using Wazuh as our open source SIEM, but it wasn't without challenges. Because Wazuh is hosted in a different VPC than our production hosts, they cannot communicate directly. With our development infrastructure this is easily mitigated by using TailScale connections but we have ensured that production is completely isolated for now. The easy solution is to run TailScale and get done with it, but for some reason Tailscale breaks code deploys to ECS with GitHub actions. (This is something that I intend to explore in the coming few months but after extensive tests, we were able to establish that the root cause is TailScale).<br/><br/>
One option would have been to use agent less monitoring on Wazuh but we did not want to use SSH private keys or passwords for connections because they are inherently security unless combined with key rotation and we prefer not to dabble with key rotation.<br/><br/>
In light of the above, and after a week or two of head scratching, I was finally able to come up with a solution of this conundrum - AWS Peering Connections.

<figure>
	<img src="/images/vpc_peering.png">
	<figcaption>AWS VPC Perring connections</figcaption>
</figure>

We decided to setup a peering connection from the prod vpc to the wazuh vpc. This looked straightforward in theory but didn't work because every documentation missed one vital step. Adding routing tables which missing in both the documentation of Wazuh and peering connection.

<figure>
	<img src="/images/route_tables.png">
	<figcaption>AWS VPC route tables</figcaption>
</figure>

After setting up the route table, our Wazuh server was successfully able to connect with the production instances and vice versa. This enabled the instances to send all telemetry and information about any security event that happened on the hosts.
