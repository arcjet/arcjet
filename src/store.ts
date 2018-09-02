import * as fs from 'fs'
import * as readline from 'readline'
import {strict as assert} from 'assert'
import * as nacl from 'tweetnacl'

import {Path, Hash, HashInt, HashSet, IFind, IUpdate} from './types'
import {open, close, read, appendFile} from './utils'
import {hexToBytes, bytesToHex} from './client_utils'
import {parseRecord, formatDataRecord, formatRecord} from './format'

const hashAsByteArray = (data: string): Uint8Array =>
  nacl.hash(hexToBytes(data))

const hashAsString = (data: string): string => bytesToHex(hashAsByteArray(data))

class Store {
  private positions: HashInt = {}
  private lengths: HashInt = {}
  private ownerHashes: HashSet = {}
  private siteHashes: HashSet = {}
  private linkHashes: HashSet = {}
  private dataHashes: HashSet = {}
  private tags: HashSet = {}
  private path: Path
  private dblen: number = 0
  public shaLength = 128
  public emptyHash: string

  public open = async (path: Path = this.path): Promise<number> =>
    await open(path, 'a+')
  public close = async (fd: number): Promise<void> => await close(fd)

  private updateSet(set: HashSet, key: string, value: string) {
    set[key] ? set[key].add(value) : (set[key] = new Set([value]))
  }

  private update({
    recordHash,
    ownerHash,
    siteHash,
    linkHash,
    dataHash,
    tag,
    length,
  }: IUpdate) {
    // Data access
    this.positions[recordHash] = this.dblen
    this.lengths[recordHash] = length
    this.dblen = this.dblen + length

    // Indexing for find method
    this.updateSet(this.ownerHashes, ownerHash, recordHash)
    this.updateSet(this.siteHashes, siteHash, recordHash)
    this.updateSet(this.linkHashes, linkHash, recordHash)
    this.updateSet(this.dataHashes, dataHash, recordHash)
    this.updateSet(this.tags, tag, recordHash)

    console.log('tag', tag, 'recordHash', recordHash, 'length', length)
  }

  public init = (path: Path) =>
    new Promise(async (resolve, reject) => {
      this.emptyHash = '0'.repeat(this.shaLength)
      try {
        this.path = path
        const instream = fs.createReadStream(path, 'utf8')
        const rl = readline.createInterface(instream)

        rl.on('line', line => {
          const {
            recordHash,
            ownerHash,
            siteHash,
            linkHash,
            dataHash,
            tag,
          } = parseRecord(line)
          this.update({
            recordHash,
            ownerHash,
            siteHash,
            linkHash,
            dataHash,
            tag,
            length: line.length + 1,
          })
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
      siteHash,
      linkHash,
      dataHash,
      encoding,
      type,
      tag,
      version,
      network,
      time,
      signature,
      data,
    } = parseRecord(record)
    assert.ok(typeof data === 'string', 'Data must be of type string for now')
    assert.ok(data.length > 0, 'Data must not be empty')
    assert.ok(data.length <= 1_000_000_000, 'Data must not be larger than 1GB')
    assert.ok(data.includes('\t') === false, 'Data must encode all tabs')
    assert.ok(data.includes('\n') === false, 'Data must encode all newlines')
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
    // TODO more validations

    const dataRecordString = formatDataRecord({
      signature,
      ownerHash,
      siteHash,
      linkHash,
      dataHash,
      encoding,
      type,
      tag,
      version,
      network,
      time,
      data,
    })

    const validatedRecordHash = hashAsString(dataRecordString)

    if (
      this.lengths[validatedRecordHash] &&
      this.lengths[validatedRecordHash] > 0
    ) {
      return validatedRecordHash
    }

    const recordString =
      formatRecord({
        recordHash: validatedRecordHash,
        recordString: dataRecordString,
      }) + '\n'

    this.update({
      recordHash,
      ownerHash,
      siteHash,
      linkHash,
      dataHash,
      tag,
      length: recordString.length,
    })

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

  public async find({
    ownerHash,
    siteHash,
    linkHash,
    dataHash,
    tag,
    limit,
    offset,
  }: IFind): Promise<string> {
    let hash

    // if () {

    // }
    // else {
    //   throw new Error('404')
    // }

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
}

export default Store
