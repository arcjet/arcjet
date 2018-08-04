import test from 'ava'
import * as got from 'got'

const host = 'localhost:3000'

test.before(async () => {
  await got.post(`http://${host}/`, {
    body: 'thing1',
  })
  await got.post(`http://${host}/`, {
    body: 'thing2',
  })
})

test('store sets a value and returns expected SHA3', async t => {
  const res = await got.post(`http://${host}/`, {
    body: 'thing',
  })

  t.is(
    res.body,
    '36f028580bb02cc8272a9a020f4200e346e276ae664e45ee80745574e2f5ab80'
  )
})

test('store gets first fixture value by SHA3', async t => {
  const hash0 =
    '617e56dffc6cb2db4d39f270028f8b6ef74c5cbe201950b31b5ab99fc27d9c02'
  const res = await got.get(`http://localhost:3000/${hash0}`)
  // t.is(hash, '617e56dffc6cb2db4d39f270028f8b6ef74c5cbe201950b31b5ab99fc27d9c02')
  t.is(res.body, 'thing1')
})

// test('store gets last fixture value by SHA3', async t => {
//   const store = new Store()
//   await store.init(path.resolve(__dirname, './test/fixture.db'))

//   const {hash, data} = await store.get(
//     '908a6a158ef3494ff6b733f83055624acbce8de649ca5240af68d43cb637dbfc'
//   )
//   t.is(hash, '908a6a158ef3494ff6b733f83055624acbce8de649ca5240af68d43cb637dbfc')
//   t.is(data, 'thing2')
// })
