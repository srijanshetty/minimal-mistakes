// Eleventy 3 configuration reproducing the previous Jekyll 4 build of this
// site as closely as possible (structure, permalinks and markup).

import * as sass from 'sass';

import markdown from './lib/markdown.mjs';
import { deferHighlight } from './lib/rouge.mjs';
import {
  dateFilter,
  dateToXmlschema,
  xmlEscape,
  cdataEscape,
  identity,
  toDate,
  normalizeCategories,
} from './lib/filters.mjs';


// The Jekyll baseline rendered all dates in UTC.
process.env.TZ = 'UTC';

// Jekyll's ascending post order: date, then source path.
function jekyllCompare(a, b) {
  const dateDiff = a.date - b.date;
  if (dateDiff !== 0) return dateDiff;
  return a.inputPath < b.inputPath ? -1 : a.inputPath > b.inputPath ? 1 : 0;
}

// Shape a collection item like Jekyll's post drop (lazy where the value is
// only known at render time).
function jekyllPost(item) {
  return {
    get title() { return item.data.title; },
    get url() { return item.url; },
    get id() { return item.url.replace(/\/$/, ''); },
    get date() { return item.date; },
    get modified() { return item.data.modified; },
    get link() { return item.data.link; },
    get excerpt() { return item.data.excerpt; },
    get tags() { return item.data.tags; },
    get categories() { return item.data.categories; },
    get content() { return item.templateContent; },
  };
}

