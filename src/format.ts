import {Record} from './types'
import {getFixedHex} from './client_utils'

export const parseRecord = (recordString: string): ArcjetRecord => {
  const [
    recordHash, // 64
    signature, // 64
    userHash, // 64
    siteHash, // 64
    linkHash, // 64
    dataHash, // 64
    tag, // 64
    encoding, // 32
    type, // 32
    version, //
    network, //
    time, //
    data, //
  ] = recordString.split('\t')

  return {
    recordHash,
    signature,
    userHash,
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
  hash,
  sig,
  user,
  site,
  link,
  data,
  tag,
  time,
  type,
  version,
  network,
  content,
}: Record): Uint8Array => new Uint8Array([...hash])

export const formatRecord = ({recordHash, recordString}: ArcjetPartialRecord) =>
  `${recordHash}\t${recordString}`
