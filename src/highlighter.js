// via https://benborgers.com/posts/marked-prism
// TODO: extend with prismjs/plugins/autoloader mappings & preload highlighters

import prism from 'prismjs'
import { DEBUG } from './util/debug.js'
// also exposed globally: prism === global.Prism

// prismjs already bundles:
// * prism-markup.js
// * prism-css.js
// * prism-clike.js
// * prism-javascript.js

// Extra default imports
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-systemd.js'


function highlight (code, lang) {
  // Extra aliases
  if (lang === 'sh') lang = 'shell'

  // Known highlighting style
  if(prism.languages[lang]) {
    return prism.highlight(code, prism.languages[lang], lang)
  }

  if (lang) DEBUG('Unsupported highlighting language: '+lang)

  // Plain text
  return prism.highlight(code, prism.languages['plain'], 'plain')
}

export default highlight

console.log(Object.keys(Prism.languages))
