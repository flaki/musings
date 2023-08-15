import { execSync } from 'child_process'
import fs from 'fs-extra'
import { dirname, join, parse as parsePath, format as formatPath } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(dirname(fileURLToPath(import.meta.url)))



// Debugging
import { DEBUG } from './util/debug.js'


export function processPanorama(sourcefile, ) {
  const source = join(__dirname, './sources/img', sourcefile)
       ,target = join(__dirname, './img', sourcefile.replace('PANO@','')).replace('.edited','')
       ,storedpreview = replaceExtension(target, '.pano.jpg')
       ,targetpreview = replaceExtension(target, '.pano.jpg')

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
  const source = join(__dirname, './sources/img', sourcefile)
       ,target = join(__dirname, './img', gifv(sourcefile)).replace('.edited','')

  // Options
  const { overwrite, fallbackgif } = (options || {})

  // ffmpeg -i lobatse_rainstorm.gifv -vcodec libvpx -b:v 2M -an -auto-alt-ref 0 -f webm output.gifv
  if (!fs.existsSync(target) || overwrite) {
    // Make sure target dir exists
    fs.ensureDirSync(dirname(target))

    try {
      run(`ffmpeg -i ${source} -vcodec libvpx -b:v 2M -an -auto-alt-ref 0 -f webm ${target}`);
    }
    catch(e) {
      console.error('Failed: ', (e.cmd ?? e))
      return false
    }
    DEBUG(`"${target}" created.`)
  }

  return {
    source, target
  }
}

export function copyImage(imagefile, force) {
  const source = join(__dirname, './sources/img', imagefile)
       ,target = join(__dirname, './img', imagefile).replace('.edited','')

  // Make sure target dir exists
  fs.ensureDirSync(dirname(target))

  if (!fs.existsSync(target) || force) {
    DEBUG(`[copy] ${source} -> ${target}`)
    fs.copyFileSync(source, target)
  }
}

export function processImage(imagefile, options) {
  const source = join(__dirname, './sources/img', imagefile)
       ,target = join(__dirname, './img', imagefile).replace('.edited','')
       ,thumbnail = thumb(target)
       ,smallsize = small(target)

  const hasTarget = fs.existsSync(target)
       ,hasThumb = fs.existsSync(thumbnail)
       ,hasSmall = fs.existsSync(smallsize)

  // Options
  const { overwrite, fullwidth } = (options || {})

  // Not cached and no source, report an error
  if ((hasTarget&&hasThumb) === false && fs.existsSync(source) === false) {
    console.error(`"${source}" not found.`)
    return false
  }

  // (magick) convert -auto-orient -resize '1920x1920' -quality 75 ./sources/img/africa/hornbills_nest.jpg ./img/africa/hornbills_nest.jpg
  if (!hasTarget || overwrite) {
    // Make sure target dir exists
    fs.ensureDirSync(dirname(target))

    try {
      run(`convert -auto-orient -resize '1920x1920' -quality 75 "${source}" "${target}"`)
    }
    catch(e) {
      try {
        DEBUG(`  Second attempt using optimizing JPEG converter...`)
        convertJpegAndOptimize(source, target)
      }
      catch(e) {
        console.error('Failed: ', (e.cmd ?? e))
        return false
      }
    }
    DEBUG(`"${target}" created.`)
  }

  // (magick) convert -auto-orient -resize '256x256' -quality 60 ./sources/img/africa/hornbills_nest.jpg ./img/africa/hornbills_nest.thumb.jpg
  if (!hasThumb || overwrite) {
    try {
      run(`convert -strip -resize '256x256' -quality 60 "${target}" "${thumbnail}"`)
    }
    catch(e) {
      console.error('Failed: ', (e.cmd ?? e))
      return false
    }
    DEBUG(`"${thumbnail}" created.`)
  }

  // (magick) convert -auto-orient -resize '720x720' -quality 60 ./sources/img/africa/hornbills_nest.jpg ./img/africa/hornbills_nest.small.jpg
  if (fullwidth && (!hasSmall || overwrite)) {
    try {
      run(`convert -resize '720x720' -quality 75 "${target}" "${smallsize}"`)
    }
    catch(e) {
      console.error('Failed: ', (e.cmd ?? e))
      return false
    }
    DEBUG(`"${smallsize}" created.`)
  }

  return {
    source, target, thumbnail, smallsize
  }
}

export function processPng(sourcefile, options) {
  const source = join(__dirname, './sources/img', sourcefile)
       ,target = join(__dirname, './img', sourcefile).replace('.edited','')

  // Options
  const { overwrite } = (options || {})

  if (!fs.existsSync(target) || overwrite) {
    // Make sure target dir exists
    fs.ensureDirSync(dirname(target))
    fs.copyFileSync(source, target)
  }

  return {
    source, target
  }
}

export function processVideo(sourcefile, options) {
  const source = join(__dirname, './sources/img', sourcefile)
       ,target = join(__dirname, './img', sourcefile).replace('.edited','')
       ,poster = replaceExtension(target, '.poster.jpg')

  // Options
  const { overwrite, fallbackgif } = (options || {})

  // ffmpeg -i lobatse_rainstorm.gifv -vcodec libvpx -b:v 2M -an -auto-alt-ref 0 -f webm output.gifv
  if (!fs.existsSync(poster) || overwrite) {
    // Make sure target dir exists
    fs.ensureDirSync(dirname(target))

    // Create poster
    try {
      run(`ffmpeg -y -ss 1 -i ${source} -vframes 1 -q:v 5 ${poster}`)
    }
    catch(e) {
      console.error('Failed: ', e)
      return false
    }
    DEBUG(`"${target}" created.`)
  }

  // Copy video file to target location
  // TODO: transcoding?
  if (!fs.existsSync(target) || overwrite) {
    fs.copyFileSync(source, target)
  }
  const stat = fs.statSync(target);
  const size = (stat.size / 1024 / 1024).toFixed(1)+' MB';
  return {
    source, target, poster, size
  }
}

// A more robust conversion for JPEG images that avoids ImageMagick's
// breaking on corrupted XMP data (triggered by Google Camera's night vision
// feature) and optimizes the output image further + ensures progressive
// loading is enabled.
// This method explicitly maintains all useful EXIF data.
function convertJpegAndOptimize(source, target, options) {
  const { size, quality } = (options || {})

  DEBUG(`[optimize] ${source} -> ${target}`)

  let commands = [
    `jpegtran -outfile '${target}' '${source}'`,
// broken in various ways
//    `exiv2 extract '${path.dirname(target)}' --suffix .preview.exv '${source}'`,
//    `exiv2 --insert e --location '${path.dirname(target)}' '${target}'`,
    `mogrify -auto-orient -resize '${size||"1920x1920"}' -quality ${quality||75} '${target}'`,
    `jpegtran -optimize -copy all -progressive -outfile '${target}' '${target}'`,
//    `rm '${replaceExtension(target, '.exv')}'`
  ]

  commands.forEach(cmd => {
    run(cmd)
  })

}

function replaceExtension(source, newExt) {
  let p = parsePath(source)

  // Name and ext are ignored if this property exists
  delete p.base

  // Replace extension part and return re-assembled path
  p.ext = newExt

  return formatPath(p)
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
  DEBUG('$> '+cmd)
  return execSync(cmd)
}
