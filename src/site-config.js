import { fileURLToPath } from 'url'
import { isAbsolute, join, dirname } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))

export const sitename = `Flaki's Musings`
export const sitedesc = `Flaki's musings about the world. You may also call this a "blog".`
export const siteroot = process.env['SITEROOT'] ?? `https://localhost:8080/`
export const mediaroot = process.env['MEDIAROOT'] ?? `${siteroot}img/`

export const socialImage = new URL('social/musings.jpg', mediaroot).toString()
export const feedUrl = new URL('/feed.xml', siteroot).toString()

export const ilp = `$ilp.uphold.com/qnnAZhmFE9yi`


// Mounted data dir (working directory with sources and build output)
export const DATA = join(dirname(__dirname), 'data')

// Build environment
export const BUILD_ENV = process.env['BUILD_ENV'] ?? 'live'

export const SOURCES_DIR = 'sources'

// Posts
export const POSTS_DIR = process.env['POSTS_DIR'] ?? 'posts'
export const POSTDIR = isAbsolute(POSTS_DIR) ? POSTS_DIR : join(DATA, SOURCES_DIR, POSTS_DIR)

// Images and media
export const MEDIA_DIR = process.env['MEDIA_DIR'] ?? 'img'
export const MEDIADIR = isAbsolute(MEDIA_DIR) ? MEDIA_DIR : join(DATA, SOURCES_DIR, MEDIA_DIR) 

// Output directory
export const OUTPUT_DIR = process.env['OUTPUT_DIR'] ?? 'www'
export const OUTDIR = isAbsolute(OUTPUT_DIR) ? OUTPUT_DIR : join(DATA, OUTPUT_DIR)
