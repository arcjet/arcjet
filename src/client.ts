import {sha3_256, sha3_512} from 'js-sha3'
import axios from 'axios'
const sphincs = require('sphincs')

import {parseRecord} from './parser'
import {hexToBytes} from './client_utils'
import {HashHash} from './types'

export default class Arcjet {
  host: string

  owners: HashHash = {}

  constructor(host: string = 'http://127.0.0.1:3000') {
    this.host = host
  }

  public async generate() {
    return await axios.post(`${this.host}/generate`, null, {
      withCredentials: true,
    })
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

  public async set(data: string, tag: string) {
    const res = await axios.post(`${this.host}/store/${tag}`, data, {
      withCredentials: true,
    })
    return await res.data
  }

  public async owner() {
    const res = await axios.get(`${this.host}/owner`, {withCredentials: true})
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
      console.log('results', results)
      return results as any
    }
    return ['404']
  }
}
