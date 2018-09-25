import marked from 'marked'


export default function(md, options) {
  const renderer = new marked.Renderer()
  const rHeading = renderer.heading
  const rText = renderer.text

  // Pull outline (heading structure) from the post
  let outline = []
  renderer.heading = (...args) => {
    const [text, level] = args

    outline.push([ `h${level}`, level, text ])

    // remove diacritics from "raw" argument
    if (args[2]) {
      // https://stackoverflow.com/a/37511463
      args[2] = args[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }

    return rHeading.apply(renderer, args)
  }

  // Minor text autofixes
  renderer.text = (...args) => {
    args[0] = args[0].replace(/\s--\s/g,'&mdash;')

    return rText.apply(renderer, args)
  }

  // Run marked
  let html = marked(md, Object.assign({}, options, { renderer: renderer }))

  return { html, outline }
}
