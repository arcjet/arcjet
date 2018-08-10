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

export interface Key {
  privateKey: string
  publicKey: string
  hash: Hash
}

export interface ArcjetCookies {
  ARCJET_PRIVATE_KEY: string
  ARCJET_PUBLIC_KEY: string
  ARCJET_OWNER_HASH: string
}

export type FalsyString = string | false
export type HashInt = {[hash: string]: number}
export type HashHash = {[hash: string]: Hash}
