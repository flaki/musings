import { Client as MinioClient } from 'minio'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { join, relative } from 'node:path'

import { DATA } from './site-config.js'

export const BUCKET = process.env['S3_BUCKET'] ?? 'musings'

const endPoint = process.env['S3_ENDPOINT'] ?? 's3.flak.is'
const accessKey = process.env['S3_ACCESS']
const secretKey = process.env['S3_SECRET']

const s3Client = new MinioClient({
  endPoint,
  accessKey,
  secretKey,
})

// List all objects in bucket (by default) 
export function list(prefix = '', recursive = true) {
	return s3Client.listObjectsV2(BUCKET, prefix, recursive)
}

// Collect all posts found in the bucket, async, returns an array 
export async function posts(prefix = '', recursive = true) {
	const stream = s3Client.listObjectsV2(BUCKET, prefix, recursive)

	const ret = []
	const process = function(o) {
		if (o?.name.endsWith('.md')) ret.push(o)
	}

	return new Promise((resolve, reject) => {
		stream.on('data', process)
		stream.on('end', o => { process(o); resolve(ret) })
		stream.on('error', (err) => { console.log(err); reject(err) })
	})
}

export function getLocalPath(s3name) {
		if (!s3name) return DATA

    // media/*
    if (s3name.startsWith('media/')) return join(DATA, 'www/img', s3name.substr(6))
    
    // sources/*
    return join(DATA, s3name)
}

export function getS3Name(localPath) {
	const rel = relative(DATA, localPath)

	// media/*
	if (rel.startsWith('www/img/')) return join('media', rel.substr(8))

	// sources/*
	return rel
}

// Checks if the local version of the file is the same that is stored in S3
export async function verifyLocalData(s3name, etag, size = 0) {
	const localPath = getLocalPath(s3name)

  let localStat
  try {
	  localStat = await fs.stat(localPath)
  }
  catch(e) {
  	// Local file doesn't exist or is inaccessible
  	console.error(e.message)
  	return false
  }

	// Short-circuit if size (optional) is specified: if file sizes differ the files cannot be the same
	// TODO: is this always true?
	if (size && size !== localStat.size) return localStat

  // Minio etags are MD5 hashes of the file, except for multipart uploads (format: HASH-{number})
	// https://pkg.go.dev/github.com/minio/minio/internal/etag
  let localHash
  if (etag.includes('-')) {
    // Single-chunk upload, hash of hash plus '-1'
    if (etag.endsWith('-1')) {
      const content = await fs.readFile(localPath)
      localHash = md5(createHash('md5').update(content).digest())+'-1'

    // TODO: calculate partSize and do chunked md5
    } else {
    	// Consumer should check the returned result with === true
      return undefined
    }
  } else {
    const content = await fs.readFile(localPath)
    localHash = md5(content)
  }

  // If the hashes match the files are the same
  //DEBUG//console.log(s3name+'\n'+localHash+'\n'+etag+'\n')
  return (localHash === etag) ? true : localStat
}

