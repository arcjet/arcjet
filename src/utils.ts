// TODO Node/Browser polyfills go here
import * as nacl from 'tweetnacl'

import {hexToBytes, bytesToHex} from './client_utils'

export const hashAsByteArray = (data: string): Uint8Array =>
  nacl.hash(hexToBytes(data))

export const hashAsString = (data: string): string =>
  bytesToHex(hashAsByteArray(data))
