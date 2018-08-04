import * as fs from 'fs'

export type Path = string
export type Hash = string
export type Data = string
export type Topic = string

export type Listener = (hash: Hash, data: Data) => void
export type Subscriber = (data: Data) => void
export type Subscribers = {[key: string]: Subscriber}

export interface Result {
  hash: Hash
  data?: fs.ReadStream
  error?: string
}
