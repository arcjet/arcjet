import test from 'ava'

import {hexToBytes, bytesToHex} from './client_utils'

test('hexToBytes', t => {
  t.is(
    hexToBytes('f0000fff').toString(),
    Uint8Array.from([240, 0, 15, 255]).toString()
  )
})

test('bytesToHex', t => {
  t.is(bytesToHex(Uint8Array.from([240, 0, 15, 255])), 'f0000fff')
})

test('hexToBytes -> bytesToHex', t => {
  t.is(bytesToHex(hexToBytes('f0000fff')), 'f0000fff')
})
