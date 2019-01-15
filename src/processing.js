import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

// Debugging
import { DEBUG } from './util/debug.js'


export function processPanorama(sourcefile, ) {
  const source = path.join(__dirname, '../sources/img', sourcefile)
       ,target = path.join(__dirname, '../img', sourcefile).replace('.edited','')
       ,storedpreview = replaceExtension(source, '.preview.jpg')
       ,targetpreview = replaceExtension(target, '.preview.jpg')

  // Preview (small-size panning animation) already exists, just copy it over
  if (fs.existsSync(storedpreview)) {
    fs.copyFileSync(storedpreview, targetpreview)

    return {
      source, target, targetpreview
    }
  }

  // Generate preview image
  try {
    DEBUG(`  Generating panorama preview...`)
    convertJpegAndOptimize(source, targetpreview, { size: 'x720' })
  }
  catch(e) {
    console.error('Failed: ' + (e.cmd||e))
    return false
  }

  return {
    source, target, targetpreview
  }

  // TODO: full-size & VR view
  DEBUG(`"${target}" created.`)
}

export function processGif(sourcefile, options) {
  const source = path.join(__dirname, '../sources/img', sourcefile)
       ,target = path.join(__dirname, '../img', gifv(sourcefile)).replace('.edited','')

  // Options
  const { overwrite, fallbackgif } = (options || {})

  // ffmpeg -i lobatse_rainstorm.gifv -vcodec libvpx -b:v 2M -an -auto-alt-ref 0 -f webm output.gifv
  if (!fs.existsSync(target) || overwrite) {
    try {
      run(`ffmpeg -i ${source} -vcodec libvpx -b:v 2M -an -auto-alt-ref 0 -f webm ${target}`)
    }
    catch(e) {
      console.error('Failed: ' + e.cmd)
      return false
    }
    DEBUG(`"${target}" created.`)
  }

  return {
    source, target
  }
}

export function processImage(imagefile, options) {
  const source = path.join(__dirname, '../sources/img', imagefile)
       ,target = path.join(__dirname, '../img', imagefile).replace('.edited','')
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
      try {
        DEBUG(`  Second attempt using optimizing JPEG converter...`)
        convertJpegAndOptimize(source, target)
      }
      catch(e) {
        console.error('Failed: ' + (e.cmd||e))
        return false
      }
    }
    DEBUG(`"${target}" created.`)
  }

  // magick convert -auto-orient -resize '256x256' -quality 60 ./sources/img/africa/hornbills_nest.jpg ./img/africa/hornbills_nest.thumb.jpg
  if (!fs.existsSync(thumbnail) || overwrite) {
    try {
      run(`magick convert -strip -resize '256x256' -quality 60 "${target}" "${thumbnail}"`)
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

// A more robust conversion for JPEG images that avoids ImageMagick's
// breaking on corrupted XMP data (triggered by Google Camera's night vision
// feature) and optimizes the output image further + ensures progressive
// loading is enabled.
// This method explicitly maintains all useful EXIF data.
function convertJpegAndOptimize(source, target, options) {
  const { size, quality } = (options || {})

  DEBUG(`  Optimizing converter running:\n  ${source} -> ${target}`)

  let commands = [
    `jpegtran -outfile '${target}' '${source}'`,
    `exiv2 extract -ee -l '${path.dirname(target)}' '${source}'`,
    `exiv2 insert -ie -l '${path.dirname(target)}' -S .exv '${target}'`,
    `magick mogrify -auto-orient -resize '${size||"1920x1920"}' -quality ${quality||75} '${target}'`,
    `jpegtran -optimize -copy all -progressive -outfile '${target}' '${target}'`,
    `rm '${replaceExtension(target, '.exv')}'`
  ]

  commands.forEach(cmd => {
    run(cmd)
  })

}

function replaceExtension(source, newExt) {
  let p = path.parse(source)

  // Name and ext are ignored if this property exists
  delete p.base

  // Replace extension part and return re-assembled path
  p.ext = newExt

  return path.format(p)
}
function gifv(path) {
  return replaceExtension(path, '.gifv')
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
