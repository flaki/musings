import marked from './marked-outline.js'
import { LANGUAGES } from './languages.js'


export default function parse(post) {
  // Chunk up and create per-language files
  return chunks(post.source)
}


function findTitleInOutline(outline) {
  let title
  let hlevel = 9

  outline.forEach( ([_, hl, text]) => {
    if (hl < hlevel) {
      hlevel = hl
      title = text
    }
  })

  return title
}


function chunks(md) {
  if (typeof md !== 'string') return {}

  // Remove custom CSS & JS and metadata from the source and add them to the code
  const codechunks = []
  const rx = /```(js|css)([\s\S]+?)```/gm

  md = md.replace(rx, (match, type, content) => {
    switch (type) {
      case 'css':
        codechunks.push(`<style>${content}</style>`)
        break

      case 'js':
        codechunks.push(`<script>${content}</script>`)
        break
    }
    return ''
  })

  // Get props and markdown
  const chunks = md.split(/\n\n---\n/g).map(c => props(c))

  const versions = {}

  // Find language versions
  LANGUAGES.forEach(lang => {
    versions[lang] = { parts: [], props: {} }
  })

  // Build source & props for all versions
  chunks.forEach(c => {
    // Add chunk for only a specific language version
    if (c.props.language) {
      const v = versions[c.props.language]

      // Add text part
      if(c.md) v.parts.push(c.md)

      // Merge props
      Object.assign(v.props, c.props)

    // Add for all versions
    } else {
      Object.values(versions).forEach(v => {
        if(c.md) v.parts.push(c.md)
        Object.assign(v.props, c.props)
      })
    }

  })

  // Parse all versions of the post
  Object.values(versions).forEach(v => {
    const parsed = marked(v.parts.join('\n\n'), {}, v.props)

    // prepend codechunks to parsed html
    parsed.html =  codechunks.join('\n') + parsed.html

    // Carve out the main title
    // TODO: bug: all language versions get the same title
    parsed.title = findTitleInOutline(parsed.outline)

    v.parsed = parsed
  })

  return versions
}

function props(chunk) {
  const rx = /[\t ]{2,}(\w+): ([^\n]+)(?:\n|$)/g
  const props = {}

  let match
  let contentStart = 0
  while (match = rx.exec(chunk)) {
    props[match[1]] = match[2]
    contentStart = rx.lastIndex
  }

  // Cut the parsed props from the markdown
  let md = chunk.substr(contentStart).trim()

  return { props, md }
}
