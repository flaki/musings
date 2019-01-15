import marked from 'marked'
import { machineDate, localeDate } from './util/datefmt.js'
import { processImage, processGif, processPanorama } from './processing.js'

// Debugging
import { DEBUG } from './util/debug.js'



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
    const m = args[0].match(/^\/sources\/img\/(|[\w\/]+?\/)(|PANO@)([\w\.-]+?)\.(jpg|gif|gifv|mp4)$/i)
    if (m) {
      const [ , path, prefix, name, extension ] = m,
        filename = path + prefix + name + '.' + extension

      if (prefix === 'PANO@') {
        DEBUG(`Preprocessing as panorama image: ${filename}`)

        const res = processPanorama(filename)
        if (res) {
          args[0] = res.targetpreview.substring(res.targetpreview.indexOf('/img/'))
        }

        return rImage.apply(renderer, args).replace('<img','<img class="panorama"')
      }

      // Preprocess JPEGs
      if (extension == 'jpg') {
        DEBUG(`Preprocessing as image: ${filename}`)

        const res = processImage(`${filename}`)

        // If successfully generated derived image files, use thumbnail
        // in source.
        // TODO: currently full-size image is only exposed via JS
        if (res) {
          args[0] = res.thumbnail.substring(res.thumbnail.indexOf('/img/'))
        }

      // Preprocess GIFs, convert to looped/muted autoplay video embeds
      } else if (extension == 'gif' || extension == 'gifv') {
        DEBUG(`Preprocessing as GIF: ${filename}`)

        const res = processGif(`${filename}`)

        if (res) {
          const result = res.target.substring(res.target.indexOf('/img/'))

          // TODO: fallback and size
          let fallback = ''
          if (res.fallback) {
            let fallbackurl = res.fallback.substring(res.fallback.indexOf('/img/'))
            fallback = `<p>Video is not supported, <a href="${fallbackurl}">click here</a> for a fallback GIF for "${args[2]}" (size: ? MB)</p>`
          }

          return `<video autoplay muted loop><source src="${result}" type="video/mp4">${fallback}</video>`
        }

      // Copy over videos & return embed code
      // TODO: preprocess
      } else if (extension == 'mp4') {
        DEBUG(`Preprocessing as video: ${filename}`)

        console.error('  [!] Warning: not implemented')
        return `<!-- VIDEO: ${filename} -->`
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

  // Save panorama class on container <p> instead of image
  html = html.replace(
    /<p(><img)( class="panorama")/g,
    (...args) => `<p${args[2]}${args[1]}`
  )


  return { html, outline }
}
