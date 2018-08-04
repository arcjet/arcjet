import * as fs from 'fs'
import * as readline from 'readline'
import {sha3_256} from 'js-sha3'
import {strict as assert} from 'assert'

import {Path, Hash, Data, Result} from './types'
import {open, close, appendFile} from './utils'

export type HashInt = {[hash: string]: number}

class Store {
  private positions: HashInt = {}
  private lengths: HashInt = {}
  private path: Path
  private dblen: number = 0
  private shaLength = 64

  public open = async (path: Path = this.path): Promise<number> =>
    await open(path, 'a+')
  public close = async (fd: number): Promise<void> => await close(fd)

  private update(hash: Hash, length: number) {
    this.positions[hash] = this.dblen
    this.lengths[hash] = length
    this.dblen = this.dblen + this.shaLength + 1 + length + 1
  }

  public init = (path: Path) =>
    new Promise(async (resolve, reject) => {
      try {
        this.path = path
        const instream = fs.createReadStream(path, 'utf8')
        const rl = readline.createInterface(instream)

        rl.on('line', line => {
          const hash = line.substr(0, this.shaLength)
          this.update(hash, line.length - 1 - this.shaLength)
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

  public async set(data: Data): Promise<Hash> {
    assert.ok(typeof data === 'string')
    assert.ok(data.length > 0)

    const hash = sha3_256(data)

    if (this.lengths[hash] && this.lengths[hash] > 0) {
      return hash
    }

    const fd = await this.open()
    await appendFile(fd, `${hash} ${data}\n`, 'utf8')
    this.update(hash, data.length)
    await this.close(fd)
    return hash
  }

  public async get(hash: Hash): Promise<Result> {
    assert.ok(typeof hash === 'string')
    assert.ok(hash.length === 64)

    const position = this.positions[hash]
    const length = this.lengths[hash]
    const readLength = this.shaLength + 1 + length

    if (!position && !length) {
      return {
        hash,
        data: undefined,
        error: 'NOTFOUND',
      }
    }

    const stream = fs.createReadStream(this.path, {
      encoding: 'utf8',
      start: position + this.shaLength + 1,
      end: position + readLength,
    })

    return {
      hash,
      data: stream,
    }
  }
}

export default Store
