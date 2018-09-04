import {HashInt, HashBool} from './types'

// Careful, any changes must be accompanied by a major release, and migrated.
export const FieldPositions: HashInt = {
  hash: 64 * 0,
  sig: 64 * 1,
  user: 64 * 2,
  site: 64 * 3,
  link: 64 * 4,
  data: 64 * 5,
  tag: 64 * 6,
  time: 16 * 0 + 64 * 7,
  type: 16 * 1 + 64 * 7,
  version: 16 * 2 + 64 * 7,
  network: 16 * 3 + 64 * 7,
  content: 16 * 4 + 64 * 7,
}

export const ByteLengths: HashInt = {
  hash: 64,
  sig: 64,
  user: 64,
  site: 64,
  link: 64,
  data: 64,
  tag: 64,
  time: 16,
  type: 16,
  version: 16,
  network: 16,
}

export const MetadataLength = 64 * 7 + 16 * 4

export const TrimmedFields: HashBool = {
  encoding: true,
  type: true,
  tag: true,
  version: true,
  network: true,
}
