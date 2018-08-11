import * as fs from 'fs'
import * as readline from 'readline'
import {strict as assert} from 'assert'
import {sha3_256, sha3_512} from 'js-sha3'
const sphincs = require('sphincs')

import {
  Path,
  Hash,
  Data,
  Result,
  ArcjetCookies,
  HashInt,
  HashHash,
} from './types'
import {open, close, appendFile, arrToHex} from './utils'

class Store {
  private positions: HashInt = {}
  private lengths: HashInt = {}
  private owners: HashHash = {}
  private path: Path
  private dblen: number = 0
  private shaLength = 64
  private defaultOwnerHash = '0'.repeat(this.shaLength)

  public open = async (path: Path = this.path): Promise<number> =>
    await open(path, 'a+')
  public close = async (fd: number): Promise<void> => await close(fd)

  private update(hash: Hash, length: number, ownerHash: Hash) {
    this.positions[hash] = this.dblen
    this.lengths[hash] = length
    this.owners[ownerHash] = hash
    this.dblen = this.dblen + length
    console.log('hash', hash, 'length', length)
  }

  public init = (path: Path) =>
    new Promise(async (resolve, reject) => {
      try {
        this.path = path
        const instream = fs.createReadStream(path, 'utf8')
        const rl = readline.createInterface(instream)

        rl.on('line', line => {
          const hash = line.substr(0, this.shaLength)
          const ownerHash = line.substr(this.shaLength + 1, this.shaLength)
          this.update(hash, line.length + 1, ownerHash)
        })

        rl.on('close', () => {
          resolve()
        })

        rl.on('error', err => {
          reject(err)
        })
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })

  public async set(
    data: Data,
    auth: ArcjetCookies,
    encoding = 'utf8',
    type = 'text/plain',
    tag = ''
  ): Promise<Hash> {
    assert.ok(typeof data === 'string', 'Data must be of type string for now')
    assert.ok(data.length > 0, 'Data must not be empty')
    assert.ok(data.length <= 1_000_000_000, 'Data must not be larger than 1GB')
    assert.ok(data.includes('\t') === false, 'Data must encode all tabs')
    assert.ok(data.includes('\n') === false, 'Data must encode all newlines')
    assert.ok(
      auth.ARCJET_OWNER_HASH.length === this.shaLength,
      'Supplied Owner Hash invalid'
    )
    assert.ok(
      encoding.length <= 32,
      'Encoding length must be less than or equal to 32 characters'
    )
    assert.ok(
      type.length <= 32,
      'Type length must be less than or equal to 32 characters'
    )
    assert.ok(
      tag.length <= 32,
      'Tag length must be less than or equal to 32 characters'
    )
    assert.ok(tag.length > 0, 'Tag must be provided')

    const dataHash = sha3_512(data)

    const signature = arrToHex(
      await sphincs.sign(dataHash, auth.ARCJET_PRIVATE_KEY)
    )

    assert.ok(
      signature.length === 82256,
      'SPHINCS cryptographic signature must be 82k in length'
    )

    const ownerHash = auth.ARCJET_OWNER_HASH
    const parentHash = this.owners[ownerHash] || this.defaultOwnerHash

    const record = [
      ownerHash, // 64
      parentHash, // 64
      dataHash, // 128
      encoding.padEnd(32, ' '), // 32
      type.padEnd(32, ' '), // 32
      tag.padEnd(32, ' '), // 32
      signature, // 82256
      data, // <1000000000 (1GB)
    ].join('\t')

    const recordHash = sha3_256(record)

    if (this.lengths[recordHash] && this.lengths[recordHash] > 0) {
      return recordHash
    }

    const recordString = [recordHash, record].join('\t') + '\n'

    const fd = await this.open()
    await appendFile(fd, recordString, 'utf8')
    this.update(recordHash, recordString.length, ownerHash)
    await this.close(fd)
    return recordHash
  }

  public async get(hash: Hash): Promise<Result> {
    assert.ok(typeof hash === 'string')
    assert.ok(hash.length === this.shaLength)

    const position = this.positions[hash]
    const length = this.lengths[hash]

    if (!position && !length) {
      return {
        hash,
        data: undefined,
        error: 'NOTFOUND',
      }
    }

    const stream = fs.createReadStream(this.path, {
      encoding: 'utf8',
      start: position,
      end: position + length - 2,
    })

    return {
      hash,
      data: stream,
    }
  }
}

export default Store
