import * as nacl from 'tweetnacl'
// import * as QRCode from 'qrcode'
import * as qs from 'querystring'

import {
  assert,
  hexToBytes,
  bytesToHex,
  strToBytes,
  bytesToBlob,
} from './client_utils'
import {ArcjetStorageKeys, ArcjetStorage, IFind, RecordMetadata} from './types'
import {Record} from './record'

const hashAsByteArray = (data: string): Uint8Array =>
  nacl.hash(hexToBytes(data))

const hashAsString = (data: string): string => bytesToHex(hashAsByteArray(data))

export default class Arcjet {
  public host: string

  private shaLength = 64
  private emptyHash: string
  private siteHash: string

  constructor(host: string = 'http://127.0.0.1:3000', siteHash?: string) {
    this.emptyHash = '0'.repeat(this.shaLength)
    this.host = host
    this.siteHash = siteHash || hashAsString(window.location.hostname)
  }

  // private download(data: string) {
  //   var link = document.createElement('a')
  //   link.download = 'filename.png'
  //   link.href = data
  //   link.click()
  // }

  private async save(keys: any) {
    localStorage.setItem(ArcjetStorageKeys.ARCJET_PUBLIC_KEY, keys.publicKey)
    localStorage.setItem(ArcjetStorageKeys.ARCJET_PRIVATE_KEY, keys.privateKey)
  }

  private load(): ArcjetStorage {
    const ARCJET_PUBLIC_KEY = localStorage.getItem(
      ArcjetStorageKeys.ARCJET_PUBLIC_KEY
    )
    const ARCJET_PRIVATE_KEY = localStorage.getItem(
      ArcjetStorageKeys.ARCJET_PRIVATE_KEY
    )

    if (ARCJET_PUBLIC_KEY && ARCJET_PRIVATE_KEY) {
      return {
        ARCJET_PUBLIC_KEY,
        ARCJET_PRIVATE_KEY,
      }
    } else {
      throw 'No Auth Data'
    }
  }

  public get user(): string {
    const user = localStorage.getItem(ArcjetStorageKeys.ARCJET_PUBLIC_KEY)
    if (user) {
      return user
    } else {
      throw new Error('No user')
    }
  }

  public async generate() {
    try {
      const keys = nacl.sign.keyPair()
      const privateKey = bytesToHex(keys.secretKey)
      const publicKey = bytesToHex(keys.publicKey)
      // const qr = await QRCode.toDataURL(privateKey)
      // if (document) this.download(qr)
      if (localStorage) await this.save({privateKey, publicKey})
    } catch (err) {
      console.error(err)
    }
  }

  public async setstr(content: string, metadata: RecordMetadata) {
    this.set(strToBytes(content), metadata)
  }

  public async setbin(content: Uint8Array, metadata: RecordMetadata) {
    this.set(content, metadata)
  }

  // TODO better error handling
  private set = async (
    content: Uint8Array,
    {
      site = this.siteHash,
      link = this.emptyHash,
      tag = '',
      time = Date.now(),
      type = 'text/plain',
      version = '0.0.0',
      network = 'mainnet',
    }: RecordMetadata
  ) => {
    const {
      ARCJET_PUBLIC_KEY: user,
      ARCJET_PRIVATE_KEY: privateKey,
    } = this.load()

    const record = new Record(
      content,
      {
        user,
        site,
        link,
        tag,
        time,
        type,
        version,
        network,
      },
      hexToBytes(privateKey)
    )

    const res = await fetch(`${this.host}/store`, {
      method: 'POST',
      body: bytesToBlob(record.data, type),
    })

    const recID = await res.text()
    assert(
      record.id === recID,
      'Record hash from server must match computed record hash'
    )

    return recID
  }

  public get = async (recordHash: string): Promise<Record> => {
    const res = await fetch(`${this.host}/store/${recordHash}`)
    if (res.status === 200) {
      const bytes = await res.arrayBuffer()
      return new Record(new Uint8Array(bytes))
    } else {
      throw new Error(res.statusText)
    }
  }

  public find = async (query: IFind): Promise<string[] | Record[]> => {
    const res = await fetch(`${this.host}/find?${qs.stringify(query)}`)
    if (res.status === 200) {
      const response = await res.text()
      const records = response.split('\n')
      if (query.hydrate === false) {
        return records
      }
      const results = await Promise.all(records.map(this.get))
      return results
    } else {
      throw new Error(res.statusText)
    }
  }
}
