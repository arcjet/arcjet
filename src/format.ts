import {ArcjetRecord, ArcjetDataRecord, ArcjetPartialRecord} from './types'
import {getFixedHex} from './client_utils'

export const parseRecord = (recordString: string): ArcjetRecord => {
  const [
    recordHash,
    signature,
    ownerHash,
    siteHash,
    linkHash,
    dataHash,
    encoding,
    type,
    tag,
    version,
    network,
    time,
    data,
  ] = recordString.split('\t')

  return {
    recordHash,
    signature,
    ownerHash,
    siteHash,
    linkHash,
    dataHash,
    encoding: encoding.trim(),
    type: type.trim(),
    tag: tag.trim(),
    version: version.trim(),
    network: network.trim(),
    time: parseInt(time, 16),
    data,
  }
}

export const formatDataRecord = ({
  signature,
  ownerHash,
  siteHash,
  linkHash,
  dataHash,
  encoding,
  type,
  tag,
  version,
  network,
  time,
  data,
}: ArcjetDataRecord): string =>
  [
    signature, // 128
    ownerHash, // 128
    siteHash, // 128
    linkHash, // 128
    dataHash, // 128
    tag.padEnd(128, ' '), // 128
    encoding.padEnd(32, ' '), // 32
    type.padEnd(32, ' '), // 32
    version.padEnd(32, ' '), // 32
    network.padEnd(32, ' '), // 32
    getFixedHex(time, 16), // 16
    data, // <1000000000 (1GB)
  ].join('\t')

export const formatRecord = ({recordHash, recordString}: ArcjetPartialRecord) =>
  `${recordHash}\t${recordString}`
