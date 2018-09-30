import marked from 'marked'
import { machineDate, localeDate } from './util/datefmt.js'


export default function(md, options, props) {
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

  // Content fixes
  renderer.text = (...args) => {
    // Transform -- into em-dash
    args[0] = args[0].replace(/\s--\s/g,'&mdash;')

    // Locale-aware dates
    args[0] = args[0].replace(/@(\d{4}-\d{2}-\d{2})/g, (_, date) => {
      return `<time datetime="${machineDate(date)}">${localeDate(props.language, date)}</time>`
    })



    return rText.apply(renderer, args)
  }

  // Run marked
  let html = marked(md, Object.assign({}, options, { renderer: renderer }))

  return { html, outline }
}
