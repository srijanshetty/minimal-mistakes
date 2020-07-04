---
layout: post
title: Shell tricks to manage a cluster
modified:
categories: technical
excerpt: use shell features to manage a cluster of servers with docker et al
tags: [zsh, bash, shell, management, ssh, tricks, docker, containers]
image:
  feature:
comments: true
date: 2020-07-04T18:48:51+05:30
---

There are complex solutions available for server management, some of you might even be on the *containerization train*.
Sometimes you just want to run a quick command on every server, it could be a one off to check `uptime` or a simple
check for `lockfiles`. Here's a simple script which runs a shell command on a list of servers.


```bash
#!/usr/bin/env bash

set -u

ACTION=${1:?"Must supply action"}
HOST=${2:?"Must supply host name"}

source ./scripts/lib.sh

# Expand host string
HOSTS="$(GET_HOSTS $HOST)"            # GET_HOSTS is a lists all hosts

# Command to SSH
SSH_COMMAND() {
    local ip="$(GET_IP $1)"           # GET_IP is maps hostname to IP
    ssh "${TARGET_USER}@${ip}" "$2"
}

# Run command for each host
declare -A results
for H in $HOSTS; do
    # Redirect output to a temp file, later redirect back to stdio
    temp=$(mktemp)
    exec &> ${temp}

    # Not the '&', this creates a background process.
    # We also source the env on the host,
    # as .bashrc and .bash_profile are finicky at times
    printf "\nRunning command %s %s \n" "${ACTION} ${H}"
    SSH_COMMAND "$H" "source ~/app/scripts/env.sh; ${ACTION}" & 

    # '$!' is the PID which maps to the correct temp file
    results[$!]=$temp
done

# Restore stdout and stderr
exec &> /dev/tty

# Wait for the jobs that were executed
for pid in "${!results[@]}"; do
    wait $pid
    cat "${results[$pid]}"
done
```

There's a lot to dissect in this little snippet. Let's get right to it.

- `set -u`:  Most bash guides will ask you to use `set -eEuo pipefail`, but you would not want to use that especially
  when you parallelize using background proccesses in bash. This would mean partial execution and we want to avoid that
  all costs. The only error that we care about is *undefined variables*, hence the *set -u*
- `GET HOSTS`: A simple function to generate a list of hosts that you want to run the command on.
- `exec &> ${temp} and exec &> /dev/tty`: This redirects the output temporarily and later resets it to the terminal.
- `results[$!]=$temp`: To keep track of which pid points to which output file.
- `for pid in "${!results[@]}"`: Traverse over every pid in the map and wait on it.

This simple scripts saves a lot of time especially when you're managing a cluster of servers.
