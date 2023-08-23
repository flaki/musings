import * as S3 from './src/s3.js'


let MODE = 'all'
if (process.argv[2]) {
  if (process.argv[2] != 'sources' && process.argv[2] != 'all') {
    console.log('Usage: sync.js (sources|all)\n * sources: sync only sources\n * all (default): sync sources & media')
    process.exit(1)
  } else {
    MODE = process.argv[2]
  }
}

if (MODE === 'sources') {
  S3.sync('sources')

} else if (MODE === 'all') {
  S3.sync()

}

// List all object paths in bucket my-bucketname.
// const objectsStream = S3.list()
// objectsStream.on('data', async function (obj) {
//   // Ignore folders created as 0b files by s3fs
//   if (obj.size) {
//     const match = await S3.verifyLocalData(obj.name, obj.etag, obj.size)

//     console.log(`${match ? ' ' : '⚠️'}  ${obj.name} (${obj.size}b | ${obj.etag})`)

//     // media/* will only exist in the temporary build folder and should be synced accordingly
//   }
// })
// objectsStream.on('error', function (e) {
//   console.log(e)
// })

// console.log(await S3.posts())


function getPartSize(size) {
  let partSize = this.partSize
    for (;;) {
      // while(true) {...} throws linting error.
      // If partSize is big enough to accomodate the object size, then use it.
      if (partSize * 10000 > size) {
        return partSize
      }
      // Try part sizes as 64MB, 80MB, 96MB etc.
      partSize += 16 * 1024 * 1024
    }
}