export default function (eleventyConfig) {
  // --- Content locations -------------------------------------------------
  eleventyConfig.setIncludesDirectory('_includes');
  eleventyConfig.setLayoutsDirectory('_layouts');

  // Jekyll processed .markdown files too.
  eleventyConfig.addTemplateFormats('markdown');
  eleventyConfig.addExtension('markdown', { key: 'md' });

  // feed.xml is a Liquid template.
  eleventyConfig.addTemplateFormats('xml');
  eleventyConfig.addExtension('xml', { key: 'liquid' });

  eleventyConfig.ignores.add('README.md');
  eleventyConfig.ignores.add('LICENSE');
  eleventyConfig.ignores.add('_sass/**');
  eleventyConfig.ignores.add('_templates/**');
  eleventyConfig.ignores.add('vendor/**');
  eleventyConfig.ignores.add('scripts/**');
  eleventyConfig.ignores.add('ssh/**');
  eleventyConfig.ignores.add('googlecb25530ac5881c68.html');

  // Some front matter uses Ruby-style date strings (e.g.
  // "Fri Jan  2 15:12:28 IST 2015") that Eleventy cannot parse natively.
  eleventyConfig.addDateParsing(function (dateValue) {
    if (typeof dateValue === 'string') {
      const parsed = toDate(dateValue);
      if (parsed) return parsed;
    }
  });

  // --- Markdown ------------------------------------------------------------
  eleventyConfig.setLibrary('md', markdown);

  // --- Liquid ----------------------------------------------------------
  eleventyConfig.setLiquidOptions({
    timezoneOffset: 0,
  });

  eleventyConfig.addLiquidFilter('date', dateFilter);
  eleventyConfig.addLiquidFilter('date_to_xmlschema', dateToXmlschema);
  eleventyConfig.addLiquidFilter('xml_escape', xmlEscape);
  eleventyConfig.addLiquidFilter('cdata_escape', cdataEscape);
  // Octopress leftovers that the Jekyll 4 build silently ignored.
  eleventyConfig.addLiquidFilter('strip_slash', identity);
  eleventyConfig.addLiquidFilter('to_xmlschema', identity);

  // {% highlight lang %}...{% endhighlight %} — Jekyll's rouge highlighter.
  eleventyConfig.addLiquidTag('highlight', (liquidEngine) => ({
    parse(tagToken, remainTokens) {
      this.lang = (tagToken.args || '').trim().split(/\s+/)[0] || 'text';
      this.templates = [];
      const stream = liquidEngine.parser.parseStream(remainTokens);
      stream
        .on('template', (template) => this.templates.push(template))
        .on('tag:endhighlight', () => stream.stop())
        .on('error', (error) => { throw error; })
        .on('end', () => { throw new Error('tag {% highlight %} not closed'); });
      stream.start();
    },
    *render(ctx) {
      const body = yield this.liquid.renderer.renderTemplates(this.templates, ctx);
      return deferHighlight(this.lang, body.toString());
    },
  }));

  // --- Collections -------------------------------------------------------
  const postsGlob = '_posts/**/*.{md,markdown}';

  eleventyConfig.addCollection('jekyllPosts', (api) => {
    const items = [...api.getFilteredByGlob(postsGlob)].sort(jekyllCompare);
    return items.map(jekyllPost).reverse();
  });

  // Jekyll's site.categories: keys in order of first appearance over
  // ascending posts; each value newest-first. Modelled as [name, posts]
  // pairs so the existing Liquid (`category | first`, junk first row and
  // all) renders identically.
  eleventyConfig.addCollection('jekyllCategories', (api) => {
    const items = [...api.getFilteredByGlob(postsGlob)].sort(jekyllCompare);
    const byCategory = new Map();
    for (const item of items) {
      for (const category of normalizeCategories(item.data.categories)) {
        if (!byCategory.has(category)) byCategory.set(category, []);
        byCategory.get(category).push(jekyllPost(item));
      }
    }
    return [...byCategory.entries()].map(([name, posts]) => [name, posts.reverse()]);
  });

  // --- Sass ---------------------------------------------------------------
  // Jekyll's sass converter also emitted assets/css/main.css.map.
  const sourceMaps = new Map();
  eleventyConfig.addTemplateFormats('scss');
  eleventyConfig.addExtension('scss', {
    outputFileExtension: 'css',
    useLayouts: false,
    compile(inputContent, inputPath) {
      if (inputPath.split('/').pop().startsWith('_')) return undefined;
      const result = sass.compileString(inputContent, {
        style: 'compressed',
        loadPaths: ['_sass', 'assets/css'],
        sourceMap: true,
        sourceMapIncludeSources: false,
        silenceDeprecations: ['slash-div', 'import', 'global-builtin', 'color-functions'],
      });
      const map = {
        ...result.sourceMap,
        file: 'main.css',
        sources: (result.sourceMap.sources || []).map((source) =>
          source.replace(/^file:\/\/.*?\/(_sass|assets\/css)\//, '$1/').replace(/^data:.*$/, 'main.scss')
        ),
      };
      sourceMaps.set('assets/css/main.css.map', JSON.stringify(map));
      return () => `${result.css}\n\n/*# sourceMappingURL=main.css.map */\n`;
    },
  });
  eleventyConfig.on('eleventy.after', async ({ dir }) => {
    const { writeFile } = await import('node:fs/promises');
    for (const [relative, contents] of sourceMaps) {
      await writeFile(`${dir.output}/${relative}`, contents);
    }
  });

  // --- Static files (mirrors what Jekyll copied verbatim) -----------------
  eleventyConfig.addPassthroughCopy('images');
  eleventyConfig.addPassthroughCopy('talks');
  eleventyConfig.addPassthroughCopy('assets/fonts');
  eleventyConfig.addPassthroughCopy('assets/js/plugins');
  eleventyConfig.addPassthroughCopy('assets/js/vendor');
  eleventyConfig.addPassthroughCopy('assets/js/scripts.min.js');
  eleventyConfig.addPassthroughCopy('favicon.ico');
  eleventyConfig.addPassthroughCopy('favicon.png');
  eleventyConfig.addPassthroughCopy('CNAME');
  eleventyConfig.addPassthroughCopy('keybase.txt');
  eleventyConfig.addPassthroughCopy('googlecb25530ac5881c68.html');
  // Jekyll copied this too (it was not in its exclude list), so keep the
  // output inventory identical.
  eleventyConfig.addPassthroughCopy('scripts/build-js.mjs');

  return {
    dir: {
      input: '.',
      output: '_site',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data',
    },
    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'liquid',
  };
}
