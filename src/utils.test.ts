import test from 'ava'

import {getFixedHex} from './utils'

test('date is represented as a fixed-length hexadecimal integer', t => {
  const date = 1533859068177
  const hex = getFixedHex(date, 16)
  t.is(typeof hex, 'string')
  t.is(hex.length, 16)
  t.is(parseInt('0x' + hex, 16), date)
})
