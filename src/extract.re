let extract: string => array((string, string)) = (
  [%raw
    {|
  function (text) {
    const marked = require('marked');

    return marked.lexer(text)
      .filter(node => node.type == 'code')
      .map(node => [node.lang, node.text]);
  }
|}
  ]:
    string => array((string, string))
);
