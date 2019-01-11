import marked from 'marked'
import { machineDate, localeDate } from './util/datefmt.js'
import { processImage } from './processing.js'


export default function(md, options, props) {
  const renderer = new marked.Renderer()
  const rHeading = renderer.heading
  const rText = renderer.text
  const rImage = renderer.image

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

  // Image pre-processing
  // image(string href, string title, string text)
  renderer.image = (...args) => {
    // If image is pointing to "sources" directory, pre-process it
    const m = args[0].match(/^\/sources\/img\/(.*)\.(jpg|gif|gifv|mp4)$/i)
    if (m) {
      // Preprocess JPEGs
      if (m[2] == 'jpg') {
        const res = processImage(`${m[1]}.${m[2]}`)

        // If successfully generated derived image files, use thumbnail
        // in source.
        // TODO: currently full-size image is only exposed via JS
        if (res) {
          args[0] = res.thumbnail.substring(res.thumbnail.indexOf('/img/'))
        }

      // Simply copy GIFs
      // TODO: preprocess, convert to muted repeating autoplay video
      } else if (m[2] == 'gif' || m[2] == 'gifv') {

      // Copy over videos & return embed code
      // TODO: preprocess
      } else if (m[2] == 'mp4') {

      }
    }

    return rImage.apply(renderer, args)
  }

  // Content fixes
  renderer.text = (...args) => {
    // Transform -- into em-dash
    // todo: smartypants: true should enable this by default
    args[0] = args[0].replace(/\s--\s/g,'&mdash;')

    // Locale-aware dates
    args[0] = args[0].replace(/@(\d{4}-\d{2}-\d{2})/g, (_, date) => {
      return `<time datetime="${machineDate(date)}">${localeDate(props.language, date)}</time>`
    })



    return rText.apply(renderer, args)
  }

  // Run marked
  let html = marked(md, Object.assign({}, options, { renderer: renderer }))

  // TODO: move these hacks out into the lexer/tokenizer step
  html = html.replace(
    /<p><img src="\/img\/([\w\/]+)\.thumb\.jpg"/g,
    (match, file) => {
      const res = processImage(`${file}.jpg`, { fullwidth: true })
      return match.replace('.thumb.jpg','.small.jpg')
    }
  )

  return { html, outline }
}
