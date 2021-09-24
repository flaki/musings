import marked from 'marked'
import { machineDate, localeDate } from './util/datefmt.js'
import { processImage, processGif, processPanorama, processVideo } from './processing.js'

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
    let [ href, title, text, kind ] = args;
  
    // If image is pointing to "sources" directory, pre-process it
    const m = href.match(/^\/sources\/img\/(|[\w\/]+?\/)(|PANO@)([\w\.-]+?)\.(jpg|gif|gifv|mp4)$/i)
    if (m) {
      const [ , path, prefix, name, extension ] = m,
        filename = path + prefix + name + '.' + extension

      if (prefix === 'PANO@') {
        DEBUG(`Preprocessing as panorama image: ${filename}`)

        const res = processPanorama(filename)
        if (res) {
          href = imgur(res.targetpreview)
        }

        return rImage.apply(renderer, [href,title,text]).replace('<img','<img class="panorama"')
      }

      // Preprocess JPEGs
      if (extension == 'jpg') {
        DEBUG(`Preprocessing as image: ${filename}`)

        const res = processImage(`${filename}`, { fullwidth: kind })

        // If successfully generated derived image files, use thumbnail
        // in source.
        // TODO: currently full-size image is only exposed via JS
        if (res) {
          // If standalone image, use smallsize
          if (kind == 'standalone') {
            href = res.smallsize.substring(res.smallsize.indexOf('/img/'))
          // Otherwise use the thumbnail size {
          } else {
            href = res.thumbnail.substring(res.thumbnail.indexOf('/img/'))
          }
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
            fallback = `<p>Video is not supported, <a href="${fallbackurl}">click here</a> for a fallback GIF for "${text}" (size: ? MB)</p>`
          }

          return `<video autoplay muted loop><source src="${result}" type="video/mp4">${fallback}</video>`
        }

      // Copy over videos & return embed code
      // TODO: preprocess
      } else if (extension == 'mp4') {
        DEBUG(`Preprocessing as video: ${filename}`)
        const { target, poster, size } = processVideo(filename)
        
        return `<p>
<figure data-src="${filename}">
  <video controls poster="${imgur(poster)}">
    <source src="${imgur(target)}" type="video/mp4">
    <em>Video is not supported in your browser,
      <a download href="${imgur(target)}">click here</a>
      to download the video of
      "${text}"
      (${size})
    </em>
  </video>
  <figcaption>${title ?? text} (${size})</figcaption>
</figure>
</p>`

      }
    }

    return rImage.apply(renderer, [href,title,text])
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
  const walkParagraphs = (token) => {
    if (token.type === 'paragraph') {
      if (token.tokens[0]?.type === 'image' && token.tokens.length === 1) {
        token.type="standaloneimage"
        token.tokens[0]._standalone=true
      }
    }
  }

  const standaloneImage = {
    name: 'standaloneimage',
    level: 'block',
    renderer(t) {
      const { href, title, text } = t.tokens[0]
      return `<figure class="standalone-image">${
          renderer.image(href, title, text, 'standalone')
        }<figcaption>${title ?? text}</figcaption></figure>`
    }
  }

  marked.use({ walkTokens: walkParagraphs })
  marked.use({ extensions: [ standaloneImage ] })
  let html = marked(md, Object.assign({}, options, { renderer: renderer }))

  // TODO: move these hacks out into the lexer/tokenizer step
  // This portion tries to reprocess free-standing full-width images with a larger
  // resolution.
  // It currently fails to find images that were ".edited", because that tag is
  // removed from the filename during the first time any images are processed.
  //html = html.replace(
  //  /<p><img src="\/img\/([\w\/]+)\.thumb\.jpg"/g,
  //  (match, file) => {
  //    const res = processImage(`${file}.jpg`, { fullwidth: true })
  //    return match.replace('.thumb.jpg','.small.jpg')
  //  }
  //)

  // Save panorama class on container <p> instead of image
  html = html.replace(
    /<p(><img)( class="panorama")/g,
    (...args) => `<p${args[2]}${args[1]}`
  )


  return { html, outline }
}

function imgur(url) {
  return url.substring(url.indexOf('/img/'))
}
