import * as fs from 'fs'
import * as readline from 'readline'
import {strict as assert} from 'assert'
import * as nacl from 'tweetnacl'

import {Path, Hash, HashInt, HashHash} from './types'
import {open, close, read, appendFile} from './utils'
import {hexToBytes, bytesToHex} from './client_utils'
import {parseRecord} from './parser'

const hashAsByteArray = (data: string): Uint8Array =>
  nacl.hash(hexToBytes(data))

const hashAsString = (data: string): string => bytesToHex(hashAsByteArray(data))

class Store {
  private positions: HashInt = {}
  private lengths: HashInt = {}
  private owners: HashHash = {}
  private path: Path
  private dblen: number = 0
  public shaLength = 128
  public emptyHash: string

  public open = async (path: Path = this.path): Promise<number> =>
    await open(path, 'a+')
  public close = async (fd: number): Promise<void> => await close(fd)

  private update(hash: Hash, length: number, ownerHash: Hash) {
    this.positions[hash] = this.dblen
    this.lengths[hash] = length
    this.owners[ownerHash === this.emptyHash ? hash : ownerHash] = hash
    this.dblen = this.dblen + length
    console.log('hash', hash, 'ownerHash', ownerHash, 'length', length)
  }

  public init = (path: Path) =>
    new Promise(async (resolve, reject) => {
      this.emptyHash = '0'.repeat(this.shaLength)
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

  public async set(record: string): Promise<Hash> {
    const {
      recordHash,
      ownerHash,
      parentHash,
      dataHash,
      encoding,
      type,
      tag,
      signature,
      data,
    } = parseRecord(record)
    assert.ok(typeof data === 'string', 'Data must be of type string for now')
    assert.ok(data.length > 0, 'Data must not be empty')
    assert.ok(data.length <= 1_000_000_000, 'Data must not be larger than 1GB')
    assert.ok(data.includes('\t') === false, 'Data must encode all tabs')
    assert.ok(data.includes('\n') === false, 'Data must encode all newlines')
    assert.ok(
      ownerHash.length === this.shaLength,
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
    assert.ok(hashAsString(data) === dataHash, 'dataHash must be valid')
    assert.ok(
      parentHash === this.getCurrentParent(ownerHash),
      'parentHash CAS error'
    )

    const verifiedRecord = [
      ownerHash, // 128
      parentHash, // 128
      dataHash, // 128
      encoding.padEnd(32, ' '), // 32
      type.padEnd(32, ' '), // 32
      tag.padEnd(32, ' '), // 32
      signature, // 82256
      data, // <1000000000 (1GB)
    ].join('\t')

    const verifiedRecordHash = hashAsString(verifiedRecord)

    if (
      this.lengths[verifiedRecordHash] &&
      this.lengths[verifiedRecordHash] > 0
    ) {
      return verifiedRecordHash
    }

    const recordString = [verifiedRecordHash, verifiedRecord].join('\t') + '\n'

    this.update(recordHash, recordString.length, ownerHash)

    const fd = await this.open()
    await appendFile(fd, recordString, 'utf8')
    await this.close(fd)
    return recordHash
  }

  public async get(hash: Hash): Promise<string> {
    assert.ok(typeof hash === 'string', 'record hash must be a string')
    assert.ok(
      hash.length === this.shaLength,
      'record hash must be 128 characters in length'
    )

    const position = this.positions[hash]
    const length = this.lengths[hash]

    if (!position && !length) {
      throw 'Record Not Found'
    }

    let recordBuffer = Buffer.alloc(length, 'utf8')
    const fd = await this.open(this.path)
    const {buffer} = await read(fd, recordBuffer, 0, length, position)
    const recordString = buffer.toString('utf8')
    return recordString
  }

  public async getStream(hash: Hash): Promise<fs.ReadStream> {
    assert.ok(typeof hash === 'string', 'record hash must be a string')
    assert.ok(
      hash.length === this.shaLength,
      'record hash must be 128 characters in length'
    )

    const position = this.positions[hash]
    const length = this.lengths[hash]

    if (!position && !length) {
      throw 'Record Not Found'
    }

    const stream = fs.createReadStream(this.path, {
      encoding: 'utf8',
      start: position,
      end: position + length - 2,
    })

    return stream
  }

  public async findByTag(
    ownerHash: Hash,
    tag: string,
    limit: number = 0,
    offset: number = 0
  ): Promise<string> {
    assert.ok(typeof ownerHash === 'string', 'owner hash must be a string')
    assert.ok(
      ownerHash.length === this.shaLength,
      'owner hash must be 128 characters in length'
    )
    assert.ok(typeof tag === 'string', 'tag must be a string')
    assert.ok(tag.length <= 32, 'tag must be 32 characters in length or less')

    let hash = this.owners[ownerHash]
    let position = this.positions[hash]
    let length = this.lengths[hash] - 1

    const fd = await this.open(this.path)

    const results: string[] = []

    let currentLimit = 0
    let currentOffset = 0

    let go = true

    while (hash !== this.emptyHash && go) {
      let recordBuffer = Buffer.alloc(length, 'utf8')
      const {buffer} = await read(fd, recordBuffer, 0, length, position)
      const recordString = buffer.toString('utf8')
      const record = parseRecord(recordString)
      hash = record.parentHash
      position = this.positions[hash]
      length = this.lengths[hash] - 1

      if (tag === record.tag) {
        currentOffset++
        if (offset === 0 || currentOffset > offset) {
          if (limit === 0 || currentLimit <= limit) {
            results.push(recordString)
            currentLimit++
          }
        }
      }

      if (limit !== 0 && currentLimit >= limit) {
        go = false
      }
    }

    await this.close(fd)

    return results.join('\n')
  }

  getCurrentParent(ownerHash: Hash) {
    return this.owners[ownerHash] || this.emptyHash
  }
}

export default Store
