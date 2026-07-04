// markdown-it configured to reproduce kramdown (GFM input, auto_ids,
// entity_output: as_char, rouge highlighter) output as closely as possible.

import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import footnote from 'markdown-it-footnote';
import htmlBlockNames from 'markdown-it/lib/common/html_blocks.mjs';
import { HTML_OPEN_CLOSE_TAG_RE } from 'markdown-it/lib/common/html_re.mjs';

import { fenceHtml, escapeHtml, resolveHighlightMarkers } from './rouge.mjs';

// kramdown's "basic" header id algorithm (auto_ids).
export function kramdownId(str) {
  let id = String(str)
    .replace(/^[^a-zA-Z]+/, '')
    .replace(/[^a-zA-Z0-9 -]/g, '')
    .replace(/ /g, '-')
    .toLowerCase();
  if (id === '') id = 'section';
  return id;
}

export const md = new MarkdownIt({
  html: true,
  xhtmlOut: true, // kramdown emits <br />, <hr />, <img ... />
  typographer: true, // smart quotes like kramdown's smart_quotes defaults
  breaks: false,
  linkify: false,
});

// ---------------------------------------------------------------------------
// CommonMark's HTML block "type 7" treats any standalone tag line as a block,
// but kramdown treats span-level elements (<img>, <a>, <span>, ...) as inline
// content that gets wrapped in <p>. Replace the html_block rule with one
// whose type-7 sequence ignores kramdown's span-level elements.
// ---------------------------------------------------------------------------

const KRAMDOWN_SPAN_ELEMENTS = [
  'a', 'abbr', 'acronym', 'b', 'big', 'bdo', 'br', 'button', 'cite', 'code',
  'del', 'dfn', 'em', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'option',
  'q', 'rb', 'rbc', 'rp', 'rt', 'rtc', 'ruby', 'samp', 'select', 'small',
  'span', 'strong', 'sub', 'sup', 'tt', 'u', 'var',
];

const HTML_SEQUENCES = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, true],
  [/^<!--/, /-->/, true],
  [/^<\?/, /\?>/, true],
  [/^<![A-Z]/, />/, true],
  [/^<!\[CDATA\[/, /\]\]>/, true],
  [new RegExp('^</?(' + htmlBlockNames.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true],
  [
    new RegExp(
      '^(?!</?(?:' + KRAMDOWN_SPAN_ELEMENTS.join('|') + ')[\\s/>])' +
        HTML_OPEN_CLOSE_TAG_RE.source.replace(/^\^/, '') + '\\s*$',
      'i'
    ),
    /^$/,
    false,
  ],
];

function kramdownHtmlBlock(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];

  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  if (!state.md.options.html) return false;
  if (state.src.charCodeAt(pos) !== 0x3c /* < */) return false;

  let lineText = state.src.slice(pos, max);

  let i = 0;
  for (; i < HTML_SEQUENCES.length; i++) {
    if (HTML_SEQUENCES[i][0].test(lineText)) break;
  }
  if (i === HTML_SEQUENCES.length) return false;

  if (silent) return HTML_SEQUENCES[i][2];

  let nextLine = startLine + 1;
  const endsOnBlankLine = HTML_SEQUENCES[i][1].test('');

  if (!HTML_SEQUENCES[i][1].test(lineText)) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) {
        if (endsOnBlankLine || !state.isEmpty(nextLine)) break;
      }
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      lineText = state.src.slice(pos, max);
      if (HTML_SEQUENCES[i][1].test(lineText)) {
        if (lineText.length !== 0) nextLine++;
        break;
      }
    }
  }

  state.line = nextLine;

  const token = state.push('html_block', '', 0);
  token.map = [startLine, nextLine];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);

  return true;
}

md.block.ruler.at('html_block', kramdownHtmlBlock, {
  alt: ['paragraph', 'reference', 'blockquote'],
});

