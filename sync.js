import { Client as MinioClient } from 'minio'
import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

const endPoint = process.env['S3_ENDPOINT'] ?? 's3.flak.is'
const accessKey = process.env['S3_ACCESS']
const secretKey = process.env['S3_SECRET']
const bucketName = process.env['S3_BUCKET'] ?? 'musings'

const s3Client = new MinioClient({
  endPoint,
  accessKey,
  secretKey,
})

// List all object paths in bucket my-bucketname.
const objectsStream = s3Client.listObjectsV2(bucketName, '', true, '')
objectsStream.on('data', function (obj) {
  // Folders are created as 0b files by s3fs
  if (obj.size) {
    const path = join(__dirname, 'data', obj.name)
    const pathExists = fs.existsSync(path)

    console.log(`${pathExists ? '✓' : ' '}  ${obj.name} (${obj.size}b)`)

    // media/* will only exist in the temporary build folder and should be synced accordingly
  }
})
objectsStream.on('error', function (e) {
  console.log(e)
})
