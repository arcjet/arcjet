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
  ARCJET_USER_HASH: string
}
export enum ArcjetStorageKeys {
  ARCJET_PRIVATE_KEY = 'ARCJET_PRIVATE_KEY',
  ARCJET_PUBLIC_KEY = 'ARCJET_PUBLIC_KEY',
  ARCJET_USER_HASH = 'ARCJET_USER_HASH',
}
export type FalsyArcjetStorage = ArcjetStorage | undefined

export type FalsyString = string | false
export type HashInt = {[hash: string]: number}
export type HashHash = {[hash: string]: Hash}
export type HashSet = {[hash: string]: Set<Hash>}

export interface RecordHash {
  hash: string
  sig: Hash
  data: Hash
}

export interface RecordMetadata {
  user: Hash
  site: Hash
  link: Hash
  tag: string
  time: number
  type: string
  version: string
  network: string
}

export interface RecordContent {
  content: string
}

export enum ByteLengths {
  hash = 64,
  sig = 64,
  user = 64,
  site = 64,
  link = 64,
  data = 64,
  tag = 64,
  time = 16,
  type = 16,
  version = 16,
  network = 16,
  content = 7 * 64 + 16 * 4,
}

export type Record = RecordHash & RecordMetadata & RecordContent

export interface ArcjetPartialRecord {
  hash: string
  record: string
}

export interface IFind {
  user?: Hash
  site?: Hash
  link?: Hash
  data?: Hash
  tag?: string
  limit?: number
  offset?: number
}

export interface ISet {
  tag?: Hash
  link?: Hash
  site?: Hash
  version?: string
  network?: string
  type?: string
}

export interface IUpdate {
  hash: string
  user: string
  site: string
  link: string
  data: string
  tag: string
  length: number
}