// kramdown only applies these typographic replacements: --- (mdash),
// -- (ndash), ... (hellip). Disable markdown-it's wider set ((c), (tm),
// +-, punctuation collapsing, ...) and roll our own.
md.disable('replacements');
md.core.ruler.after('inline', 'kramdown_typographic', (state) => {
  for (const token of state.tokens) {
    if (token.type !== 'inline') continue;
    for (const child of token.children) {
      if (child.type !== 'text') continue;
      if (!/(---?|\.\.\.)/.test(child.content)) continue;
      child.content = child.content
        .replace(/---/g, '—')
        .replace(/--/g, '–')
        .replace(/\.\.\./g, '…');
    }
  }
});

// kramdown eagerly treats a straight quote after whitespace as an opening
// smart quote (e.g. `'09` → `‘09`, `'.git` → `‘.git`); markdown-it's
// smartquotes leaves unpaired ones as-is.
md.core.ruler.after('smartquotes', 'kramdown_quote_fixup', (state) => {
  if (!state.md.options.typographer) return;
  for (const token of state.tokens) {
    if (token.type !== 'inline') continue;
    for (const child of token.children) {
      if (child.type !== 'text') continue;
      child.content = child.content
        .replace(/(^|[\s([{])'(?=\S)/g, '$1‘')
        // ... and a double quote right after a dash opens too ("-" → “-“).
        .replace(/(-)”/g, '$1“');
    }
  }
});

md.use(anchor, {
  slugify: kramdownId,
  uniqueSlugStartIndex: 1,
  tabIndex: false,
});

// ---------------------------------------------------------------------------
// kramdown block IALs: `{: .class}` / `{: key="value"}` lines applied to the
// preceding block (only a handful of instances exist, in the theme demo
// pages).
// ---------------------------------------------------------------------------

const IAL_LINE = /^\{:\s*([^{}]*?)\s*\}$/;

function parseIal(body) {
  const attrs = [];
  const re = /([.#][\w-]+)|([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))|(\S+)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    if (m[1]) {
      if (m[1][0] === '.') attrs.push(['class', m[1].slice(1)]);
      else attrs.push(['id', m[1].slice(1)]);
    } else if (m[2]) {
      attrs.push([m[2], m[3] ?? m[4] ?? m[5] ?? '']);
    }
  }
  return attrs;
}

function applyAttrs(token, attrs) {
  for (const [name, value] of attrs) {
    if (name === 'class' && token.attrGet('class')) {
      token.attrSet('class', `${token.attrGet('class')} ${value}`);
    } else {
      token.attrSet(name, value);
    }
  }
}

md.core.ruler.before('inline', 'kramdown_ial', (state) => {
  const tokens = state.tokens;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'inline') continue;

    const lines = token.content.split('\n');
    const last = lines[lines.length - 1];
    const m = last.match(IAL_LINE);
    if (!m) continue;
    const attrs = parseIal(m[1]);
    if (!attrs.length) continue;

    if (lines.length > 1) {
      // Trailing IAL line inside a paragraph → applies to the paragraph.
      token.content = lines.slice(0, -1).join('\n');
      if (tokens[i - 1] && tokens[i - 1].type === 'paragraph_open') {
        applyAttrs(tokens[i - 1], attrs);
      }
    } else {
      // A paragraph consisting solely of an IAL → applies to the previous
      // block element.
      if (
        tokens[i - 1] &&
        tokens[i - 1].type === 'paragraph_open' &&
        tokens[i + 1] &&
        tokens[i + 1].type === 'paragraph_close'
      ) {
        // Find the closing token of the previous block and its opener.
        let j = i - 2;
        if (j >= 0 && tokens[j].type.endsWith('_close')) {
          const openType = tokens[j].type.replace(/_close$/, '_open');
          let depth = 0;
          for (let k = j; k >= 0; k--) {
            if (tokens[k].type === tokens[j].type) depth++;
            if (tokens[k].type === openType) {
              depth--;
              if (depth === 0) {
                applyAttrs(tokens[k], attrs);
                break;
              }
            }
          }
        }
        tokens.splice(i - 1, 3);
        i -= 2;
      }
    }
  }
});

// ---------------------------------------------------------------------------
// kramdown table extensions used by the sample post: a `|----` row splits the
// body into a new <tbody>, a `|====` row starts the <tfoot>.
// ---------------------------------------------------------------------------

md.core.ruler.before('inline', 'kramdown_table_groups', (state) => {
  const tokens = state.tokens;
  let tableOpen = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'table_open') tableOpen = i;
    if (tokens[i].type !== 'tr_open') continue;
    // Gather the row's cell contents.
    let j = i + 1;
    const cells = [];
    while (j < tokens.length && tokens[j].type !== 'tr_close') {
      if (tokens[j].type === 'inline') cells.push(tokens[j].content.trim());
      j++;
    }
    if (!cells.length) continue;
    const restEmpty = cells.slice(1).every((c) => c === '');
    const isDivider = /^-{2,}$/.test(cells[0]) && restEmpty;
    const isFootDivider = /^={2,}$/.test(cells[0]) && restEmpty;
    const ial = cells[0].match(IAL_LINE);
    if (ial && restEmpty) {
      // A trailing `{: ...}` line applies to the table itself.
      if (tableOpen !== -1) applyAttrs(tokens[tableOpen], parseIal(ial[1]));
      tokens.splice(i, j - i + 1);
      i--;
      continue;
    }
    if (!isDivider && !isFootDivider) continue;

    const makeToken = (type, tag, nesting) => {
      const t = new state.Token(type, tag, nesting);
      t.block = true;
      t.level = 1;
      return t;
    };
    const replacement = isDivider
      ? [makeToken('tbody_close', 'tbody', -1), makeToken('tbody_open', 'tbody', 1)]
      : [makeToken('tbody_close', 'tbody', -1), makeToken('tfoot_open', 'tfoot', 1)];
    tokens.splice(i, j - i + 1, ...replacement);

    if (isFootDivider) {
      // The table's final tbody_close must become tfoot_close.
      for (let k = i + 2; k < tokens.length; k++) {
        if (tokens[k].type === 'tbody_close') {
          tokens[k].type = 'tfoot_close';
          tokens[k].tag = 'tfoot';
          break;
        }
        if (tokens[k].type === 'table_close') break;
      }
    }
  }
});

