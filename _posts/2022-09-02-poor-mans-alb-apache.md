---
layout: post
title: Poor Man's ALB - Apache
modified:
categories: technical
excerpt: "Using apache as a poor man's ALB - you gotta do what you gotta do"
tags: [apache, shell, devops, alb, aws, infrastructure]
image:
  feature:
comments: true
date: 2022-09-02T00:41:54+05:30
---

One complicated aspect of SEO is hosting your blog on the same domain as the rest of the site. This is arguably very
simple on AWS via ALB which allows sublocation routing, but it became a nightmare when we had to move our resources
awayt from AWS once we had to shutdown our startups and keep the blog churning content.<br/><br/>
Wordpress is a lingua franca for most content online, but the way it handles URLs internally is aggregious. My first
instinct was to host wordpress via nginx, using `proxy_pass` and `SSL termination` at `nginx`. But wordpress decided to
act like a brashful teenager. Finally I caved and hosted wordpress with `apache` on a `/blog` subdomain here [allround
blog](https://allround.club/blog).<br/><br/>
The second part of the problem was running `next.js` on the same host on the `/` path. Apache has `ProxyPass`, but my
first attempt wasn't very succesful and after some researching (sic) on the internet, this was the final solution that
worked.

{% highlight apache %}
ProxyPass /blog !
Alias /blog /path/to/wordpress

<Directory /path/to/wordpress>
    Options FollowSymLinks
    AllowOverride Limit Options FileInfo
    DirectoryIndex index.php
    Order allow,deny
    Allow from all
</Directory>
<Directory /path/to/wordpress/wp-content>
    Options FollowSymLinks
    Order allow,deny
    Allow from all
</Directory>

ProxyPass 		/ http://localhost:3001/
ProxyPassReverse 	/ http://localhost:3001/
ProxyPreserveHost on
LogLevel warn
{%endhighlight%}

The trick was `ProxyPass /blog !` which ensured that we can use apache for sublocation routing. On port 3001, `next.js`
was running `supervisor` (my goto solution for running apps on a box).
