import fs from 'fs-extra'
import path from 'path'
import walk from 'klaw-sync'

import { render } from './minitemplate.js'

import parse from './postParser.js'

import * as siteConfig from './site-config.js'

import rss from './rss.js'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))



// Debugging
import { DEBUG } from './util/debug.js'

// Creates absolute paths from paths relative to project root
const R = (...components) => path.join(__dirname, '../', ...components)

import { LANGUAGES, DEFAULT_LANGUAGE } from './languages.js'

// Build environment
const BUILD_ENV = process.env['BUILD_ENV'] ?? 'live'

// Output directory
const OUTPUT_DIR = process.env['OUTPUT_DIR'] ?? '_site'
const OUTDIR = !OUTPUT_DIR || path.isAbsolute(OUTPUT_DIR) ? OUTPUT_DIR : R(OUTPUT_DIR)


// Create/clean output directory
DEBUG('Creating output folder...')
fs.ensureDirSync(OUTDIR)
fs.emptyDirSync(OUTDIR)


// Symlinks to static assets
DEBUG('Copying assets...')

try {
  fs.ensureDirSync(path.join(__dirname, '../img'))

  fs.copySync(path.join(__dirname, '../img'), path.join(OUTDIR,'/img'))
  fs.copySync(path.join(__dirname, '../assets'), path.join(OUTDIR,'/assets'))
}
catch(e) {
  DEBUG('Copy errors: ', e.message)
}


// Read posts
DEBUG('Enumerating posts...')

const posts = walk(R('items'),
  { filter: p => path.extname(p.path) === '.md' }
).map(
  post => Object.assign(
    post,
    {
      source: fs.readFileSync(post.path).toString(),
      date: new Date(post.stats.mtime),
      filename: path.basename(post.path),
      label: path.basename(post.path, '.md').replace('~',''),
      draft: path.basename(post.path).substring(0,1) === '~'
    }
  )
)


DEBUG(`${posts.length} documents, ${posts.reduce((c, post) => c+post.draft,0)} drafts`)

// Process non-draft posts
// Hide draft posts in live builds, but include everything in other builds
const livePosts = (
  BUILD_ENV === 'live' ? posts.filter(p => !p.draft) : posts
).map(
  post => Object.assign(
    post,
    { versions: parse(post) }
  )
)


// Generate index page
DEBUG('Generating documents...')
import { templates as indexTemplates } from './indexPage.js'
import { tPost } from './postPage.js'

import tPageMeta from './tPageMeta.js'

const indexTemplate = fs.readFileSync(R('src/index.html')).toString()
const pageTemplate = fs.readFileSync(R('src/post.html')).toString()


// Generate index page listing
LANGUAGES.forEach(language => {
  const postsInLang = postsFor(language)
  const siteroot = OUTPUT_DIR+'/' + (language == DEFAULT_LANGUAGE ? '' : language+'/')

  fs.ensureDirSync(R(siteroot))
  fs.writeFileSync(R(siteroot, 'index.html'), postsInLang.htmlList)

  DEBUG(` - index for "${language}" locale: ${postsInLang.items.length} documents`)

  // Write post page
  const rssItems = []
  postsInLang.items.forEach(p => {
    const { parsed, props } = p.versions[language]
    const social = props.social_image

    const contents = tPost({
      ...p,
      contents: parsed.html
    })

    const page = Object.assign({
      language,
      contents,

      title: [ parsed.title||p.title, siteConfig.sitename ].join(' \u2014 '),
      description: parsed.description || p.description,

      socialImage: social ? (social.includes('/') ? social : siteConfig.siteroot+'/img/social/'+social) : '',

      url: p.url,
      fullUrl: siteConfig.siteroot+p.url,

      metadata: props,
    })

    rssItems.push(page)

    const html = render(pageTemplate, Object.assign(
      {
        global: siteConfig,
        page: Object.assign(
          page,
          {
            meta: tPageMeta({
              global: siteConfig,
              page: page
            })
          }
        )
      }
    ))

    const fpath = R(siteroot,p.label)
    fs.ensureDirSync(fpath)
    fs.writeFileSync(fpath+'/index.html', html)

    DEBUG(`   * ${p.filename}: ${p.title}`)
  })

  fs.writeFileSync(R(siteroot, '/feed.xml'), rss(siteConfig, rssItems))

})


const build = {
  status: 'success'
}

export { build }



function postsFor(language) {
  const p = {
    global: siteConfig,
    page: { language }
  }

  const items = livePosts.filter(
    post => post.versions[language].parsed.title
  ).map(post => {
    const props = post.versions[language].props || {}

    return Object.assign(
      post,
      {
        url: '/' + (language == DEFAULT_LANGUAGE ? '' : language+'/') + post.label,
        description: props.description,
        title: post.versions[language].parsed.title,
        language,

        published: props.published ? new Date(props.published) : post.stats.mtime,
        updated: props.updated ? new Date(props.updated) : null,
      }
    )
  })

  Object.assign(p.page, {
    contents:   indexTemplates.tPostList(items),
    tagline:    indexTemplates.tPageTagline(p),
    switchlang: indexTemplates.tPageSwitchlang(p)
  })

  const htmlList = render(indexTemplate, p)

  return { items, htmlList }
}
