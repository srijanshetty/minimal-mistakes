// Directory data for Jekyll-style posts: reproduce the
// `permalink: /:categories/:title/` scheme (where :title is the filename
// slug) and Jekyll's auto-excerpt (first paragraph) for posts without an
// explicit excerpt in front matter.

import { readFileSync } from 'node:fs';

import { render } from '../lib/markdown.mjs';
import { normalizeCategories } from '../lib/filters.mjs';

// YAML parsing turns `modified: 2018-05-15T22:23:44+05:30` into a JS Date,
// losing the UTC offset — but Ruby Liquid formatted these in their original
// zone. Recover the raw front matter string so the `date` filter can honour
// the offset.
function rawModified(inputPath) {
  try {
    const source = readFileSync(inputPath, 'utf8');
    const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const line = frontMatter && frontMatter[1].match(/^modified:[ \t]*(.*?)[ \t]*$/m);
    const value = line && line[1].replace(/^['"]|['"]$/g, '');
    return value ? value : null;
  } catch {
    return null;
  }
}

export default {
  eleventyComputed: {
    modified: (data) => rawModified(data.page.inputPath),
    permalink: (data) => {
      const parts = normalizeCategories(data.categories);
      return `/${[...parts, data.page.fileSlug].join('/')}/`;
    },
    excerpt: (data) => {
      // Note: Eleventy reports an empty string here when front matter has no
      // excerpt, so treat '' as absent.
      if (data.excerpt !== undefined && data.excerpt !== null && data.excerpt !== '') {
        return data.excerpt;
      }
      // Jekyll auto-excerpt: content up to the first blank line, rendered.
      const raw = (data.page.rawInput || '').replace(/^\s+/, '');
      if (!raw) return null;
      return render(raw.split('\n\n')[0]);
    },
  },
};