// kramdown writes `style="text-align: left"` (with a space).
md.core.ruler.before('inline', 'kramdown_table_style', (state) => {
  for (const token of state.tokens) {
    if (token.type !== 'td_open' && token.type !== 'th_open') continue;
    const style = token.attrGet('style');
    if (style) token.attrSet('style', style.replace(/^text-align:(?! )/, 'text-align: '));
  }
});

// ---------------------------------------------------------------------------
// kramdown keeps a normalized blank line between blocks wherever the source
// had one (its parser produces :blank elements). Reproduce that by comparing
// source line maps between sibling blocks and emitting an extra newline.
// ---------------------------------------------------------------------------

md.core.ruler.push('kramdown_blank_lines', (state) => {
  const tokens = state.tokens;
  const lines = state.src.split('\n');
  const isBlankLine = (line) => line === undefined || line.trim() === '';
  const stack = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    if (token.nesting === 1) stack.push(token);
    // An empty `>` line at the start of a blockquote becomes a leading blank.
    if (token.type === 'blockquote_open' && token.map) {
      const next = tokens[i + 1];
      if (next && next.map && next.map[0] > token.map[0]) {
        const blank = new state.Token('kramdown_blank', '', 0);
        blank.block = true;
        tokens.splice(i + 1, 0, blank);
        i++;
        continue;
      }
    }
    let endLine = null;
    if (token.nesting === -1) {
      const open = stack.pop();
      if (open && open.map) endLine = open.map[1];
    } else if (token.nesting === 0 && token.block && token.map && token.type !== 'inline') {
      endLine = token.map[1];
    }
    if (endLine === null) continue;

    const next = tokens[i + 1];
    const opensBlock =
      (next.nesting === 1 || (next.nesting === 0 && next.block && next.type !== 'inline')) &&
      next.map;
    if (!opensBlock) continue;
    // kramdown's list/table parsers consume blank lines between items.
    if (token.type === 'list_item_close' && next.type === 'list_item_open') continue;
    if (token.type === 'thead_close' || token.type === 'tbody_close') continue;
    // kramdown separates adjacent raw <script> elements with a blank line.
    if (
      token.type === 'html_block' &&
      /<\/script>\s*$/.test(token.content) &&
      next.type === 'html_block' &&
      /^\s*<script/.test(next.content)
    ) {
      const blank = new state.Token('kramdown_blank', '', 0);
      blank.block = true;
      tokens.splice(i + 1, 0, blank);
      i++;
      continue;
    }
    // Some block maps (lists) extend through trailing blank lines; pull the
    // effective end back to the last non-blank source line.
    while (endLine > 0 && isBlankLine(lines[endLine - 1])) endLine--;
    if (next.map[0] > endLine) {
      const blank = new state.Token('kramdown_blank', '', 0);
      blank.block = true;
      tokens.splice(i + 1, 0, blank);
      i++;
    }
  }
});

