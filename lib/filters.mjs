// Jekyll Liquid filter shims, matching what the Jekyll 4 build produced.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Handles the date formats present in this site's front matter, including
// Ruby-style strings such as "Mon Sept 10 15:02:35 IST 2019" (which Ruby's
// Time.parse accepted).
export function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value * 1000);
  if (typeof value !== 'string') return null;
  const str = value.trim();
  if (str === '') return null;
  if (str === 'now' || str === 'today') return new Date();

  const native = new Date(str);
  if (!Number.isNaN(native.getTime())) return native;

  // e.g. "Mon Sept 10 15:02:35 IST 2019"
  const ruby = str.match(
    /^[A-Za-z]{3,4}\s+([A-Za-z]{3,5})\.?\s+(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+([A-Z]{2,4})\s+(\d{4})$/
  );
  if (ruby) {
    const monthName = ruby[1].slice(0, 3).toLowerCase();
    const month = MONTHS.findIndex((m) => m.slice(0, 3).toLowerCase() === monthName);
    if (month !== -1) {
      // Ruby's Time.parse ignored these zone abbreviations (IST et al) and
      // read the wall clock in the site timezone (UTC); match that.
      return new Date(Date.UTC(
        Number(ruby[7]), month, Number(ruby[2]),
        Number(ruby[3]), Number(ruby[4]), Number(ruby[5])
      ));
    }
  }
  return null;
}

function pad(num, len = 2, ch = '0') {
  return String(num).padStart(len, ch);
}

// Minimal Ruby-compatible strftime (UTC), covering the formats this site
// uses plus common directives.
export function strftime(date, format) {
  return format.replace(/%(.)/g, (match, dir) => {
    switch (dir) {
      case 'Y': return String(date.getUTCFullYear());
      case 'y': return pad(date.getUTCFullYear() % 100);
      case 'm': return pad(date.getUTCMonth() + 1);
      case 'd': return pad(date.getUTCDate());
      case 'e': return pad(date.getUTCDate(), 2, ' ');
      case 'B': return MONTHS[date.getUTCMonth()];
      case 'b':
      case 'h': return MONTHS[date.getUTCMonth()].slice(0, 3);
      case 'A': return DAYS[date.getUTCDay()];
      case 'a': return DAYS[date.getUTCDay()].slice(0, 3);
      case 'H': return pad(date.getUTCHours());
      case 'I': return pad(date.getUTCHours() % 12 || 12);
      case 'M': return pad(date.getUTCMinutes());
      case 'S': return pad(date.getUTCSeconds());
      case 'p': return date.getUTCHours() < 12 ? 'AM' : 'PM';
      case 'j': {
        const start = Date.UTC(date.getUTCFullYear(), 0, 0);
        return pad(Math.floor((date.getTime() - start) / 86400000), 3);
      }
      case 'z': return '+0000';
      case 's': return String(Math.floor(date.getTime() / 1000));
      case '%': return '%';
      default: return match;
    }
  });
}

// Ruby's Liquid `date` filter formats Time values in their own zone. Front
// matter timestamps are kept as strings (see eleventy.config.mjs), so honour
// an explicit UTC offset when one is present.
function offsetMinutesOf(str) {
  const iso = str.match(/(?:Z|([+-])(\d{2}):?(\d{2}))\s*$/);
  if (iso) {
    if (!iso[1]) return 0;
    const sign = iso[1] === '-' ? -1 : 1;
    return sign * (Number(iso[2]) * 60 + Number(iso[3]));
  }
  return 0;
}

// Liquid's `date` filter: format when parseable, otherwise return the input
// unchanged (Ruby Liquid behaviour).
export function dateFilter(value, format) {
  if (value instanceof Date && value.jekyllHidden) return '';
  const date = toDate(value);
  if (!date || typeof format !== 'string' || format === '') return value;
  const offset = typeof value === 'string' ? offsetMinutesOf(value) : 0;
  return strftime(new Date(date.getTime() + offset * 60000), format);
}

// Jekyll's date_to_xmlschema (site timezone is UTC).
export function dateToXmlschema(value) {
  if (value instanceof Date && value.jekyllHidden) return '';
  const date = toDate(value);
  if (!date) return value;
  return `${strftime(date, '%Y-%m-%dT%H:%M:%S')}+00:00`;
}

// Jekyll's xml_escape (Ruby's `encode(xml: :attr)`).
export function xmlEscape(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Jekyll's cdata_escape.
export function cdataEscape(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/<!\[CDATA\[/g, '&lt;![CDATA[')
    .replace(/\]\]>/g, ']]&gt;');
}

// Octopress-era filters that were NOT defined in the Jekyll 4 build; Liquid
// silently ignored them (lax filter mode), so they behave as identity here.
export function identity(value) {
  return value;
}

// Eleventy dedupes/merges `tags` in the data cascade, but Jekyll passed the
// front matter list through verbatim (duplicates and trailing empties
// included, e.g. for the keywords meta tag). Recover the raw list.
import { readFileSync } from 'node:fs';

const rawTagsCache = new Map();
export function rawFrontMatterTags(inputPath) {
  if (!inputPath) return null;
  if (rawTagsCache.has(inputPath)) return rawTagsCache.get(inputPath);
  let result = null;
  try {
    const source = readFileSync(inputPath, 'utf8');
    const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const line = frontMatter && frontMatter[1].match(/^tags:[ \t]*\[(.*)\][ \t]*$/m);
    if (line) {
      result = line[1].split(',').map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''));
      // Ruby's YAML ignores a trailing comma; drop trailing empties.
      while (result.length && result[result.length - 1] === '') result.pop();
    }
  } catch {
    result = null;
  }
  rawTagsCache.set(inputPath, result);
  return result;
}

// Jekyll `categories` front matter: nil, a string, or a list.
export function normalizeCategories(categories) {
  if (!categories) return [];
  if (Array.isArray(categories)) return categories.filter(Boolean);
  return String(categories).split(/[\s/]+/).filter(Boolean);
}
