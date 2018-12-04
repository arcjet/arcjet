import * as fs from 'fs'
import { promisify } from 'util'

export const open = promisify(fs.open)
export const close = promisify(fs.close)
export const read = promisify(fs.read)
export const appendFile = promisify(fs.appendFile)

export const awaitOn = <R extends any, T extends {}>(
  stream: R,
  event: string,
): Promise<T> =>
  new Promise((resolve, reject) => {
    stream.on(event, (data: T) => {
      resolve(data)
    })

    stream.on('error', (err: string) => {
      reject(err)
    })
  })

export const getFixedHex = (num: number, length: number) =>
  num.toString(16).padStart(length, '0')

export const arrToHex = (arr: Uint8Array): string =>
  Buffer.from(arr).toString('hex')
