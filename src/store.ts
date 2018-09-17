import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import {strict as assert} from 'assert'

import {Path, Hash, RecordMetadata} from './types'
import {
  readFile,
  writeFile,
  appendFile,
  touch,
  mkdir,
  exists,
} from './server_utils'
import {hexToBytes, bytesToHex} from './client_utils'
import {Record} from './record'

class Store {
  private dbdir: Path
  private dbpath: Path
  public shaLength = 64
  public emptyHash = '0'.repeat(this.shaLength)

  constructor(dir: Path) {
    this.dbdir = dir
    this.dbpath = path.resolve(dir, 'index.db')
    this.touch()
  }

  private async touch() {
    if (!(await exists(this.dbdir))) await mkdir(this.dbdir)
    if (!(await exists(this.dbpath))) await touch(this.dbpath)
  }

  // TODO more checking, maybe
  public async set(data: Buffer): Promise<Hash> {
    const record = new Record(data)
    await writeFile(path.resolve(this.dbdir, record.id), record.data, 'binary')

    await appendFile(this.dbpath, bytesToHex(record.index) + '\n', 'utf8')
    return record.id
  }

  // TODO typing in type signature
  public async get(hash: string): Promise<string> {
    assert.ok(typeof hash === 'string', 'record hash must be a string')
    assert.ok(
      hash.length === this.shaLength * 2,
      'record hash must be 64 bytes in length'
    )
    const buffer = await readFile(path.resolve(this.dbdir, hash), 'binary')
    // const record = new Record(Buffer.from(buffer, 'binary'))
    // if (record.tag === 'profile') console.log(record.string)
    return buffer
  }

  public async find({
    user,
    site,
    link,
    tag,
    time,
    type,
    version,
    network,
  }: RecordMetadata): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let results: string[] = []

      const instream = fs.createReadStream(this.dbpath, 'utf8')
      const rl = readline.createInterface(instream)

      rl.on('line', line => {
        const record = new Record(hexToBytes(line))
        console.log('record.id', record.id)
        console.log('record.sig', record.sig)
        console.log('record.hash', record.hash)
        console.log('record.user', record.user)
        console.log('record.site', record.site)
        console.log('record.link', record.link)
        console.log('record.tag', record.tag)
        console.log('record.time', record.time)
        console.log('record.type', record.type)
        console.log('record.version', record.version)
        console.log('record.network', record.network)
        if (
          (user && record.user !== user) ||
          (site && record.site !== site) ||
          (link && record.link !== link) ||
          (tag && record.tag !== tag) ||
          (time && +record.time !== +time) ||
          (type && record.type !== type) ||
          (version && record.version !== version) ||
          (network && record.network !== network)
        ) {
          return
        }
        results.push(record.id)
      })

      rl.on('close', () => {
        resolve(results.join('\n'))
      })

      rl.on('error', err => {
        reject(err)
      })
    })
  }
}

export default Store
