import fs from 'fs-extra'
import path from 'path'
import walk from 'klaw-sync'

import { render } from './minitemplate.js'

import parse from './postParser.js'

import * as siteConfig from './site-config.js'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))



// Debugging
import { DEBUG } from './util/debug.js'

// Creates absolute paths from paths relative to project root
const R = (...components) => path.join(__dirname, '../', ...components)

import { LANGUAGES, DEFAULT_LANGUAGE } from './languages.js'

const OUTPUT_DIR = '_site'




// Create/clean output directory
DEBUG('Truncating output folder...')

fs.ensureDirSync(R(OUTPUT_DIR))
//fs.emptyDirSync(R(OUTPUT_DIR))


// Symlinks to static assets
DEBUG('Symlinking assets directories...')

//fs.ensureSymlinkSync('../img', R(OUTPUT_DIR+'/img'), 'dir')
//fs.ensureSymlinkSync('../assets', R(OUTPUT_DIR+'/assets'), 'dir')
fs.copy(path.join(__dirname, '../img'), R(OUTPUT_DIR+'/img'))
fs.copy(path.join(__dirname, '../assets'), R(OUTPUT_DIR+'/assets'))


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
const livePosts = posts.filter(
  p => !p.draft
).map(
  post => Object.assign(
    post,
    { versions: parse(post) }
  )
)


// Generate index page
DEBUG('Generating documents...')
import { templates as indexTemplates } from './indexPage.js'
import { templates as postTemplates } from './postPage.js'

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
  postsInLang.items.forEach(p => {
    const { parsed, props } = p.versions[language]
    const social = props.social_image

    const page = Object.assign({
      language,
      contents: parsed.html,

      title: [ parsed.title||p.title, siteConfig.sitename ].join(' \u2014 '),
      description: parsed.description || p.description,

      socialImage: social ? (social.includes('/') ? social : siteConfig.siteroot+'img/social/'+social) : '',

      url: p.url,
      fullUrl: siteConfig.siteroot+p.url,
    })

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

    fs.writeFileSync(R(siteroot,`${p.label}.html`), html)

    DEBUG(`   * ${p.filename}: ${p.title}`)
  })
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
