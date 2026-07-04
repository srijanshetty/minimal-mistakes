> GitHub Pages + Eleventy/Liquid + Cloudflare = Awesomeness.

# My Personal Website

This is the raw version of my website which is hosted [here](http://srijanshetty.in). The website is powered by [Minimal Mistakes Jekyll Theme](https://github.com/mmistakes/minimal-mistakes), ported from Jekyll/Octopress to [Eleventy](https://www.11ty.dev/) (byte-compatible output), with three major changes:

- **Automated Deploys**: Deploy to GitHub Pages with GitHub Actions, or manually by running `npm run deploy`
- **Category wise display of articles**: In addition to the timeline that *minimal-mistakes* provides, I've configured a page to display all the posts by categories.
- **Projects Page**: A display of all the creative talent in you.

## Instructions

**Install**

    $ npm install

**Local Development**

    $ npm run serve

**Building the Site**

    $ npm run build

The site is generated into `_site/` (JS is bundled by terser, Sass compiled by dart-sass, pages rendered by Eleventy).

**Creating New Posts**

Add a Markdown file to `_posts/` named `YYYY-MM-DD-my-post-slug.md` with the usual front matter (`layout: post`, `title`, `categories`, `excerpt`, `tags`, ...). The permalink follows the Jekyll scheme `/:categories/:title/` where `:title` is the filename slug.

Code blocks (```` ```lang ```` fences or `{% highlight lang %}` tags) are highlighted with the Ruby [rouge](https://github.com/rouge-ruby/rouge) gem for pixel-identical output with the old Jekyll site; results are cached in `lib/rouge-cache.json` (committed). New/changed code blocks need `ruby` with `gem install rouge -v 3.30.0` available at build time once, to refresh the cache — otherwise they fall back to un-highlighted code with a build warning.

**Creating New Pages**

Add `some-page.md` (or `some-page/index.md`) at the repository root with `layout: page` front matter.

**Deploying to Server**

    $ npm run deploy

## Dependencies

- Node (npm)
    - @11ty/eleventy
    - markdown-it (+ anchor, footnote)
    - sass
    - terser
    - gh-pages
- Ruby (optional, only to refresh the syntax-highlighting cache)
    - rouge
