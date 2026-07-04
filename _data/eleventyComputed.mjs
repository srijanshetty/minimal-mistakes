// Per-page `site` object: the static configuration from _data/site.mjs plus
// the collection-backed properties Jekyll exposed (site.posts,
// site.categories, site.related_posts).

import site from './site.mjs';
import { rawFrontMatterTags } from '../lib/filters.mjs';

const PAGE_FRONT_MATTER_KEYS = [
  'title',
  'excerpt',
  'image',
  'share',
  'comments',
  'author',
  'link',
  'modified',
  'categories',
];

export default {
  // Jekyll exposed front matter under `page.*` (page.title, page.excerpt,
  // page.image.feature, ...). Eleventy's `page` object only carries
  // url/date/inputPath/..., so decorate it with the keys the templates use.
  jekyllPageShim: (data) => {
    const page = data.page;
    if (page && typeof page === 'object') {
      for (const key of PAGE_FRONT_MATTER_KEYS) {
        try {
          page[key] = data[key];
        } catch {
          // page may be a probe object during Eleventy's dependency pass
        }
      }
      try {
        // Eleventy dedupes `tags`; Jekyll kept the list verbatim.
        page.tags = rawFrontMatterTags(page.inputPath) ?? data.tags;
        // Jekyll pages have no date unless front matter sets one (Eleventy
        // falls back to file dates). Eleventy needs a real Date internally,
        // so mark it and let the date filters render it as empty.
        if (
          !data.date &&
          !String(page.inputPath || '').includes('/_posts/') &&
          page.date instanceof Date &&
          !page.date.jekyllHidden
        ) {
          const hidden = new Date(page.date.getTime());
          hidden.jekyllHidden = true;
          page.date = hidden;
        }
      } catch {
        // ignore probe objects
      }
    }
    return true;
  },

  site: (data) => {
    let posts = [];
    let categories = [];
    try {
      posts = data.collections.jekyllPosts || [];
      categories = data.collections.jekyllCategories || [];
    } catch {
      // Eleventy's computed-data dependency pass probes this function with a
      // proxy; fall back to empty values there.
    }

    let related = [];
    try {
      // Jekyll's related_posts (without LSI): the most recent 10 posts,
      // excluding the current document. Only posts have related posts.
      if (String(data.page.inputPath || '').includes('/_posts/')) {
        related = posts.filter((post) => post.url !== data.page.url).slice(0, 10);
      }
    } catch {
      related = [];
    }

    return {
      ...site,
      posts,
      categories,
      related_posts: related,
    };
  },
};
