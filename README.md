> GitHub Pages + Eleventy/Liquid + Cloudflare = Awesomeness.

# My Personal Website

This is the raw version of my website which is hosted [here](http://srijanshetty.in). The website is powered by [Minimal Mistakes Jekyll Theme](https://github.com/mmistakes/minimal-mistakes), ported from Jekyll/Octopress to [Eleventy](https://www.11ty.dev/) (byte-compatible output), with three major changes:

- **Automated Deploys**: Deploy to GitHub Pages with GitHub Actions, or manually by running `yarn deploy`
- **Category wise display of articles**: In addition to the timeline that *minimal-mistakes* provides, I've configured a page to display all the posts by categories.
- **Projects Page**: A display of all the creative talent in you.

## Instructions

The project uses [Yarn 4](https://yarnpkg.com/) via [Corepack](https://nodejs.org/api/corepack.html) (pinned in `package.json`'s `packageManager` field).

**Install**

    $ corepack enable   # once per machine
    $ yarn install

**Local Development**

    $ yarn serve

**Building the Site**

    $ yarn build

The site is generated into `_site/` (JS is bundled by terser, Sass compiled by dart-sass, pages rendered by Eleventy).

**Creating New Posts**

Add a Markdown file to `_posts/` named `YYYY-MM-DD-my-post-slug.md` with the usual front matter (`layout: post`, `title`, `categories`, `excerpt`, `tags`, ...). The permalink follows the Jekyll scheme `/:categories/:title/` where `:title` is the filename slug.

Code blocks (```` ```lang ```` fences or `{% highlight lang %}` tags) are highlighted with the Ruby [rouge](https://github.com/rouge-ruby/rouge) gem for pixel-identical output with the old Jekyll site; results are cached in `lib/rouge-cache.json` (committed). Ruby is optional: new/changed code blocks that miss the cache are highlighted with a pure-JS fallback (highlight.js mapped onto the rouge CSS classes), so posts can be authored from a web editor with zero local toolchain — the colors are approximate. To upgrade them to exact rouge output, build once on a machine with `ruby` and `gem install rouge -v 3.30.0`; the refreshed cache gets committed with the post.

**Creating New Pages**

Add `some-page.md` (or `some-page/index.md`) at the repository root with `layout: page` front matter.

**Deploying to Server**

    $ yarn deploy

Both `yarn deploy` and the GitHub Actions workflow publish the built `_site/` to the `master` branch of [srijanshetty.github.io](https://github.com/srijanshetty/srijanshetty.github.io), which is the repository that actually serves srijanshetty.in. The workflow needs a `PAGES_DEPLOY_TOKEN` Actions secret: a fine-grained PAT with Contents read/write on that repository.

## Dependencies

- Node (yarn 4 via corepack)
    - @11ty/eleventy
    - markdown-it (+ anchor, footnote)
    - sass
    - terser
    - gh-pages
- Ruby (optional, only to refresh the exact-rouge syntax-highlighting cache; highlight.js covers cache misses)
    - rouge

### Security note on pinned versions

`package.json` pins `markdown-it`/`js-yaml` exactly and carries a `resolutions` block (js-yaml, linkify-it, iso-639-1, picomatch, bcp-47, range-parser) because of the early-July 2026 npm supply-chain incident: compromised releases of the nodeca packages (js-yaml 3.15.0/4.3.0/5.x, markdown-it 14.3.0, linkify-it 5.0.2) were published on 2026-06-26 and 2026-07-01/02 and later quarantined. The pins originally held every affected package at the last known-good, pre-incident version; in October 2026 they were raised to markdown-it 14.3.3, js-yaml 4.3.2 and linkify-it 5.0.2 (plus Eleventy 3.1.7, which drops gray-matter/js-yaml 3 and chokidar 3) for DoS CVE fixes, after diffing each tarball against the previous pin (no install scripts, no new dependencies, no network/process access). The resolutions block also pins patched liquidjs, brace-expansion, source-map-js, tar and undici. The one remaining audit finding, braces ≤3.0.3 (GHSA-vfj7-8cjw-p6xm, no fixed release yet), is only reached via gh-pages' own glob patterns at deploy time. `.yarnrc.yml` also sets `npmMinimalAgeGate: 7d` so freshly published versions are never picked up immediately. Before loosening any of these pins, check that the upstream advisories are resolved.
