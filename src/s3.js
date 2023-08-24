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
    // media/*
    if (s3name.startsWith('media/')) return join(DATA, 'www/img', s3name.substr(6))
    
    // sources/*
    return join(DATA, s3name)
}
//TODO:
export function getS3Name(localPath) {
	const rel = relative(DATA, localPath)
	console.log(rel)
	// media/*
	//TODO

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
  	console.error(e)
  	return false
  }

	// Short-circuit if size (optional) is specified: if file sizes differ the files cannot be the same
	// TODO: is this always true?
	if (size && size !== localStat.size) return false

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

export async function sync(prefix, recursive = true) {
	const stream = list(prefix, recursive)
	console.log('Syncing '+prefix+' ...')

	// Read local file list
	const localFiles = new Map()
	try {
		// If prefix is empty this reads all in DATA
  	// { recursive: true } silently ignored/buggy in v18.13
		///await fs.readdir(localRoot, /*{ recursive: true }*/))
  	const localRoot = getLocalPath(prefix)
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
  	const files = (await Promise.all(r)).flat(Infinity).map(p => join(prefix, p))
  	//DEBUG//console.log('files:', JSON.stringify(files,null,4))
  	
  	for (const file of files) {
  		localFiles.set(getLocalPath(file), { path: file, s3name: null })
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
		if (o.size == 0) {
			return
		}

		// Check if already exists locally
		const localStat = await verifyLocalData(o.name, o.etag, o.size)
		// It is the same file
		if (localStat === true) {
			console.log('✔ '+o.name)

			// Update local match
			const lPath = getLocalPath(o.name)
			const l = localFiles.get(lPath)
			if (l) {
				l.s3name = o.name
			}

			return
		}

		console.log('⚠️ Needs syncing: '+o.name, o, localStat)
	}

	const processLocal = async function(f) {
		if (f.s3name === null) {
			console.log('⚠️ Needs to be uploaded: '+f.path)

			f.s3name = f.path

			const res = await s3Client.fPutObject(BUCKET, f.s3name, getLocalPath(f.path), {})
			console.log('✓ Successfully uploaded '+f.s3name, res)
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
