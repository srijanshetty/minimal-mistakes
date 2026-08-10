# srijanshetty.in over SSH

A terminal version of the website, served over SSH with
[charmbracelet/wish](https://github.com/charmbracelet/wish). It reads the same
`_posts/` markdown the Eleventy build uses, so the SSH site and the web site
are always the same content:

```console
$ ssh srijanshetty.in -p 2222
```

- Browsable, fuzzy-filterable list of all posts (`/` to filter)
- Posts rendered as rich terminal markdown (glamour), Jekyll/Liquid
  `{% highlight %}` blocks converted to fenced code
- Every post shows its canonical web URL
- Content is re-synced from git on an interval, and re-read from disk, so a
  `git push` to the site repo shows up on the SSH site automatically

## Running

```console
$ cd ssh
$ go build -o ssh-site .
$ ./ssh-site
```

The server finds the site checkout by walking up from the working directory
until it sees `_posts/`. Configuration is via environment variables:

| Variable        | Default                     | Purpose                             |
| --------------- | --------------------------- | ----------------------------------- |
| `SSH_HOST`      | `0.0.0.0`                   | Listen address                      |
| `SSH_PORT`      | `2222`                      | Listen port                         |
| `SITE_DIR`      | auto-detected               | Path to the site git checkout       |
| `SITE_URL`      | `https://srijanshetty.in`   | Base URL for canonical post links   |
| `SYNC_INTERVAL` | `5m`                        | `git pull` + reload cadence (`0` disables) |
| `HOST_KEY_PATH` | `<SITE_DIR>/ssh/.data/host_ed25519` | SSH host key (generated on first run) |

Sessions are anonymous and read-only: any username/key is accepted, and the
only thing a client can do is browse the rendered content.

## Deploying (systemd)

```ini
# /etc/systemd/system/ssh-site.service
[Unit]
Description=srijanshetty.in over SSH
After=network.target

[Service]
User=www-data
WorkingDirectory=/srv/minimal-mistakes
ExecStart=/srv/minimal-mistakes/ssh/ssh-site
Environment=SSH_PORT=2222
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

`/srv/minimal-mistakes` should be a clone of this repository; the service
pulls it every `SYNC_INTERVAL` to stay in sync with the published site.

## Note on dependency pins

`github.com/charmbracelet/ssh` is pinned to the pre-`charm.land` pseudo-version
that `wish v1.4.7` itself requires. Newer tags of that module declare the
`charm.land/ssh` path and cannot be mixed with the `github.com/...` imports —
don't `go get -u` it blindly.
