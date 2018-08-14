import {sha3_256, sha3_512} from 'js-sha3'
import axios from 'axios'
const sphincs = require('sphincs')
import * as QRCode from 'qrcode'

import {parseRecord} from './parser'
import {hexToBytes, bytesToHex} from './client_utils'
import {HashHash, SphincsKeys, ArcjetStorageKeys, ArcjetStorage} from './types'

export default class Arcjet {
  public host: string

  private owners: HashHash = {}
  private shaLength = 64
  private defaultOwnerHash = '0'.repeat(this.shaLength)

  constructor(host: string = 'http://127.0.0.1:3000') {
    this.host = host
  }

  private async getCurrentParentHash(owner: string): Promise<string> {
    const {data} = await axios.get(`${this.host}/parent/${owner}`)
    return data
  }

  private download(data: string) {
    var link = document.createElement('a')
    link.download = 'filename.png'
    link.href = data
    link.click()
  }

  private async save(keys: any) {
    localStorage.setItem(ArcjetStorageKeys.ARCJET_PUBLIC_KEY, keys.publicKey)
    localStorage.setItem(ArcjetStorageKeys.ARCJET_PRIVATE_KEY, keys.privateKey)
    localStorage.setItem(
      ArcjetStorageKeys.ARCJET_OWNER_HASH,
      this.defaultOwnerHash
    )
    const ownerHash = await this.set(keys.publicKey, 'owner')
    localStorage.setItem(ArcjetStorageKeys.ARCJET_OWNER_HASH, ownerHash)
  }

  private load(): ArcjetStorage {
    const ARCJET_OWNER_HASH = localStorage.getItem(
      ArcjetStorageKeys.ARCJET_OWNER_HASH
    )
    const ARCJET_PUBLIC_KEY = localStorage.getItem(
      ArcjetStorageKeys.ARCJET_PUBLIC_KEY
    )
    const ARCJET_PRIVATE_KEY = localStorage.getItem(
      ArcjetStorageKeys.ARCJET_PRIVATE_KEY
    )

    if (ARCJET_OWNER_HASH && ARCJET_PUBLIC_KEY && ARCJET_PRIVATE_KEY) {
      return {
        ARCJET_OWNER_HASH,
        ARCJET_PUBLIC_KEY,
        ARCJET_PRIVATE_KEY,
      }
    } else {
      throw 'No Auth Data'
    }
  }

  public owner() {
    return localStorage.getItem(ArcjetStorageKeys.ARCJET_OWNER_HASH)
  }

  public async generate() {
    try {
      const keys: SphincsKeys = await sphincs.keyPair()
      const privateKey = bytesToHex(keys.privateKey)
      const publicKey = bytesToHex(keys.publicKey)
      const qr = await QRCode.toDataURL(privateKey)
      if (document) this.download(qr)
      if (localStorage) await this.save({privateKey, publicKey})
    } catch (err) {
      console.error(err)
    }
  }

  public validate = async (record: string): Promise<string> => {
    const {recordHash, ownerHash, dataHash, signature, data} = parseRecord(
      record
    )
    let ownerPublicKey = this.owners[ownerHash]

    if (!ownerPublicKey) {
      const {data} = await axios.get(`${this.host}/store/${ownerHash}`)
      ownerPublicKey = parseRecord(data).data
      console.log('ownerPublicKey', ownerPublicKey)
    }

    const recDataHash = sha3_512(data)
    const recRecordHash = sha3_256(record.substr(65))
    const verified = await sphincs.open(
      hexToBytes(signature),
      hexToBytes(ownerPublicKey)
    )

    if (
      verified &&
      verified.length === 64 &&
      recDataHash === dataHash &&
      recRecordHash === recordHash
    ) {
      return data
    } else {
      return '400'
    }
  }

  public async get(hash: string): Promise<string> {
    const chunks = []
    const res = await axios.get(`${this.host}/store/${hash}`)

    if (res.status === 200 && res.data) {
      const reader = res.data.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const result = await reader.read()
        const chunk = decoder.decode(result.value || new Uint8Array(), {
          stream: !result.done,
        })
        chunks.push(chunk)
        done = result.done
      }

      const record = chunks.join('')

      return await this.validate(record)
    }

    return '404'
  }

  public async set(
    data: string,
    tag: string,
    encoding = 'utf-8',
    type = 'text/plain'
  ) {
    const {
      ARCJET_OWNER_HASH: ownerHash,
      ARCJET_PRIVATE_KEY: privateKey,
    } = this.load()
    const dataHash = sha3_512(data)

    let parentHash
    if (ownerHash === this.defaultOwnerHash) {
      parentHash = this.defaultOwnerHash
    } else {
      parentHash = await this.getCurrentParentHash(ownerHash)
    }

    const signature = await sphincs.sign(dataHash, privateKey)

    const record = [
      ownerHash, // 64
      parentHash, // 64, for CAS
      dataHash, // 128
      encoding.padEnd(32, ' '), // 32
      type.padEnd(32, ' '), // 32
      tag.padEnd(32, ' '), // 32
      signature, // 82256
      data, // <1000000000 (1GB)
    ].join('\t')

    const recordHash = sha3_256(record)
    const recordString = [recordHash, record].join('\t')

    const res = await axios.post(`${this.host}/store`, recordString)
    return await res.data
  }

  public async findByTag(
    ownerHash: string,
    tag: string,
    limit?: number,
    offset?: number
  ): Promise<string[]> {
    const url = [this.host, 'find', ownerHash, tag]
    if (limit) url.push(limit.toString())
    if (limit && offset) url.push(offset.toString())
    const res = await axios.get(url.join('/'))
    if (res.status === 200) {
      const response = await res.data
      const records = response.split('\n')
      const results = await Promise.all(records.map(this.validate))
      return results as any
    }
    return ['404']
  }
}
