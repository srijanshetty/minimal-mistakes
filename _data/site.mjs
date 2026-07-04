// Site-wide configuration, mirroring the values _config.yml provided to
// Jekyll. Collections-backed properties (site.posts, site.categories,
// site.related_posts) are attached per-page in _data/eleventyComputed.mjs.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

function loadYaml(relative) {
  return yaml.load(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8'));
}

export default {
  title: 'Srijan R. Shetty',
  locale: 'en_US',
  url: '//srijanshetty.in',

  permalink: '/:categories/:title/',

  owner: {
    name: 'Srijan R. Shetty',
    avatar: 'bio-photo.jpg',
    bio: '',
    email: 'srijan.shetty+code@gmail.com',
    twitter: 'srijanshetty',
    github: 'srijanshetty',
    'disqus-shortname': 'srijanshetty',
    google: {
      analytics: 'UA-54744194-1',
      verify: null,
      'ad-client': null,
      'ad-slot': null,
    },
    'bing-verify': null,
    linkedin: 'srijanshetty',
  },

  time: new Date(),

  data: {
    authors: loadYaml('./authors.yml'),
    navigation: loadYaml('./navigation.yml'),
  },
};
