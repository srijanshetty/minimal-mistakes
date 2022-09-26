---
layout: post
title: Handling CORS with cloudflare workers
modified:
categories: technical
excerpt: "Using Cloudflare workers as a REST server"
tags: [cloudflare, workers, jamstack, rest, cors, options, get, post, http, redis, node.js]
image:
  feature:
comments: true
date: 2022-09-26T00:41:54+05:30
---

I've been experimenting with various `new age` deployment and `JAMStack` solutions out there.
Since I've been using cloudflare for over 8 years (as of writing this post), I thought I'll give it a shot as a cheap
caching server replacing `Redis + Node.js`. Writing the `REST` server to handle requests using `Cloudflare Workers`
and `KV` is fairly straightforward:

{% highlight javascript %}
addEventListener("fetch", event => {
    if (event.request.method === "GET") {
        event.respondWith(getRequest(event.request));
    } else {
        event.respondWith(postRequest(event.request));
    }
})

function constructResponse(data) {
    return new Response(
        JSON.stringify(data, null, 2),
        {
            headers: {
                'content-type': 'application/json;charset=UTF-8',
            }
        }
    );
}

// Handle get requests
async function getRequest(request) {
    const { searchParams } = new URL(request.url);

    // Some logic to generate data

    return constructResponse(data);
}

// Handle post requests
async function postRequest(request) {
    // Some logic to generate data

    return constructResponse(data);
}
{%endhighlight%}

And as expected, `httpie` was able to perfectly `POST` and `GET` the data. But as soon as I shot up the devconsole to
make a request, I was faced with the dreaded `CORS` error. Usually solving CORS is fairly straightforward, but this
error was unique as the request wasn't really throwing any CORS error, it was just returning an empty
response.<br/><br/>
The way to solve this problem is twofold:
1. Add a handler for `OPTIONS`.
2. Return `Access-Control-Allow-Origin`, on all requests.

{% highlight javascript %}
function constructResponse(data, request) {
    return new Response(
        JSON.stringify(data, null, 2),
        {
            headers: {
                'content-type': 'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin': request.headers.get("Origin"),
            }
        }
    );
}

// Handle option requests
async function optionRequest(request) {
    console.log(request);
    return new Response(
        '',
        {
            headers: {
                'content-type': 'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin': request.headers.get("Origin"),
                'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            }
        }
    );
}
{%endhighlight%}

Don't think I was able to find a solution on the internet, but knowing how `CORS` is handled helped.
