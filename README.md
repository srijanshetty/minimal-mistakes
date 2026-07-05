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

`package.json` pins `markdown-it`/`js-yaml` exactly and carries a `resolutions` block (js-yaml, linkify-it, iso-639-1, picomatch, bcp-47, range-parser) because of the early-July 2026 npm supply-chain incident: compromised releases of the nodeca packages (js-yaml 3.15.0/4.3.0/5.x, markdown-it 14.3.0, linkify-it 5.0.2) were published on 2026-06-26 and 2026-07-01/02 and later quarantined. The pins hold every affected package at the last known-good, pre-incident version. `.yarnrc.yml` also sets `npmMinimalAgeGate: 7d` so freshly published versions are never picked up immediately. Before loosening any of these pins, check that the upstream advisories are resolved.
