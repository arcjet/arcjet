import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import {strict as assert} from 'assert'

import {Path, Hash, RecordMetadata} from './types'
import {readFile, writeFile, appendFile} from './server_utils'
import {strToBytes, bytesToHex} from './client_utils'
import {Record} from './record'

class Store {
  private path: Path
  public shaLength = 64
  public emptyHash = '0'.repeat(this.shaLength)

  constructor(path: Path) {
    this.path = path
  }

  // TODO more checking, maybe
  public async set(data: Buffer): Promise<Hash> {
    const record = new Record(data)
    await writeFile(path.resolve(this.path, record.id), record.data, {
      encoding: 'binary',
    })
    await appendFile(
      path.resolve(this.path, 'index.db'),
      bytesToHex(record.index) + '\n',
      'utf8'
    )
    return record.id
  }

  // TODO typing in type signature
  public async get(hash: string): Promise<string> {
    assert.ok(typeof hash === 'string', 'record hash must be a string')
    assert.ok(
      hash.length === this.shaLength,
      'record hash must be 64 bytes in length'
    )
    const buffer = await readFile(path.resolve(this.path, hash), {
      encoding: 'binary',
    })
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

      const instream = fs.createReadStream(
        path.resolve(this.path, 'index.db'),
        'utf8'
      )
      const rl = readline.createInterface(instream)

      rl.on('line', line => {
        const record = new Record(strToBytes(line))
        if (
          user &&
          record.user !== user &&
          site &&
          record.site !== site &&
          link &&
          record.link !== link &&
          tag &&
          record.tag !== tag &&
          time &&
          +record.time !== +time &&
          type &&
          record.type !== type &&
          version &&
          record.version !== version &&
          network &&
          record.network !== network
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
