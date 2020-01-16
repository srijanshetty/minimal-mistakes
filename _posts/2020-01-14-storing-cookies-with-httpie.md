---
layout: post
title: Storing Cookies With Httpie
modified:
categories: 
excerpt: Automating session creation in httpie
tags: [httpie, REST, testing, cookies, auth, sessions, session, store, disk, docker]
image:
  feature:
comments: true
date: 2020-01-14T12:34:57+05:30
---

I'm trying a new series of posts with gist kind of content.<br/><br/>
I'm a huge fan of [httpie](https://httpie.org/), it has a natural syntax and covers more than 90% of the use-cases
required during the development of a REST service. Session support out of the box was a huge surprise, but at the same
time, it was a let-down as it did not relay back cookies in HTTP headers.<br/><br/>
After copy pasting *Set-Cookie* header in a session.json every time I pulled down docker image, the coder in me wanted
to automate the mundane. The following is the output of a few hours wasted, feel free to add it to your own shellrc.

```bash
# Use session file if present for http
function http() {
    if hash http &> /dev/null; then
        command http --session=./.session.json $@
    else
        echo "command is not installed"
    fi
}

# This function extracts cookie information from the headers of
# an httpie request and then stores it in a .session-file
function set-cookie() {
    setopt clobber

    # Extract bookie after login
    COOKIE=$(http "$@" --print=h | grep 'Cookie' | cut -d: -f2 | cut -c2-)
    echo "The cookie is: $COOKIE"

    # Create a session file using HERE DOC
    cat > .session.json <<- EOF
{
    "headers": {
        "Cookie": "${COOKIE}"
    }
}
EOF

    # Remove line endings
    sed -i 's/\r//g' .session.json
}
```

There are two pieces to the httpie sessions puzzle. The command **set-cookie** extracts the *Set-Cookie* header from the
request, stripes it of whitespaces and stores it down to a new *session.json* file. The *clobber* option will rewrite an
existing *.session.json* file if present. I've also created a new **http** function which uses a session file
always.<br/><br/>
My workflow now is to call set-cokkie to the authentication end-point which sets the session file. Followed by calls to
end-points which require authentication.