md.renderer.rules.kramdown_blank = () => '\n';

// ---------------------------------------------------------------------------
// Renderer overrides
// ---------------------------------------------------------------------------

// kramdown pretty-prints nested block elements with two-space indentation
// (<blockquote>/<ul>/<table>/... children). Indent structural tags that start
// a line by 2 * nesting level.
const defaultRenderToken = md.renderer.renderToken.bind(md.renderer);
md.renderer.renderToken = function (tokens, idx, options) {
  const rendered = defaultRenderToken(tokens, idx, options);
  const token = tokens[idx];
  if (!token.block || token.hidden || token.level <= 0 || !/^\n?</.test(rendered)) {
    return rendered;
  }
  // Only indent tags that begin a new output line: closing tags directly
  // after inline content (e.g. tight `<li>text</li>`) stay untouched.
  if (token.nesting === -1 && !rendered.startsWith('\n')) {
    for (let i = idx - 1; i >= 0; i--) {
      if (tokens[i].hidden) continue;
      if (tokens[i].type === 'inline') return rendered;
      break;
    }
  }
  const indent = '  '.repeat(token.level);
  return rendered.replace(/^(\n?)/, `$1${indent}`);
};

// kramdown parses raw HTML and re-serializes it, so void elements always come
// out XHTML-style ("<br />").
function normalizeVoidTags(html) {
  return html
    // kramdown treats closing tags of void elements as literal text.
    .replace(/<\/(br|hr|img)\s*>/gi, '&lt;/$1&gt;')
    .replace(/<(br|hr|img)(\s[^<>]*?)?\s*\/?>/gi, '<$1$2 />')
    .replace(/\s+ \/>/g, ' />')
    // kramdown expands self-closed non-void elements (e.g. `<a/>`).
    .replace(/<(a)\s*\/>/gi, '<$1></$1>');
}

// kramdown reparses raw HTML tags: attributes end up space-separated on one
// line and boolean attributes gain `=""`.
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;

