# Renders code to Rouge (Pygments-style) token HTML, matching what Jekyll
# 4.x + rouge produced for this site. Used by lib/rouge.mjs to (re)build
# lib/rouge-cache.json. Requires the `rouge` gem (the site was built with
# rouge 3.30.0): `gem install rouge -v 3.30.0`.
#
# stdin:  JSON {"lang": "bash", "code": "..."}
# stdout: JSON {"html": "<span ...>...</span>"}

begin
  require 'rouge'
rescue LoadError
  # Fall back to a bundler-vendored copy if one is present (vendor/ is not
  # committed; this is a convenience for machines that built the old
  # Jekyll site).
  Dir.glob(File.expand_path('../vendor/bundle/ruby/*/gems/rouge-*/lib', __dir__)).each do |path|
    $LOAD_PATH.unshift(path)
  end
  require 'rouge'
end

require 'json'

request = JSON.parse($stdin.read)
lexer = Rouge::Lexer.find_fancy(request['lang'], request['code']) || Rouge::Lexers::PlainText
formatter = Rouge::Formatters::HTML.new
puts JSON.generate('html' => formatter.format(lexer.lex(request['code'])))
