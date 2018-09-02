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
  ARCJET_OWNER_HASH: string
}
export enum ArcjetStorageKeys {
  ARCJET_OWNER_HASH = 'ARCJET_OWNER_HASH',
  ARCJET_PUBLIC_KEY = 'ARCJET_PUBLIC_KEY',
  ARCJET_PRIVATE_KEY = 'ARCJET_PRIVATE_KEY',
}
export type FalsyArcjetStorage = ArcjetStorage | undefined

export type FalsyString = string | false
export type HashInt = {[hash: string]: number}
export type HashHash = {[hash: string]: Hash}
export type HashSet = {[hash: string]: Set<Hash>}

export interface ArcjetRecord {
  recordHash: string
  signature: string
  ownerHash: string
  siteHash: string
  linkHash: string
  dataHash: string
  encoding: string
  type: string
  tag: string
  version: string
  network: string
  time: number
  data: string
}

export interface ArcjetDataRecord {
  signature: Signature
  ownerHash: Hash
  siteHash: Hash
  linkHash: Hash
  dataHash: Hash
  encoding: string
  type: string
  tag: string
  version: string
  network: string
  time: number
  data: string
}

export interface ArcjetPartialRecord {
  recordHash: string
  recordString: string
}

export interface IFind {
  ownerHash?: Hash
  siteHash?: Hash
  linkHash?: Hash
  dataHash?: Hash
  tag?: string
  limit?: number
  offset?: number
}

export interface ISet {
  data: string
  tag: string
  version?: string
  network?: string
  linkHash?: Hash
  siteHash?: Hash
  encoding?: string
  type?: string
}

export interface IUpdate {
  recordHash: string
  ownerHash: string
  siteHash: string
  linkHash: string
  dataHash: string
  tag: string
  length: number
}
