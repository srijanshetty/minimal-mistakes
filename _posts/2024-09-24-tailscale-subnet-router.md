---
layout: post
title: "The missing guide to TailScale subnet routing in AWS"
modified:
categories: technical
excerpt: "a few things that the official reference misses"
tags: [technical, security, open source, aws, zero trust network, tailscale, mesh vpn, wireguard, routing]
image:
  feature:
comments: true
date: 2024-09-24T00:30:00-04:00
---
I'm a big fan of TailScale, and we extensively use it at [Fuze](https://fuze.finance) as well.<br/><br/>
While most of the guides of TailScale are straightforward, I've found the section on subnet routers a bit obtuse or incomplete for the lack of a better word.<br/><br/>
So here's my guide on how to setup a subnet router which will allow you to access private IPs on an AWS subnet (or any subnet) directly from TailScale.

- You need to setup a jumpbox, this box has tailscale installed. Let's give it a SG called `tailscale-subnet-router`.
- Ensure that the jumpbox has the 'Source and Destination' checks disabled

```jsx
- In the Instances panel of the Amazon EC2 console find and select the EC2 instance you just created.
- Choose Actions, Networking, Change source/destination check.
- For Source/destination checking, select Stop.
- Choose Save. 
```

- Ensure that hosts you want to connect to have a SG which accepts `Inbound Connections` from `tailscale-subnet-router`.
- Now we add the configuration in our TailScale ACL policy, to allow a group `devops` to access it

```json
{
    "ipsets": {
       "ipset:subnet":  ["111.10.0.0/16"]
    },
    "grants": [
      {
        "src": ["group:devops"],
         "dst": [
            "ipset:subnet"
         ]
      }   
    ]
}
```

- As a final step, we need to allow our current host accept routes published by the subnet router

```bash
tailscale up --accept-routes
```

These steps should do the trick and you should be able to connect to subnet from your local machine now.

## References

- [Tailscale Subnet Router](https://tailscale.com/kb/1019/subnets)
- [Tailscale Subnet Router Technical Requirements](https://tailscale.com/kb/1021/install-aws#technical-requirements)