function normalizeRawTags(html) {
  return html
    .replace(/<(iframe|script|embed|video|audio|source)\b([^>]*?)(\/?)>/gi, (match, tag, attrs, selfClose) => {
      const parts = [];
      for (const m of attrs.matchAll(ATTR_RE)) {
        if (m[3] !== undefined) {
          let value = m[3];
          if (!/^["']/.test(value)) value = `"${value}"`;
          parts.push(`${m[1]}=${value}`);
        } else {
          parts.push(`${m[1]}=""`);
        }
      }
      const attrText = parts.length ? ` ${parts.join(' ')}` : '';
      return `<${tag.toLowerCase()}${attrText}${selfClose ? ' /' : ''}>`;
    })
    // kramdown puts a sibling element that followed on the same line onto its
    // own line.
    .replace(/<\/iframe>[ \t]+</gi, '</iframe>\n<')
    // kramdown escapes stray angle brackets in raw text nodes (child
    // elements are preserved).
    .replace(/(<figcaption>)([\s\S]*?)(<\/figcaption>)/gi, (match, open, text, close) => {
      const escaped = text.replace(/(<\/?[a-zA-Z][^<>]*>)|([<>])|&(?![#a-zA-Z0-9]+;)/g,
        (m, tag, bracket) => {
          if (tag) return tag;
          if (bracket) return bracket === '<' ? '&lt;' : '&gt;';
          return '&amp;';
        });
      return `${open}${escaped}${close}`;
    })
    // kramdown separates adjacent raw <script> elements with a blank line.
    .replace(/<\/script>\n<script/g, '</script>\n\n<script')
    // kramdown consumes its markdown="..." processing attribute.
    .replace(/(<[a-zA-Z][^<>]*?)\s+markdown="[^"]*"/g, '$1');
}

md.renderer.rules.html_inline = (tokens, idx) => normalizeVoidTags(tokens[idx].content);
md.renderer.rules.html_block = (tokens, idx) =>
  normalizeRawTags(normalizeVoidTags(tokens[idx].content));

// kramdown+rouge adds this class to every inline code span, and escapes only
// & < > inside code.
md.renderer.rules.code_inline = (tokens, idx) =>
  `<code class="highlighter-rouge">${escapeHtml(tokens[idx].content)}</code>`;

// Jekyll ran indented code blocks through rouge too (as plain text), which
// wraps them in the highlighter markup without a language class.
md.renderer.rules.code_block = (tokens, idx) =>
  `<div class="highlighter-rouge"><div class="highlight"><pre class="highlight"><code>` +
  `${escapeHtml(tokens[idx].content)}</code></pre></div></div>\n`;

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const lang = token.info ? token.info.trim().split(/\s+/)[0] : '';
  if (!lang) return `<pre><code>${escapeHtml(token.content)}</code></pre>\n`;
  return fenceHtml(lang, token.content);
};

// Footnotes, in kramdown's markup.
md.use(footnote);

// kramdown ids footnotes by their label (`[^plugins]` → fn:plugins).
function footnoteName(tokens, idx, env) {
  const id = tokens[idx].meta.id;
  const label = env && env.footnotes && env.footnotes.list && env.footnotes.list[id]
    ? env.footnotes.list[id].label
    : null;
  return label || String(id + 1);
}

md.renderer.rules.footnote_ref = (tokens, idx, options, env) => {
  const name = footnoteName(tokens, idx, env);
  const n = Number(tokens[idx].meta.id + 1);
  return (
    `<sup id="fnref:${name}" role="doc-noteref">` +
    `<a href="#fn:${name}" class="footnote" rel="footnote">${n}</a></sup>`
  );
};
md.renderer.rules.footnote_block_open = (tokens, idx, options, env) =>
  `${env && env.kramdownFootnoteBlank ? '\n' : ''}<div class="footnotes" role="doc-endnotes">\n  <ol>\n`;
md.renderer.rules.footnote_block_close = () => '  </ol>\n</div>\n';
md.renderer.rules.footnote_open = (tokens, idx, options, env) =>
  `    <li id="fn:${footnoteName(tokens, idx, env)}" role="doc-endnote">\n`;
md.renderer.rules.footnote_close = () => '    </li>\n';
md.renderer.rules.footnote_anchor = (tokens, idx, options, env) => {
  const name = footnoteName(tokens, idx, env);
  // kramdown separates the backlink with a literal no-break space.
  return (
    ` <a href="#fnref:${name}" class="reversefootnote" role="doc-backlink">&#8617;</a>`
  );
};

// ---------------------------------------------------------------------------
// {:toc} support (kramdown auto-generated table of contents), used by the
// theme demo pages via a `<div id="drawer" markdown="1">` block.
// ---------------------------------------------------------------------------

const TOC_PATTERN =
  /<div id="drawer">\n\*\s+Auto generated table of contents\n\{:toc\}\n<\/div>\n<\/section><!-- \/#table-of-contents -->/g;
const TOC_CLOSE = '\n\n  </div>\n</section>\n<!-- /#table-of-contents -->';

function buildToc(headings) {
  const root = { level: 0, children: [] };
  const stack = [root];
  for (const h of headings) {
    while (stack.length > 1 && stack[stack.length - 1].level >= h.level) stack.pop();
    const node = { ...h, children: [] };
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  const lines = ['<ul id="markdown-toc">'];
  const walk = (nodes, depth) => {
    const liIndent = ' '.repeat(2 + 4 * depth);
    const ulIndent = ' '.repeat(4 + 4 * depth);
    for (const node of nodes) {
      const link = `<a href="#${node.id}" id="markdown-toc-${node.id}">${node.html}</a>`;
      if (node.children.length) {
        lines.push(`${liIndent}<li>${link}${ulIndent}<ul>`);
        walk(node.children, depth + 1);
        lines.push(`${ulIndent}</ul>`);
        lines.push(`${liIndent}</li>`);
      } else {
        lines.push(`${liIndent}<li>${link}</li>`);
      }
    }
  };
  walk(root.children, 0);
  lines.push('</ul>');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Render entry point
// ---------------------------------------------------------------------------

// kramdown's blockquote parsing is lazier than CommonMark's: a lone `>` line
// pulls the following paragraph into the blockquote. Emulate by prefixing the
// paragraph lines with `> ` (outside fenced code).
function kramdownLazyBlockquote(src) {
  if (!/^>[ \t]*$/m.test(src)) return src;
  const lines = src.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) inFence = !inFence;
    if (inFence) continue;
    if (/^>[ \t]*$/.test(lines[i]) && lines[i + 1] && !/^\s*$/.test(lines[i + 1]) && !/^>/.test(lines[i + 1])) {
      for (let j = i + 1; j < lines.length && !/^\s*$/.test(lines[j]); j++) {
        lines[j] = `> ${lines[j]}`;
      }
    }
  }
  return lines.join('\n');
}

export function render(src, env = {}) {
  // kramdown leaves a blank line before the footnotes <div> when the source
  // ends with a footnote definition block (the preceding :blank survives).
  const trimmed = src.replace(/\s+$/, '');
  const lastBlock = trimmed.slice(trimmed.lastIndexOf('\n\n') + 1).trimStart();
  env.kramdownFootnoteBlank = /^\[\^[^\]]+\]:/.test(lastBlock);

  const tokens = md.parse(kramdownLazyBlockquote(src), env);

  const headings = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open' && tokens[i + 1] && tokens[i + 1].type === 'inline') {
      headings.push({
        level: Number(tokens[i].tag.slice(1)),
        id: tokens[i].attrGet('id'),
        html: md.renderer.renderInline(tokens[i + 1].children, md.options, env),
      });
    }
  }

  let html = md.renderer.render(tokens, md.options, env);

  // {% highlight %} placeholders → rouge markup.
  html = resolveHighlightMarkers(html);

  // {:toc} drawer → kramdown-format table of contents.
  if (TOC_PATTERN.test(html)) {
    TOC_PATTERN.lastIndex = 0;
    html = html.replace(TOC_PATTERN, `<div id="drawer">\n${buildToc(headings)}${TOC_CLOSE}`);
  }

  // kramdown emits a trailing blank when the source ends with blank lines,
  // and after a trailing raw HTML block.
  const lastToken = tokens.filter((t) => t.type !== 'kramdown_blank').pop();
  const endsWithScript =
    lastToken && lastToken.type === 'html_block' && /<\/script>\s*$/.test(lastToken.content);
  if (html.endsWith('\n') && (/\n[ \t]*\n[\s]*$/.test(src) || endsWithScript)) {
    html += '\n';
  }

  // kramdown indents the <p> inside footnote items with six spaces and trims
  // trailing paragraph whitespace.
  html = html.replace(/(<li id="fn:[^"]+" role="doc-endnote">\n)( *)<p>/g, '$1      <p>');
  html = html.replace(/(class="reversefootnote" role="doc-backlink">&#8617;<\/a>)[ \t]+<\/p>/g, '$1</p>');

  return html;
}

export default { render };
