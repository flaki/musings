import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

// Debugging
import { DEBUG } from './util/debug.js'


export function processImage(imagefile, options) {
  const source = path.join(__dirname, '../sources/img', imagefile)
       ,target = path.join(__dirname, '../img', imagefile)
       ,thumbnail = thumb(target)
       ,smallsize = small(target)


  // Options
  const { overwrite, fullwidth } = (options || {})

  if (!fs.existsSync(source)) {
    console.error(`"${source}" not found.`)
    return false
  }

  // magick convert -auto-orient -resize '1920x1920' -quality 75 ./sources/img/africa/hornbills_nest.jpg ./img/africa/hornbills_nest.jpg
  if (!fs.existsSync(target) || overwrite) {
    try {
      run(`magick convert -auto-orient -resize '1920x1920' -quality 75 "${source}" "${target}"`)
    }
    catch(e) {
      console.error('Failed: ' + e.cmd)
      return false
    }
    DEBUG(`"${target}" created.`)
  }

  // magick convert -auto-orient -resize '256x256' -quality 60 ./sources/img/africa/hornbills_nest.jpg ./img/africa/hornbills_nest.thumb.jpg
  if (!fs.existsSync(thumbnail) || overwrite) {
    try {
      run(`magick convert -auto-orient -resize '256x256' -quality 60 "${target}" "${thumbnail}"`)
    }
    catch(e) {
      console.error('Failed: ' + e.cmd)
      return false
    }
    DEBUG(`"${thumbnail}" created.`)
  }

  // magick convert -auto-orient -resize '720x720' -quality 60 ./sources/img/africa/hornbills_nest.jpg ./img/africa/hornbills_nest.small.jpg
  if (fullwidth && (!fs.existsSync(smallsize) || overwrite)) {
    try {
      run(`magick convert -resize '720x720' -quality 60 "${target}" "${smallsize}"`)
    }
    catch(e) {
      console.error('Failed: ' + e.cmd)
      return false
    }
    DEBUG(`"${smallsize}" created.`)
  }

  return {
    source, target, thumbnail, smallsize
  }
}

function thumb(path) {
  return path.replace(/\.jpg$/, '.thumb.jpg')
}

function small(path) {
  return path.replace(/\.jpg$/, '.small.jpg')
}

function run(cmd) {
  return execSync(cmd)
}
