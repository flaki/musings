import { marked } from 'marked'

import highlight from './highlighter.js'

import { machineDate, localeDate } from './util/datefmt.js'
import { processImage, copyImage, processGif, processPng, processPanorama, processVideo } from './processing.js'

import * as siteConfig from './site-config.js'

// Debugging
import { DEBUG } from './util/debug.js'



export default function(md, options = {}, props) {
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

    // Skip rendering H1 (rendered separately in-template)
    if (level === 1) return '';

    return rHeading.apply(renderer, args)
  }

  // Image pre-processing
  // image(string href, string title, string text)
  renderer.image = (...args) => {
    let [ href, title, text, kind ] = args;
  
    // If image is pointing to "sources" directory, pre-process it
    const m = href.match(/^\.?\/sources\/img\/(?<path>[\w\/-]+?\/|)(?<prefix>PANO@|)(?<name>[\w._-]+?)\.(?<ext>jpg|png|gif|gifv|mp4)$/i)
    if (m) {
      const { path, prefix, name, ext } = m.groups,
        filename = path + prefix + name + '.' + ext,
        extension = ext.toLowerCase()

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
            href = imgur(res.smallsize)
          // Otherwise use the thumbnail size {
          } else {
            href = imgur(res.thumbnail)
          }
        }

      // PNG-s are not resized, but may be optimized
      } else if (extension == 'png') {
        DEBUG(`Preprocessing PNG: ${filename}`)

        const { target } = processPng(filename)

        href = imgur(target)

      // Preprocess GIFs, convert to looped/muted autoplay video embeds
      } else if (extension == 'gif' || extension == 'gifv') {
        DEBUG(`Preprocessing as GIF: ${filename}`)

        const res = processGif(`${filename}`)

        if (res) {
          const result = imgur(res.target)

          // TODO: fallback and size
          let fallback = ''
          if (res.fallback) {
            let fallbackurl = imgur(res.fallback)
            fallback = `<span>Video is not supported, <a href="${fallbackurl}">click here</a> for a fallback GIF for "${text}" (size: ? MB)</span>`
          }

          return `<video autoplay muted loop><source src="${result}" type="video/mp4">${fallback}</video>`
        } else {
          console.log('WARNING: Unprocessed file type: ', extension, ' in ', href)
        }

      // Copy over videos & return embed code
      // TODO: preprocess
      } else if (extension == 'mp4') {
        DEBUG(`Preprocessing as video: ${filename}`)
        const { target, poster, size } = processVideo(filename)
        
        return `
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
  <figcaption>${renderer.text(title ?? text)} (${size})</figcaption>
</figure>
`

      }
    // If it's a relative image URL, copy it to the media assets
    } else if (!href.includes('/')) {
      copyImage(href)
      href = new URL(href, siteConfig.mediaroot)
    } else {
      DEBUG('Not processed: ', href, m)
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
  const walkTokens = (token) => {
    if (token.type === 'paragraph') {
      // Only one child token and it's an image
      if (token.tokens[0]?.type === 'image' && token.tokens.length === 1) {
        const img = token.tokens[0]
        const { href } = img

        // Check file extension to exclude videos
        if (href.endsWith('.jpg') || href.endsWith('.png') || href.endsWith('.gif')) {
          token.type="standaloneimage"
          img._standalone=true
        }
      }
    }
    if (token.type === 'list') {
      // At this level the token type will always be text
      const itemTok = token.items.flatMap(i => i.tokens)
      // At this level, we check if the content is a single image
      // for all items -- this means it's an image gallery
      const itemContentTok = itemTok.flatMap(t => t.tokens).map(t => t.type)

      // If every item is an 'image' type, we make this a custom image gallery element
      if (itemContentTok.every(i => i === 'image')) {
        token.type = "imagegallery"
        token.imgcount = itemContentTok.length;
      }
    }
  }

  const standaloneImage = {
    name: 'standaloneimage',
    level: 'block',
    renderer(t) {
      const { href, title, text } = t.tokens[0]

      // Panorama images get a different class
      const label = href.includes('PANO@') ? 'panorama-image' : 'standalone-image'

      return `<figure class="${label}">${
          renderer.image(href, title, text, 'standalone')
        }<figcaption>${renderer.text(title ?? text)}</figcaption></figure>`
    }
  }

  // TODO: currently the image gallery is not keyboard-navigatable
  const imageGallery = {
    name: 'imagegallery',
    level: 'block',
    renderer(t) {
      t.type='list'
      return this.parser.parse([t]).replace(
        '<ul',
        `<ul class="image-gallery size-${t.imgcount}"`
      )
    }
  }

  marked.use({ walkTokens })
  marked.use({ extensions: [ standaloneImage, imageGallery ] })
  let html = marked(md, {
    renderer: renderer,
    highlight,

    // External overrides
    ...options
  })

  // Marked.js workaround for setting the highlight language on the <pre>, not the <code> block
  html = html.replace(
    /<pre(><code)( class="[^"]+")/g,
    '<pre$2$1'
  )

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

  // TODO: custom blockquotes for pull quotes
  html = html.replace(
    /<blockquote>\s*<p><em>&quot;(.*?)&quot;<\/em><\/p>\s*<\/blockquote>/g,
    '<blockquote class="q"><p>$1</p></blockquote>'
  )

  // Save panorama class on container <p> instead of image
  // TODO: this is obsolete
  html = html.replace(
    /<p(><img)( class="panorama")/g,
    (...args) => `<p${args[2]}${args[1]}`
  )


  return { html, outline }
}

function imgur(url) {
  const mediaRootPath = `/${siteConfig.MEDIA_DIR}/`
  const s = url.substring(url.indexOf(mediaRootPath)+mediaRootPath.length)
  const u = new URL(s, siteConfig.mediaroot)

  return u
}
