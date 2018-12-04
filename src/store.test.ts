import test from 'ava'
import * as got from 'got'
import { parseRecord } from './parser'

const host = '127.0.0.1:3000'

let thing1: string
let thing2: string
let testCookies: string
let ARCJET_OWNER_HASH: string

test.before(async () => {
  const generate = await got.get(`http://${host}/generate`)
  testCookies = (generate.headers['set-cookie'] || []).join(';')
  ARCJET_OWNER_HASH = ''

  const { body: body1 } = await got.post(`http://${host}/store/test`, {
    body: 'thing1',
    headers: {
      cookie: testCookies,
    },
  })
  const { body: body2 } = await got.post(`http://${host}/store/test`, {
    body: 'thing2',
    headers: {
      cookie: testCookies,
    },
  })
  thing1 = body1
  thing2 = body2
})

test.serial('store sets a value and returns expected SHA3', async t => {
  const res = await got.post(`http://${host}/store/test`, {
    body: 'thing',
    headers: {
      cookie: testCookies,
    },
  })

  t.is(res.body.length, 64)

  const record = await got.get(`http://${host}/store/${res.body}`)

  t.is(
    parseRecord(record.body).dataHash,
    '7f9a89bf4717a0dd75a744f89f5d27eb40bf28654c895dc103f5f280497a432bcf79001b7dc4d76f1e4453308bb15842a840f4e2f0ac1c920fc19be45c6e0fa9',
  )
})

test('store gets first fixture value by SHA3', async t => {
  const res = await got.get(`http://${host}/store/${thing1}`)
  t.is(parseRecord(res.body).data, 'thing1')
})

test('store gets last fixture value by SHA3', async t => {
  const res = await got.get(`http://${host}/store/${thing2}`)
  t.is(parseRecord(res.body).data, 'thing2')
})

test.serial('store finds records by tag', async t => {
  const res = await got.get(`http://${host}/find/${ARCJET_OWNER_HASH}/test`)
  const records = JSON.parse(res.body)
  t.is(records.length >= 2, true)
})