export async function sync(prefix = '', recursive = true) {
	const stream = list(prefix, recursive)
	console.log(`Syncing ${prefix || 'everything'} ...`)

	// Read local file list
	const localFiles = new Map()
	try {
		// If prefix is empty this reads all in DATA
  	// { recursive: true } silently ignored/buggy in v18.13
		///await fs.readdir(localRoot, /*{ recursive: true }*/))
  	const localRoot = getLocalPath(prefix)
  	console.log(`Sync root: ${localRoot}`)
  	const readSubdirs = (arr) => {
  		const newArr = arr.map(p =>
  			fs.readdir(join(localRoot, p))
  				.then(subpaths => Promise.all(
  					readSubdirs(
  						subpaths.map(subp => join(p, subp))
  					)
  				))
  				.catch(_ => [p])
  		)
  		//DEBUG//console.log(localRoot+'/', arr, ' => ', newArr)
  		return newArr
  	}
  	const r = await readSubdirs([''])
  	const files = (await Promise.all(r)).flat(Infinity).map(p => join(localRoot, p))
  	//DEBUG//console.log('files:', JSON.stringify(files,null,4))
  	
  	for (const file of files) {
  		localFiles.set(file, { path: file, s3name: null })
  	}
	} catch (err) {
	  console.error(err);
	} 

	const processS3 = async function(o) {
		// Nothing to process
		if (!o) {
			return
		}

		// Ignore size = 0
		// TODO: are we sure this is this ok?
		if (o.size === 0) {
			console.log(`${o.name} ignored, zero filesize`)
			return
		}

		// Check if already exists locally
		const matchOrStat = await verifyLocalData(o.name, o.etag, o.size)
		// It is the same file
		if (matchOrStat === true) {
			console.log('✔ '+o.name)

			// Update local match
			const lPath = getLocalPath(o.name)
			const l = localFiles.get(lPath)
			if (l) {
				l.s3name = o.name
			}

			return

		// File exists locally but the contents differ
		} else if (typeof matchOrStat === 'object') {
			console.log('⚠️ Needs syncing: '+o.name)

			const lPath = getLocalPath(o.name)
			const l = localFiles.get(lPath)
			if (!l) console.log('o=', o, 'matchOrStat=', matchOrStat, 'lPath=', lPath, localFiles)
			l.s3name = o.name

			//TODO: actual syncing
			// Use modify dates to decide which file to sync where
			// NOTE: this assumes correct datetime & timezone config both on server & client!
			l.lastModified = matchOrStat.mtime

			if (o.lastModified > l.lastModified) {
				console.log('↓ Download - file on S3 is newer', o.lastModified, '>', l.lastModified)

				const res = await s3Client.fGetObject(BUCKET, o.name, lPath, {})
				console.log('✓ Successfully downloaded '+o.name)
			} else {
				console.log('↥ Upload - local file is newer', o.lastModified, '<', l.lastModified)

				const res = await s3Client.fPutObject(BUCKET, l.s3name, lPath, {})
				console.log('✓ Successfully uploaded '+l.s3name, res)
			}

		// File does not exist locally
		} else {
			console.log('⚠️ Needs to be downloaded: '+o.name)

			const lPath = getLocalPath(o.name)
			const res = await s3Client.fGetObject(BUCKET, o.name, lPath, {})
			console.log('✓ Successfully downloaded '+o.name)
			//TODO: deleted files will sync back automatically, they should be moved to the trash for deletion
		}
	}

	const processLocal = async function(l) {
		if (l.s3name === null) {
			console.log('⚠️ Needs to be uploaded: '+l.path)

			l.s3name = getS3Name(l.path)

			const res = await s3Client.fPutObject(BUCKET, l.s3name, l.path, {})
			console.log('✓ Successfully uploaded '+l.s3name, res)
		}
	}

	// Collect objects in S3
	const s3Files = await new Promise((resolve, reject) => {
		const objects = []
		stream.on('data', o => objects.push(o))
		stream.on('end', o => {
			if (o) objects.push(o)
			resolve(objects)
		})

		stream.on('error', (err) => { console.log(err); reject(err) })
	})

	// Process S3 objects
	for (const o of s3Files) {
		await processS3(o)
	}

	// Process local files
	for (const f of localFiles.values()) {
		await processLocal(f)
	}

	//DEBUG//console.log(localFiles)
}

function md5(content) {
  const hashFunc = createHash('md5')
  hashFunc.update(content)
  return hashFunc.digest('hex')
}



// function getPartSize(size) {
//   let partSize = this.partSize
//     for (;;) {
//       // while(true) {...} throws linting error.
//       // If partSize is big enough to accomodate the object size, then use it.
//       if (partSize * 10000 > size) {
//         return partSize
//       }
//       // Try part sizes as 64MB, 80MB, 96MB etc.
//       partSize += 16 * 1024 * 1024
//     }
// }
