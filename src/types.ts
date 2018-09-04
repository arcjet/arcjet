export type Path = string
export type Hash = string
export type Signature = string
export type Data = string
export type Topic = string

export type Listener = (hash: Hash, data: Data) => void
export type Subscriber = (data: Data) => void
export type Subscribers = {[key: string]: Subscriber}

export interface Key {
  privateKey: string
  publicKey: string
  hash: Hash
}

export interface ArcjetStorage {
  ARCJET_PRIVATE_KEY: string
  ARCJET_PUBLIC_KEY: string
}
export enum ArcjetStorageKeys {
  ARCJET_PRIVATE_KEY = 'ARCJET_PRIVATE_KEY',
  ARCJET_PUBLIC_KEY = 'ARCJET_PUBLIC_KEY',
}
export type FalsyArcjetStorage = ArcjetStorage | undefined

export type FalsyString = string | false
export type HashHash = {[hash: string]: Hash}
export type HashInt = {[hash: string]: number}
export type HashBool = {[hash: string]: boolean}
export type HashBytes = {[hash: string]: Uint8Array}
export type HashSet = {[hash: string]: Set<Hash>}

export interface RecordHash {
  hash: string
  sig: Hash
  data: Hash
}

export interface RecordMetadata {
  user?: Hash
  site?: Hash
  link?: Hash
  tag?: string
  time?: number
  type?: string
  version?: string
  network?: string
}

export interface RecordContent {
  content: string
}

export type Record = RecordHash & RecordMetadata & RecordContent

export interface ArcjetPartialRecord {
  hash: string
  record: string
}

export interface QueryOptions {
  limit?: number
  offset?: number
}

export type IFind = RecordMetadata & QueryOptions

export interface IUpdate {
  hash: string
  user: string
  site: string
  link: string
  data: string
  tag: string
  length: number
}
