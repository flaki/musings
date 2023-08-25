#!/usr/bin/env node

import * as S3 from './src/s3.js'


let MODE = 'all'
if (process.argv[2]) {
  if (!['sources','media','all'].includes(process.argv[2])) {
    console.log('Usage: sync.js (sources|all)\n * sources: sync only sources\n * media: sync media only\n * all (default): sync sources & media')
    process.exit(1)
  } else {
    MODE = process.argv[2]
  }
}

if (MODE === 'sources') {
  S3.sync('sources/')

} else if (MODE === 'media') {
  S3.sync('media/')

} else if (MODE === 'all') {
  S3.sync()

}
